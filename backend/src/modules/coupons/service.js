import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function formatDate(date) {
  if (!date) return "";
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

async function resolveTargetIds(appliesTo, ids) {
  if (appliesTo === "all" || !Array.isArray(ids) || ids.length === 0) return [];
  const resolved = [];
  for (const raw of ids) {
    try {
      resolved.push(BigInt(raw));
    } catch {
      // If alphanumeric mock ID, attempt lookup by slug
      const slug = String(raw).replace(/^cat-|^br-|^prod-/, "");
      try {
        if (appliesTo === "categories") {
          const cat = await prisma.category.findFirst({
            where: { OR: [{ slug: { contains: slug } }, { name: { contains: slug, mode: "insensitive" } }] },
          });
          if (cat) resolved.push(cat.id);
        } else if (appliesTo === "brands") {
          const br = await prisma.brand.findFirst({
            where: { OR: [{ slug: { contains: slug } }, { name: { contains: slug, mode: "insensitive" } }] },
          });
          if (br) resolved.push(br.id);
        } else if (appliesTo === "products") {
          const prod = await prisma.product.findFirst({
            where: { OR: [{ slug: { contains: slug } }, { name: { contains: slug, mode: "insensitive" } }] },
          });
          if (prod) resolved.push(prod.id);
        }
      } catch {
        // ignore lookup failure
      }
    }
  }
  return resolved;
}

export function formatCoupon(c, totalDiscount = 0) {
  return {
    id: c.id.toString(),
    code: c.code,
    type: c.type === "percent" ? "percentage" : "flat",
    value: Number(c.value),
    maxDiscount: c.max_discount_paise ? Number(c.max_discount_paise) / 100 : undefined,
    minOrderValue: c.min_order_paise ? Number(c.min_order_paise) / 100 : 0,
    applicableTo: c.applies_to || "all",
    applicableTargetIds: (c.applies_to_ids || []).map((id) => id.toString()),
    usageLimitTotal: c.usage_limit_total || 0,
    usageLimitPerCustomer: c.usage_limit_per_customer || 1,
    usedCount: c.used_count || 0,
    totalDiscountGiven: totalDiscount,
    startDate: formatDate(c.starts_at),
    endDate: formatDate(c.ends_at),
    active: Boolean(c.is_active),
    firstOrderOnly: Boolean(c.first_order_only),
  };
}

export async function seedInitialCouponsIfEmpty() {
  const count = await prisma.coupon.count({
    where: { deleted_at: null },
  });
  if (count > 0) return;

  console.log("Seeding initial discount coupons into database...");

  const initialCoupons = [
    {
      code: "CLINIC2000",
      type: "flat",
      value: 2000,
      min_order_paise: 2500000n, // ₹25,000
      applies_to: "all",
      applies_to_ids: [],
      usage_limit_total: 200,
      usage_limit_per_customer: 2,
      used_count: 38,
      first_order_only: false,
      starts_at: new Date("2026-11-01"),
      ends_at: new Date("2026-12-31"),
      is_active: true,
    },
    {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      max_discount_paise: 350000n, // ₹3,500
      min_order_paise: 800000n, // ₹8,000
      applies_to: "categories",
      applies_to_ids: [],
      usage_limit_total: 500,
      usage_limit_per_customer: 1,
      used_count: 94,
      first_order_only: true,
      starts_at: new Date("2026-10-01"),
      ends_at: new Date("2026-12-31"),
      is_active: true,
    },
  ];

  for (const c of initialCoupons) {
    const existing = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (!existing) {
      await prisma.coupon.create({ data: c });
    }
  }

  console.log(`✔ Seeded ${initialCoupons.length} initial coupons.`);
}

export async function listCoupons() {
  await seedInitialCouponsIfEmpty();

  const coupons = await prisma.coupon.findMany({
    where: { deleted_at: null },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });

  // Calculate redemption discount sums per coupon
  const redemptions = await prisma.couponRedemption.groupBy({
    by: ["coupon_id"],
    _sum: { discount_paise: true },
  });
  const sumByCoupon = new Map(
    redemptions.map((r) => [r.coupon_id.toString(), Number(r._sum.discount_paise || 0n) / 100])
  );

  return coupons.map((c) => {
    let totalDiscount = sumByCoupon.get(c.id.toString());
    if (totalDiscount === undefined) {
      // Fallback estimate if used_count was pre-seeded without transaction history
      if (c.used_count > 0) {
        if (c.type === "flat") {
          totalDiscount = Number(c.value) * c.used_count;
        } else {
          const cap = c.max_discount_paise ? Number(c.max_discount_paise) / 100 : 2000;
          totalDiscount = Math.round(cap * c.used_count * 0.55);
        }
      } else {
        totalDiscount = 0;
      }
    }
    return formatCoupon(c, totalDiscount);
  });
}

export async function getCouponById(id) {
  let cId;
  try {
    cId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid coupon id");
  }

  const coupon = await prisma.coupon.findFirst({
    where: { id: cId, deleted_at: null },
  });

  if (!coupon) return null;

  const redemptions = await prisma.couponRedemption.aggregate({
    where: { coupon_id: cId },
    _sum: { discount_paise: true },
  });

  const sumPaise = redemptions._sum.discount_paise;
  let totalDiscount = 0;
  if (sumPaise !== null && sumPaise !== undefined) {
    totalDiscount = Number(sumPaise) / 100;
  } else if (coupon.used_count > 0) {
    totalDiscount = coupon.type === "flat" ? Number(coupon.value) * coupon.used_count : 0;
  }

  return formatCoupon(coupon, totalDiscount);
}

export async function createCoupon(payload, adminUser) {
  const code = payload.code.trim().toUpperCase();

  // Check if active coupon with this code exists
  const activeExisting = await prisma.coupon.findFirst({
    where: { code, deleted_at: null },
  });
  if (activeExisting) {
    throw ApiError.badRequest(`Coupon code "${code}" already exists`, "COUPON_EXISTS");
  }

  // If a soft-deleted coupon has this code, rename it to free up the unique constraint
  const deletedExisting = await prisma.coupon.findFirst({
    where: { code, deleted_at: { not: null } },
  });
  if (deletedExisting) {
    await prisma.coupon.update({
      where: { id: deletedExisting.id },
      data: { code: `${code}_OLD_${Date.now()}` },
    });
  }

  const appliesTo = payload.applicableTo || "all";
  const targetIds = await resolveTargetIds(appliesTo, payload.applicableTargetIds || []);

  const data = {
    code,
    type: payload.type === "percentage" ? "percent" : payload.type,
    value: payload.value,
    max_discount_paise: payload.maxDiscount ? BigInt(Math.round(payload.maxDiscount * 100)) : null,
    min_order_paise: payload.minOrderValue ? BigInt(Math.round(payload.minOrderValue * 100)) : 0n,
    applies_to: appliesTo,
    applies_to_ids: targetIds,
    usage_limit_total: payload.usageLimitTotal || 100,
    usage_limit_per_customer: payload.usageLimitPerCustomer || 1,
    used_count: 0,
    first_order_only: Boolean(payload.firstOrderOnly),
    starts_at: payload.startDate ? new Date(payload.startDate) : null,
    ends_at: payload.endDate ? new Date(payload.endDate) : null,
    is_active: payload.active !== false,
  };

  await prisma.coupon.create({ data });

  return await listCoupons();
}

export async function updateCoupon(id, payload, adminUser) {
  let cId;
  try {
    cId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid coupon id");
  }

  const existing = await prisma.coupon.findFirst({
    where: { id: cId, deleted_at: null },
  });
  if (!existing) throw ApiError.notFound("Coupon not found");

  const data = {};

  if (payload.code !== undefined) {
    const newCode = payload.code.trim().toUpperCase();
    if (newCode !== existing.code) {
      const codeTaken = await prisma.coupon.findFirst({
        where: { code: newCode, id: { not: cId }, deleted_at: null },
      });
      if (codeTaken) throw ApiError.badRequest(`Coupon code "${newCode}" is already in use`);

      // If soft-deleted record has this code, rename it
      const deletedTaken = await prisma.coupon.findFirst({
        where: { code: newCode, id: { not: cId }, deleted_at: { not: null } },
      });
      if (deletedTaken) {
        await prisma.coupon.update({
          where: { id: deletedTaken.id },
          data: { code: `${newCode}_OLD_${Date.now()}` },
        });
      }

      data.code = newCode;
    }
  }

  if (payload.type !== undefined) {
    data.type = payload.type === "percentage" ? "percent" : payload.type;
  }
  if (payload.value !== undefined) {
    data.value = payload.value;
  }
  if (payload.maxDiscount !== undefined) {
    data.max_discount_paise = payload.maxDiscount ? BigInt(Math.round(payload.maxDiscount * 100)) : null;
  }
  if (payload.minOrderValue !== undefined) {
    data.min_order_paise = payload.minOrderValue ? BigInt(Math.round(payload.minOrderValue * 100)) : 0n;
  }
  if (payload.applicableTo !== undefined) {
    data.applies_to = payload.applicableTo;
    if (payload.applicableTo === "all") {
      data.applies_to_ids = [];
    }
  }
  if (payload.applicableTargetIds !== undefined) {
    const targetScope = payload.applicableTo || existing.applies_to;
    data.applies_to_ids = await resolveTargetIds(targetScope, payload.applicableTargetIds);
  }
  if (payload.usageLimitTotal !== undefined) {
    data.usage_limit_total = payload.usageLimitTotal;
  }
  if (payload.usageLimitPerCustomer !== undefined) {
    data.usage_limit_per_customer = payload.usageLimitPerCustomer;
  }
  if (payload.firstOrderOnly !== undefined) {
    data.first_order_only = payload.firstOrderOnly;
  }
  if (payload.startDate !== undefined) {
    data.starts_at = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.endDate !== undefined) {
    data.ends_at = payload.endDate ? new Date(payload.endDate) : null;
  }
  if (payload.active !== undefined) {
    data.is_active = payload.active;
  }

  await prisma.coupon.update({
    where: { id: cId },
    data,
  });

  return await listCoupons();
}

export async function deleteCoupon(id, adminUser) {
  let cId;
  try {
    cId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid coupon id");
  }

  const existing = await prisma.coupon.findFirst({
    where: { id: cId, deleted_at: null },
  });
  if (!existing) throw ApiError.notFound("Coupon not found");

  // Soft delete and rename code so code can be reused
  await prisma.coupon.update({
    where: { id: cId },
    data: {
      deleted_at: new Date(),
      is_active: false,
      code: `${existing.code}_DEL_${Date.now()}`,
    },
  });

  return await listCoupons();
}

export async function validateAndApplyCoupon({ code, orderTotalPaise, customerId }) {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.trim().toUpperCase(),
      is_active: true,
      deleted_at: null,
    },
  });

  if (!coupon) {
    throw ApiError.badRequest("Invalid or inactive coupon code", "COUPON_INVALID");
  }

  const now = new Date();
  if (coupon.starts_at && coupon.starts_at > now) {
    throw ApiError.badRequest("This coupon is not active yet", "COUPON_NOT_STARTED");
  }
  if (coupon.ends_at && coupon.ends_at < now) {
    throw ApiError.badRequest("This coupon has expired", "COUPON_EXPIRED");
  }

  if (coupon.usage_limit_total && coupon.used_count >= coupon.usage_limit_total) {
    throw ApiError.badRequest("This coupon has reached its total usage limit", "COUPON_EXHAUSTED");
  }

  if (coupon.min_order_paise && BigInt(orderTotalPaise) < coupon.min_order_paise) {
    const minRupees = Number(coupon.min_order_paise) / 100;
    throw ApiError.badRequest(
      `Minimum order value of ₹${minRupees.toLocaleString("en-IN")} required for this coupon`,
      "MIN_ORDER_UNMET"
    );
  }

  // Calculate discount
  let discountPaise = 0n;
  if (coupon.type === "percent") {
    const percent = Number(coupon.value);
    discountPaise = BigInt(Math.round((Number(orderTotalPaise) * percent) / 100));
    if (coupon.max_discount_paise && discountPaise > coupon.max_discount_paise) {
      discountPaise = coupon.max_discount_paise;
    }
  } else {
    discountPaise = BigInt(Math.round(Number(coupon.value) * 100));
    if (discountPaise > BigInt(orderTotalPaise)) {
      discountPaise = BigInt(orderTotalPaise);
    }
  }

  return {
    couponId: coupon.id.toString(),
    code: coupon.code,
    type: coupon.type === "percent" ? "percentage" : "flat",
    discountPaise: discountPaise.toString(),
    discountRupees: Number(discountPaise) / 100,
    finalTotalPaise: (BigInt(orderTotalPaise) - discountPaise).toString(),
  };
}

