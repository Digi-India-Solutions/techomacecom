import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function toLocalIso(date) {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function formatDeal(d) {
  const v = d.variant;
  const p = v?.product;
  const img = p?.images?.find((i) => i.is_primary) || p?.images?.[0];
  const regularPrice = v ? Number(v.price_paise || 0n) / 100 : 0;
  const dealPrice = Number(d.deal_price_paise || 0n) / 100;

  return {
    id: d.id.toString(),
    productId: p ? p.id.toString() : (v?.product_id ? v.product_id.toString() : ""),
    productName: p?.name || v?.name || "Product",
    productImage: img?.url || v?.image_url || "",
    regularPrice,
    dealPrice,
    startTime: toLocalIso(d.starts_at),
    endTime: toLocalIso(d.ends_at),
    active: Boolean(d.is_active),
  };
}

export async function seedInitialDealsIfEmpty() {
  const count = await prisma.deal.count();
  if (count > 0) return;

  console.log("Seeding initial deals into database...");
  try {
    const [pChair, pOxy] = await Promise.all([
      prisma.product.findFirst({
        where: {
          OR: [{ id: 2n }, { slug: { contains: "dental" } }],
          deleted_at: null,
        },
        include: {
          variants: { where: { is_default: true } },
        },
      }),
      prisma.product.findFirst({
        where: {
          OR: [{ id: 1n }, { slug: { contains: "oxy" } }],
          deleted_at: null,
        },
        include: {
          variants: { where: { is_default: true } },
        },
      }),
    ]);

    const now = new Date();
    const plusTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const plusOneDay = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const vChair = pChair?.variants?.[0] || await prisma.productVariant.findFirst({ where: { product_id: pChair?.id } });
    if (vChair) {
      await prisma.deal.create({
        data: {
          variant_id: vChair.id,
          deal_price_paise: 16990000n, // ₹1,69,900
          starts_at: now,
          ends_at: plusTwoDays,
          is_active: true,
          sort_order: 1,
        },
      });
    }

    const vOxy = pOxy?.variants?.[0] || await prisma.productVariant.findFirst({ where: { product_id: pOxy?.id } });
    if (vOxy) {
      await prisma.deal.create({
        data: {
          variant_id: vOxy.id,
          deal_price_paise: 3950000n, // ₹39,500
          starts_at: now,
          ends_at: plusOneDay,
          is_active: false,
          sort_order: 2,
        },
      });
    }
    console.log("✔ Seeded initial deals successfully.");
  } catch (err) {
    console.warn("Could not seed initial deals:", err);
  }
}

export async function listDeals() {
  await seedInitialDealsIfEmpty();

  const deals = await prisma.deal.findMany({
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
            },
          },
        },
      },
    },
    orderBy: [{ sort_order: "asc" }, { created_at: "desc" }, { id: "desc" }],
  });

  return deals.map(formatDeal);
}

export async function getDealById(id) {
  let dId;
  try {
    dId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid deal id");
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dId },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
            },
          },
        },
      },
    },
  });

  return deal ? formatDeal(deal) : null;
}

async function findVariantForProduct(productId) {
  let pId;
  try {
    pId = BigInt(productId);
  } catch {
    // If alphanumeric, try slug lookup
    const slug = String(productId).replace(/^prod-/, "");
    const found = await prisma.product.findFirst({
      where: { OR: [{ slug: { contains: slug } }, { name: { contains: slug, mode: "insensitive" } }] },
      select: { id: true },
    });
    if (!found) throw ApiError.badRequest(`Product "${productId}" not found`);
    pId = found.id;
  }

  // Look for default variant first, otherwise any active variant
  let variant = await prisma.productVariant.findFirst({
    where: { product_id: pId, is_default: true },
  });
  if (!variant) {
    variant = await prisma.productVariant.findFirst({
      where: { product_id: pId },
      orderBy: { id: "asc" },
    });
  }

  if (!variant) {
    throw ApiError.badRequest("Selected product has no available variants");
  }

  return variant;
}

export async function createDeal(payload, adminUser) {
  const variant = await findVariantForProduct(payload.productId);

  const rawStartsAt = new Date(payload.startTime);
  const rawEndsAt = new Date(payload.endTime);
  if (isNaN(rawStartsAt.getTime()) || isNaN(rawEndsAt.getTime())) {
    throw ApiError.badRequest("Invalid start or end date format");
  }
  if (rawEndsAt <= rawStartsAt) {
    throw ApiError.badRequest("End time must be after start time");
  }

  const now = new Date();
  // If deal starts today or slightly in future due to client timezone offset (+5:30 IST), start immediately
  const startsAt = rawStartsAt <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
    ? new Date(now.getTime() - 60 * 1000)
    : rawStartsAt;

  const dealPricePaise = BigInt(Math.round(payload.dealPrice * 100));

  await prisma.deal.create({
    data: {
      variant_id: variant.id,
      deal_price_paise: dealPricePaise,
      starts_at: startsAt,
      ends_at: rawEndsAt,
      is_active: payload.active !== false,
      sort_order: payload.sortOrder || 0,
    },
  });

  return await listDeals();
}

export async function updateDeal(id, payload, adminUser) {
  let dId;
  try {
    dId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid deal id");
  }

  const existing = await prisma.deal.findUnique({ where: { id: dId } });
  if (!existing) throw ApiError.notFound("Deal not found");

  const data = {};

  if (payload.productId !== undefined) {
    const variant = await findVariantForProduct(payload.productId);
    data.variant_id = variant.id;
  }

  if (payload.dealPrice !== undefined) {
    data.deal_price_paise = BigInt(Math.round(payload.dealPrice * 100));
  }

  const now = new Date();
  if (payload.startTime !== undefined) {
    const rawStartsAt = new Date(payload.startTime);
    data.starts_at = rawStartsAt <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
      ? new Date(now.getTime() - 60 * 1000)
      : rawStartsAt;
  }

  if (payload.endTime !== undefined) {
    data.ends_at = new Date(payload.endTime);
  }

  if (payload.active !== undefined) {
    data.is_active = payload.active;
  }

  if (payload.sortOrder !== undefined) {
    data.sort_order = payload.sortOrder;
  }

  await prisma.deal.update({
    where: { id: dId },
    data,
  });

  return await listDeals();
}

export async function deleteDeal(id, adminUser) {
  let dId;
  try {
    dId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid deal id");
  }

  const existing = await prisma.deal.findUnique({ where: { id: dId } });
  if (!existing) throw ApiError.notFound("Deal not found");

  await prisma.deal.delete({ where: { id: dId } });

  return await listDeals();
}

export async function listPublicDeals() {
  const now = new Date();
  const futureAllowance = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const deals = await prisma.deal.findMany({
    where: {
      is_active: true,
      starts_at: { lte: futureAllowance },
      ends_at: { gt: now },
    },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
            },
          },
        },
      },
    },
    orderBy: [{ sort_order: "asc" }, { ends_at: "asc" }],
  });

  return deals.map(formatDeal);
}

