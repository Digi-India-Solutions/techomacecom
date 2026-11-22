import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { formatINR } from "../../lib/money.js";
import { publicUrl } from "../../lib/storage.js";
import { getGroup } from "../settings/service.js";
import { STATE_OPTIONS } from "../settings/definitions.js";
import { addPeriods, dateOnly, periodLabel, quoteRental, todayIST, ymd } from "./pricing.js";
import { history } from "./service.js";

/**
 * Admin → Rentals → "+ New rental": enter a rental by hand (phone / walk-in bookings, or old rentals
 * from before the website). The customer is matched by email — an existing account sees the rental
 * in My Rentals; otherwise a new customer account is created (they can set a password with
 * "Forgot password" on the website).
 */

const PERIOD_ORDER = { daily: 0, weekly: 1, monthly: 2 };

export async function formOptions() {
  const products = await prisma.product.findMany({
    where: { rent_enabled: true, deleted_at: null, rental_plans: { some: { is_active: true } } },
    select: {
      id: true,
      name: true,
      sku: true,
      gst_rate: true,
      images: { select: { url: true }, orderBy: { sort_order: "asc" }, take: 1 },
      rental_plans: { where: { is_active: true } },
      rental_units: {
        where: { status: "available", condition: { in: ["new", "good"] } },
        select: { id: true, unit_code: true, serial_number: true, condition: true },
        orderBy: { unit_code: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const tax = await getGroup("tax");
  return {
    gstEnabled: tax.gstEnabled,
    states: STATE_OPTIONS.map((st) => st.name),
    products: products.map((p) => ({
      id: String(p.id),
      name: p.name,
      sku: p.sku,
      image: publicUrl(p.images[0]?.url) || "",
      gstRate: Number(p.gst_rate),
      plans: [...p.rental_plans]
        .sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period])
        .map((pl) => ({
          period: pl.period,
          rate: Number(pl.price_paise) / 100,
          minPeriods: pl.min_periods,
          maxPeriods: pl.max_periods,
          deposit: Number(pl.security_deposit_paise) / 100,
          delivery: Number(pl.delivery_pickup_paise) / 100,
        })),
      units: p.rental_units.map((u) => ({ id: String(u.id), unitCode: u.unit_code, serialNumber: u.serial_number, condition: u.condition })),
    })),
  };
}

const addressDto = (a) => ({
  id: String(a.id),
  type: a.type,
  name: a.name,
  phone: a.phone,
  organisation: a.organisation_name || "",
  line1: a.line1,
  line2: a.line2 || "",
  landmark: a.landmark || "",
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  isDefault: a.is_default,
});

export async function lookupCustomer(email) {
  const c = await prisma.customer.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deleted_at: null },
    include: { addresses: { orderBy: [{ is_default: "desc" }, { id: "asc" }] }, _count: { select: { rentals: true, orders: true } } },
  });
  if (!c) return { found: false };
  return {
    found: true,
    customer: {
      id: String(c.id),
      name: c.name || "",
      email: c.email,
      mobile: c.mobile || "",
      status: c.status,
      rentals: c._count.rentals,
      orders: c._count.orders,
      addresses: c.addresses.map(addressDto),
    },
  };
}

async function nextRentalNumber(tx) {
  const last = await tx.rental.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  return `RNT-${new Date().getFullYear()}-${String(Number(last?.id || 0n) + 1).padStart(5, "0")}`;
}

/**
 * @param input validated by manualRentalSchema (money already in paise)
 */
export async function createManualRental(input, admin) {
  const [product, tax] = await Promise.all([
    prisma.product.findFirst({ where: { id: BigInt(input.productId), deleted_at: null }, include: { rental_plans: { where: { is_active: true } } } }),
    getGroup("tax"),
  ]);
  if (!product || !product.rent_enabled) throw ApiError.badRequest("Choose a product that is available on rent", "VALIDATION_ERROR", { productId: "Not rentable" });
  const plan = product.rental_plans.find((p) => p.period === input.period);
  if (!plan) throw ApiError.badRequest("This product has no plan for that period", "VALIDATION_ERROR", { period: "Not available" });

  const start = dateOnly(input.startDate);
  const end = addPeriods(start, input.period, input.periods);
  const today = dateOnly(todayIST());
  if (input.status === "approved" && start < today) {
    throw ApiError.badRequest("An upcoming rental cannot start in the past — choose “Active” or “Completed” for old rentals", "VALIDATION_ERROR", { startDate: "In the past" });
  }
  if (input.status !== "approved" && start > today) {
    throw ApiError.badRequest("An active or completed rental must have started already", "VALIDATION_ERROR", { startDate: "In the future" });
  }

  // Prices: the plan's, unless staff typed the price agreed at the time
  const pricedPlan = {
    price_paise: input.rate ?? plan.price_paise,
    security_deposit_paise: input.deposit ?? plan.security_deposit_paise,
    delivery_pickup_paise: input.delivery ?? plan.delivery_pickup_paise,
  };
  const q = quoteRental({ plan: pricedPlan, gstRate: product.gst_rate, periods: input.periods, rental: { advancePaymentPercent: 100 }, tax: { gstEnabled: tax.gstEnabled && input.chargeGst } });
  const paid = input.payment?.amount ?? 0n;
  if (paid > q.total) throw ApiError.badRequest(`Amount paid cannot be more than the booking total of ${formatINR(q.total)}`, "VALIDATION_ERROR", { "payment.amount": "Too high" });
  if (input.status === "completed" && input.completion.depositRefund > q.deposit) {
    throw ApiError.badRequest(`Deposit refund cannot be more than the deposit of ${formatINR(q.deposit)}`, "VALIDATION_ERROR", { "completion.depositRefund": "Too high" });
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1 — customer (matched by email)
    let customer = await tx.customer.findFirst({ where: { email: { equals: input.customer.email, mode: "insensitive" }, deleted_at: null } });
    let customerCreated = false;
    if (customer) {
      if (customer.status === "blocked") throw ApiError.conflict("This customer account is blocked");
      const patch = {};
      if (!customer.name && input.customer.name) patch.name = input.customer.name;
      if (!customer.mobile && input.customer.mobile) {
        const taken = await tx.customer.findFirst({ where: { mobile: input.customer.mobile, id: { not: customer.id } } });
        if (!taken) patch.mobile = input.customer.mobile;
      }
      if (Object.keys(patch).length) customer = await tx.customer.update({ where: { id: customer.id }, data: patch });
    } else {
      if (input.customer.mobile) {
        const taken = await tx.customer.findFirst({ where: { mobile: input.customer.mobile }, select: { email: true, name: true } });
        if (taken) {
          throw ApiError.conflict(
            `Mobile ${input.customer.mobile} already belongs to another customer${taken.email ? ` (${taken.email})` : ""}. Use that email, or a different mobile.`,
            "MOBILE_TAKEN",
            { "customer.mobile": "Already used" }
          );
        }
      }
      customer = await tx.customer.create({
        data: { name: input.customer.name, email: input.customer.email, mobile: input.customer.mobile || null, customer_type: input.customer.type || "individual" },
      });
      customerCreated = true;
    }

    // 2 — delivery address (saved to the customer's address book)
    let address;
    if (input.addressId) {
      address = await tx.address.findFirst({ where: { id: BigInt(input.addressId), customer_id: customer.id } });
      if (!address) throw ApiError.badRequest("That address does not belong to this customer", "VALIDATION_ERROR", { addressId: "Not found" });
    } else {
      const count = await tx.address.count({ where: { customer_id: customer.id } });
      const a = input.address;
      address = await tx.address.create({
        data: {
          customer_id: customer.id,
          type: a.type,
          name: a.name,
          phone: a.phone,
          organisation_name: a.organisation || null,
          line1: a.line1,
          line2: a.line2 || null,
          landmark: a.landmark || null,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          is_default: count === 0,
        },
      });
    }
    const snapshot = {
      name: address.name,
      phone: address.phone,
      organisation_name: address.organisation_name,
      line1: address.line1,
      line2: address.line2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type: address.type,
    };

    // 3 — unit (active rentals: the machine at the customer's place)
    let unit = null;
    if (input.unitId) {
      unit = await tx.rentalUnit.findUnique({ where: { id: BigInt(input.unitId) } });
      if (!unit || unit.product_id !== product.id) throw ApiError.badRequest("Choose a unit of this product", "VALIDATION_ERROR", { unitId: "Wrong product" });
      if (input.status !== "completed" && unit.status !== "available") {
        throw ApiError.conflict(`Unit ${unit.unit_code} is ${unit.status.replace(/_/g, " ")}, not available`);
      }
    }

    // 4 — the rental
    // completed: deposit refund already paid → "Completed"; still to pay → "Returned" (refund it from the rental page)
    const status =
      input.status === "approved"
        ? "approved"
        : input.status === "active"
          ? end < today
            ? "overdue"
            : "active"
          : input.completion.depositRefund > 0n && input.completion.refundMethod === "pending"
            ? "returned"
            : "deposit_refunded";
    const returnedOn = input.status === "completed" ? dateOnly(input.completion.returnedOn) : null;
    const rental = await tx.rental.create({
      data: {
        rental_number: await nextRentalNumber(tx),
        customer_id: customer.id,
        product_id: product.id,
        rental_plan_id: plan.id,
        rental_unit_id: unit?.id ?? null,
        product_name: product.name,
        period: plan.period,
        periods: input.periods,
        rate_paise: q.rate,
        rent_paise: q.rent,
        deposit_paise: q.deposit,
        charges_paise: q.delivery,
        tax_paise: q.gst,
        total_paid_paise: paid,
        requested_start_date: start,
        start_date: input.status === "approved" ? null : start,
        end_date: end,
        delivery_address: snapshot,
        status,
        advance_percent: 100,
        advance_paise: q.total,
        balance_due: "before_dispatch",
        kyc_required_docs: [],
        kyc_status: null,
        delivered_at: input.status === "approved" ? null : start,
        returned_at: returnedOn,
        return_condition: input.status === "completed" ? input.completion.condition : null,
        deposit_refund_paise: input.status === "completed" ? input.completion.depositRefund : null,
        deposit_refunded_at: status === "deposit_refunded" ? returnedOn : null,
        notes_internal: JSON.stringify([
          { text: `Entered manually${input.note ? `: ${input.note}` : ""}`, by: admin.name, at: new Date().toISOString() },
        ]),
        charges: {
          create: [
            { type: "rent", direction: "debit", amount_paise: q.rent + q.gst, description: `${periodLabel(plan.period, input.periods)} × ${formatINR(q.rate)}${q.gst > 0n ? ` + GST ${q.gstRate}%` : ""}`, admin_user_id: admin.id },
            ...(q.delivery > 0n ? [{ type: "delivery_pickup", direction: "debit", amount_paise: q.delivery, description: "Delivery, installation & pickup", admin_user_id: admin.id }] : []),
            ...(q.deposit > 0n ? [{ type: "deposit", direction: "debit", amount_paise: q.deposit, description: "Refundable security deposit", admin_user_id: admin.id }] : []),
          ],
        },
      },
    });

    // 5 — money received
    if (paid > 0n) {
      await tx.payment.create({
        data: {
          rental_id: rental.id,
          purpose: "rental_booking",
          gateway: "manual",
          method: input.payment.method,
          amount_paise: paid,
          status: "captured",
          captured_at: input.payment.paidOn ? dateOnly(input.payment.paidOn) : new Date(),
          raw_response: { reference: input.payment.reference || null, recordedBy: admin.name, manualEntry: true },
        },
      });
    }
    if (status === "deposit_refunded" && input.completion.depositRefund > 0n) {
      const refund = await tx.refund.create({
        data: {
          rental_id: rental.id,
          amount_paise: input.completion.depositRefund,
          reason: "deposit_refund",
          method: input.completion.refundMethod === "upi" ? "upi" : "bank_transfer",
          reference: input.completion.refundReference || "Recorded manually",
          status: "processed",
          processed_at: returnedOn,
          admin_user_id: admin.id,
          note: "Old rental entered manually",
        },
      });
      await tx.rentalCharge.create({
        data: { rental_id: rental.id, type: "deposit_refund", direction: "credit", amount_paise: input.completion.depositRefund, refund_id: refund.id, admin_user_id: admin.id },
      });
    }
    if (input.status === "completed" && q.deposit > input.completion.depositRefund) {
      await tx.rentalCharge.create({
        data: { rental_id: rental.id, type: "damage", direction: "debit", amount_paise: q.deposit - input.completion.depositRefund, description: "Deposit deductions (entered manually)", admin_user_id: admin.id },
      });
    }

    // 6 — unit state
    if (unit && input.status !== "completed") {
      await tx.rentalUnit.update({
        where: { id: unit.id },
        data: { status: input.status === "active" ? "with_customer" : "reserved", current_rental_id: rental.id },
      });
    }

    // 7 — timeline
    await tx.rentalStatusHistory.create({
      data: { rental_id: rental.id, from_status: null, to_status: "pending_approval", actor_type: "admin", actor_id: admin.id, note: `Booking entered manually by ${admin.name}`, created_at: start < today ? start : new Date() },
    });
    const r0 = { id: rental.id, status: "pending_approval" };
    if (input.status !== "approved") {
      await history(tx, r0, "active", { actorType: "admin", actorId: admin.id, note: `Delivered on ${ymd(start)} — rental runs till ${ymd(end)}`, unitId: unit?.id ?? null });
    }
    if (input.status === "completed") {
      await history(tx, { id: rental.id, status: "active" }, "returned", {
        actorType: "admin",
        actorId: admin.id,
        note: `Returned on ${ymd(returnedOn)} in ${input.completion.condition.replace("_", " ")} condition`,
        unitId: unit?.id ?? null,
      });
      if (status === "deposit_refunded") {
        await history(tx, { id: rental.id, status: "returned" }, "deposit_refunded", {
          actorType: "admin",
          actorId: admin.id,
          note: input.completion.depositRefund > 0n ? `Deposit refund of ${formatINR(input.completion.depositRefund)} recorded` : "Closed — no deposit refund",
        });
      }
    } else if (status !== "pending_approval") {
      if (input.status === "approved") await history(tx, r0, "approved", { actorType: "admin", actorId: admin.id, note: "Confirmed" });
    }
    if (paid > 0n) {
      await history(tx, { id: rental.id, status }, status, {
        actorType: "admin",
        actorId: admin.id,
        note: `${formatINR(paid)} received by ${input.payment.method.replace("_", " ")}${input.payment.reference ? ` (Ref ${input.payment.reference})` : ""}`,
      });
    }

    return { rental, customerCreated };
  });

  return { id: String(result.rental.id), rentalNumber: result.rental.rental_number, customerCreated: result.customerCreated };
}
