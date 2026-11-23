import prisma from "../../../db/db.js";
import { alertStaff } from "../../services/admin-alerts.service.js";
import { ApiError } from "../../lib/http.js";
import { formatINR } from "../../lib/money.js";
import { createOrder as createRazorpayOrder, verifyPaymentSignature } from "../../lib/razorpay.js";
import { notify } from "../../services/notification.service.js";
import { getGroup } from "../settings/service.js";
import { checkRental as checkPincode } from "../settings/pincodes.service.js";
import { KYC_DOCUMENT_TYPES } from "../settings/definitions.js";
import { issueRefund, rentalRefundSummary } from "../refunds/service.js";
import { RENTAL_INCLUDE, RENTAL_STATUS_LABEL, toCustomerRentalDto } from "./dto.js";
import { saveKycFile, deleteKycFile } from "./kyc-storage.js";
import {
  PERIOD_UNITS,
  addDays,
  addPeriods,
  capturedPaise,
  dateOnly,
  periodLabel,
  quoteExtension,
  quoteRental,
  onlineDuePaise,
  todayIST,
  ymd,
} from "./pricing.js";

/**
 * Rentals — storefront side.
 *
 *   pending_payment ─(advance paid)→ pending_approval ─(KYC ok + staff approve)→ approved ─(unit + dispatch)→ dispatched
 *   ─(delivered: rental period starts)→ active ⇄ overdue ─(pickup)→ return_scheduled ─(inspection)→ returned
 *   ─(deposit − deductions refunded)→ deposit_refunded          cancelled: any time before dispatch
 */

const DOC_LABEL = Object.fromEntries(KYC_DOCUMENT_TYPES.map((d) => [d.key, d.label]));
const OPEN_STATUSES = ["pending_payment", "pending_approval", "approved", "dispatched", "active", "extension_requested", "overdue", "return_scheduled"];
export const CANCELLABLE = ["pending_payment", "pending_approval", "approved"];

export async function loadContext() {
  const [rental, tax] = await Promise.all([getGroup("rental"), getGroup("tax")]);
  return { rental, tax };
}

export function rentalWhere(ref, customerId) {
  const r = String(ref);
  const where = /^\d+$/.test(r) ? { id: BigInt(r) } : { rental_number: r };
  if (customerId) where.customer_id = BigInt(customerId);
  return where;
}

export async function history(tx, rental, to, { actorType, actorId = null, note = null, unitId = null } = {}) {
  await tx.rentalStatusHistory.create({
    data: {
      rental_id: rental.id,
      from_status: rental.status,
      to_status: to,
      actor_type: actorType,
      actor_id: actorId,
      note: note ? String(note).slice(0, 1000) : null,
      rental_unit_id: unitId,
    },
  });
}

/** Marks active rentals past their end date as overdue (no scheduler yet — run when lists are read). */
export async function syncOverdue() {
  const today = dateOnly(todayIST());
  const late = await prisma.rental.findMany({
    where: { status: "active", end_date: { lt: today } },
    select: { id: true, status: true, end_date: true },
  });
  for (const r of late) {
    await prisma.$transaction(async (tx) => {
      await tx.rental.update({ where: { id: r.id }, data: { status: "overdue" } });
      await history(tx, r, "overdue", { actorType: "system", note: `Not returned by ${ymd(r.end_date)}` });
    });
  }
}

async function nextRentalNumber(tx) {
  const last = await tx.rental.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  return `RNT-${new Date().getFullYear()}-${String(Number(last?.id || 0n) + 1).padStart(5, "0")}`;
}

export function notifyRental(event, rental, vars = {}) {
  const c = rental.customer || {};
  notify(event, {
    email: c.email,
    mobile: c.mobile,
    vars: {
      customer_name: c.name || rental.delivery_address?.name || "Customer",
      rental_number: rental.rental_number,
      product_name: rental.product_name,
      ...vars,
    },
    entityType: "rental",
    entityId: rental.id,
  }).catch(() => undefined);
}

/** Documents a booking for this plan needs: admin's KYC list + a prescription when the product asks for one. */
export function requiredDocsFor(plan, rentalSettings) {
  const list = rentalSettings.kycRequired ? [...rentalSettings.kycDocuments] : [];
  if (plan?.prescription_required && !list.includes("prescription")) list.push("prescription");
  return list;
}

async function findRentalProduct({ productId, productSlug }) {
  const where = productId && /^\d+$/.test(String(productId)) ? { id: BigInt(productId) } : { slug: String(productSlug || productId || "") };
  const product = await prisma.product.findFirst({
    where: { ...where, deleted_at: null },
    include: { rental_plans: { where: { is_active: true } } },
  });
  if (!product || !product.rent_enabled || product.status !== "active" || product.rental_plans.length === 0) {
    throw ApiError.notFound("This product is not available on rent right now");
  }
  return product;
}

function pickPlan(product, period, periods) {
  const plan = product.rental_plans.find((p) => p.period === period);
  if (!plan) throw ApiError.badRequest(`${PERIOD_UNITS[period]?.adverb || period} rental is not available for this product`);
  if (periods < plan.min_periods || periods > plan.max_periods) {
    throw ApiError.badRequest(
      `Choose between ${periodLabel(period, plan.min_periods)} and ${periodLabel(period, plan.max_periods)}`,
      "VALIDATION_ERROR",
      { periods: "Out of range" }
    );
  }
  return plan;
}

function validateStartDate(startDate, rentalSettings) {
  const today = dateOnly(todayIST());
  const earliest = addDays(today, Number(rentalSettings.minLeadDays || 0));
  const latest = addDays(today, 90);
  const start = dateOnly(startDate);
  if (Number.isNaN(start.getTime())) throw ApiError.badRequest("Choose a start date", "VALIDATION_ERROR", { startDate: "Invalid date" });
  if (start < earliest) {
    throw ApiError.badRequest(`The earliest start date is ${ymd(earliest)}`, "VALIDATION_ERROR", { startDate: `On or after ${ymd(earliest)}` });
  }
  if (start > latest) throw ApiError.badRequest("Bookings can start at most 90 days from today", "VALIDATION_ERROR", { startDate: "Too far ahead" });
  return start;
}

const toRupees = (p) => Number(p) / 100;

/**
 * Rental "stock" = serial-numbered units that are free and rentable, minus paid bookings
 * still waiting for a unit to be assigned.
 */
export async function rentalAvailability(productId, tx = prisma) {
  const [free, waiting] = await Promise.all([
    tx.rentalUnit.count({ where: { product_id: productId, status: "available", condition: { in: ["new", "good"] } } }),
    tx.rental.count({ where: { product_id: productId, status: { in: ["pending_approval", "approved"] }, rental_unit_id: null } }),
  ]);
  return Math.max(0, free - waiting);
}

// ---------------------------------------------------------------------------
// Quote (public)
// ---------------------------------------------------------------------------

export async function quote({ productId, productSlug, period, periods, startDate, depositMode }) {
  const [product, ctx] = await Promise.all([findRentalProduct({ productId, productSlug }), loadContext()]);
  const plan = pickPlan(product, period, periods);
  const q = quoteRental({ plan, gstRate: product.gst_rate, periods, rental: ctx.rental, tax: ctx.tax, depositMode });
  const start = startDate ? dateOnly(startDate) : addDays(dateOnly(todayIST()), Number(ctx.rental.minLeadDays || 0));
  const docs = requiredDocsFor(plan, ctx.rental);
  const available = await rentalAvailability(product.id);
  return {
    productId: String(product.id),
    available,
    inStock: available > 0,
    period,
    periods,
    durationLabel: periodLabel(period, periods),
    rate: toRupees(q.rate),
    rent: toRupees(q.rent),
    delivery: toRupees(q.delivery),
    gst: toRupees(q.gst),
    gstRate: q.gstRate,
    deposit: toRupees(q.deposit),
    total: toRupees(q.total),
    depositMode: q.depositMode,
    depositByCheque: toRupees(q.depositByCheque),
    onlineTotal: toRupees(q.onlineTotal),
    advancePercent: q.advancePercent,
    payNow: toRupees(q.advance),
    balance: toRupees(q.balance),
    balanceDue: ctx.rental.balanceDue,
    startDate: ymd(start),
    endDate: ymd(addPeriods(start, period, periods)),
    earliestStartDate: ymd(addDays(dateOnly(todayIST()), Number(ctx.rental.minLeadDays || 0))),
    kyc: {
      required: docs.length > 0,
      documents: docs.map((key) => KYC_DOCUMENT_TYPES.find((d) => d.key === key)).filter(Boolean),
      instructions: ctx.rental.kycInstructions,
    },
  };
}

// ---------------------------------------------------------------------------
// KYC documents
// ---------------------------------------------------------------------------

const kycDocDto = (d) => ({
  id: String(d.id),
  docType: d.doc_type,
  label: DOC_LABEL[d.doc_type] || d.doc_type,
  fileName: d.file_name,
  mimeType: d.mime_type,
  size: d.size_bytes,
  status: d.status,
  uploadedAt: d.created_at.toISOString(),
});

/** Checkout: upload before the booking exists (attached when the booking is created). */
export async function uploadKycDocument(customerId, file, docType) {
  if (!DOC_LABEL[docType]) throw ApiError.badRequest("Choose which document this is", "VALIDATION_ERROR", { docType: "Unknown document type" });
  const saved = await saveKycFile(file);
  const doc = await prisma.rentalKycDocument.create({
    data: {
      customer_id: BigInt(customerId),
      doc_type: docType,
      file_path: saved.path,
      file_name: saved.name,
      mime_type: saved.mime,
      size_bytes: saved.size,
    },
  });
  return kycDocDto(doc);
}

export async function deleteKycDocument(customerId, docId) {
  const doc = await prisma.rentalKycDocument.findFirst({ where: { id: docId, customer_id: BigInt(customerId) } });
  if (!doc) throw ApiError.notFound("Document not found");
  if (doc.rental_id) throw ApiError.conflict("This document is already part of a booking and cannot be removed");
  await prisma.rentalKycDocument.delete({ where: { id: doc.id } });
  await deleteKycFile(doc.file_path);
}

export async function getOwnKycDocument(customerId, docId) {
  const doc = await prisma.rentalKycDocument.findFirst({ where: { id: docId, customer_id: BigInt(customerId) } });
  if (!doc) throw ApiError.notFound("Document not found");
  return doc;
}

/** My rentals: re-upload a document that staff asked for again (or one still missing). */
export async function uploadRentalKycDocument(customerId, ref, file, docType) {
  const rental = await prisma.rental.findFirst({ where: rentalWhere(ref, customerId), include: { kyc_documents: true } });
  if (!rental) throw ApiError.notFound("Rental not found");
  if (!["pending", "rejected"].includes(rental.kyc_status) || !OPEN_STATUSES.includes(rental.status)) {
    throw ApiError.conflict("Documents for this rental cannot be changed now");
  }
  if (!rental.kyc_required_docs.includes(docType)) throw ApiError.badRequest("This document is not needed for this rental");

  const saved = await saveKycFile(file);
  await prisma.$transaction(async (tx) => {
    await tx.rentalKycDocument.create({
      data: {
        customer_id: BigInt(customerId),
        rental_id: rental.id,
        doc_type: docType,
        file_path: saved.path,
        file_name: saved.name,
        mime_type: saved.mime,
        size_bytes: saved.size,
      },
    });
    const docs = await tx.rentalKycDocument.findMany({ where: { rental_id: rental.id }, orderBy: { created_at: "asc" } });
    const latestOk = (key) => {
      const latest = docs.filter((d) => d.doc_type === key).pop();
      return latest && latest.status !== "rejected";
    };
    if (rental.kyc_required_docs.every(latestOk)) {
      await tx.rental.update({ where: { id: rental.id }, data: { kyc_status: "submitted" } });
      await history(tx, rental, rental.status, { actorType: "customer", actorId: BigInt(customerId), note: "KYC documents submitted for verification" });
      alertStaff({
        type: "rental_kyc",
        title: `KYC re-submitted for ${rental.rental_number}`,
        message: "The customer uploaded the requested documents.",
        severity: "warning",
        link: `/admin/rentals/${rental.id}`,
        entityType: "rental",
        entityId: rental.id,
        permission: "rentals.view",
      });
    }
  });
  return getCustomerRental(customerId, String(rental.id));
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

async function resolveAddress(customerId, input) {
  if (input.addressId) {
    const a = await prisma.address.findFirst({ where: { id: BigInt(input.addressId), customer_id: BigInt(customerId) } });
    if (!a) throw ApiError.badRequest("Choose a delivery address", "VALIDATION_ERROR", { address: "Address not found" });
    return { name: a.name, phone: a.phone, organisation_name: a.organisation_name, line1: a.line1, line2: a.line2, landmark: a.landmark, city: a.city, state: a.state, pincode: a.pincode, type: a.type };
  }
  return input.address;
}

/** Creates the booking (pending_payment) and a Razorpay order for the advance. */
export async function createRental(customerId, input) {
  const [product, ctx, customer] = await Promise.all([
    findRentalProduct({ productId: input.productId, productSlug: input.productSlug }),
    loadContext(),
    prisma.customer.findUnique({ where: { id: BigInt(customerId) }, select: { id: true, name: true, email: true, mobile: true } }),
  ]);
  const plan = pickPlan(product, input.period, input.periods);
  const start = validateStartDate(input.startDate, ctx.rental);
  if ((await rentalAvailability(product.id)) <= 0) {
    throw ApiError.conflict("All units of this equipment are booked right now. Please try again later or call us.", "OUT_OF_STOCK");
  }
  const address = await resolveAddress(customerId, input);

  const pin = await checkPincode(String(address.pincode || ""));
  if (!pin.serviceable) {
    throw ApiError.badRequest(pin.message || "We don't deliver rentals to this PIN code yet", "NOT_SERVICEABLE", { address: "Not serviceable" });
  }

  // KYC documents must already be uploaded (POST /rentals/kyc-documents)
  const required = requiredDocsFor(plan, ctx.rental);
  const docIds = [...new Set(input.kycDocumentIds || [])].map((id) => BigInt(id));
  const docs = docIds.length
    ? await prisma.rentalKycDocument.findMany({ where: { id: { in: docIds }, customer_id: BigInt(customerId), rental_id: null } })
    : [];
  const missing = required.filter((key) => !docs.some((d) => d.doc_type === key));
  if (missing.length) {
    throw ApiError.badRequest(`Please upload: ${missing.map((k) => DOC_LABEL[k]).join(", ")}`, "KYC_REQUIRED", {
      kycDocuments: missing.join(","),
    });
  }

  const q = quoteRental({ plan, gstRate: product.gst_rate, periods: input.periods, rental: ctx.rental, tax: ctx.tax, depositMode: input.depositMode });

  let rental;
  for (let attempt = 0; attempt < 3 && !rental; attempt++) {
    try {
      rental = await prisma.$transaction(async (tx) => {
        const r = await tx.rental.create({
          data: {
            rental_number: await nextRentalNumber(tx),
            customer_id: BigInt(customerId),
            product_id: product.id,
            rental_plan_id: plan.id,
            product_name: product.name,
            period: plan.period,
            periods: input.periods,
            rate_paise: q.rate,
            rent_paise: q.rent,
            deposit_paise: q.deposit,
            charges_paise: q.delivery,
            tax_paise: q.gst,
            requested_start_date: start,
            requested_delivery_time: input.deliveryTime,
            end_date: addPeriods(start, plan.period, input.periods), // re-based on the delivery date later
            delivery_address: address,
            status: "pending_payment",
            advance_percent: q.advancePercent,
            advance_paise: q.advance,
            balance_due: ctx.rental.balanceDue,
            deposit_mode: q.depositMode,
            kyc_required_docs: required,
            kyc_status: required.length ? "submitted" : null,
            charges: {
              create: [
                { type: "rent", direction: "debit", amount_paise: q.rent + q.gst, description: `${periodLabel(plan.period, input.periods)} × ${formatINR(q.rate)}${q.gst > 0n ? ` + GST ${q.gstRate}%` : ""}` },
                ...(q.delivery > 0n ? [{ type: "delivery_pickup", direction: "debit", amount_paise: q.delivery, description: "Delivery, installation & pickup" }] : []),
                ...(q.deposit > 0n ? [{ type: "deposit", direction: "debit", amount_paise: q.deposit, description: q.depositMode === "cheque" ? "Refundable security deposit (by cheque)" : "Refundable security deposit" }] : []),
              ],
            },
          },
        });
        if (docs.length) {
          await tx.rentalKycDocument.updateMany({ where: { id: { in: docs.map((d) => d.id) } }, data: { rental_id: r.id } });
        }
        await tx.rentalStatusHistory.create({
          data: { rental_id: r.id, from_status: null, to_status: "pending_payment", actor_type: "customer", actor_id: BigInt(customerId), note: "Booking created" },
        });
        return r;
      });
    } catch (err) {
      if (err?.code !== "P2002" || attempt === 2) throw err;
    }
  }

  // Customer name / mobile from the delivery address when the profile has none (like product checkout)
  if (customer && ((!customer.name && address.name) || (!customer.mobile && /^[6-9]\d{9}$/.test(address.phone || "")))) {
    await prisma.customer
      .update({ where: { id: customer.id }, data: { name: customer.name || address.name, mobile: customer.mobile || address.phone } })
      .catch(() => undefined);
  }

  const payment = await startRazorpay(rental, q.advance, "rental_booking").catch((err) => ({ error: err.message }));
  return { rental: await getCustomerRental(customerId, String(rental.id)), ...payment };
}

/** Creates a Razorpay order + a "created" payments row. */
async function startRazorpay(rental, amountPaise, purpose, extension = null) {
  if (amountPaise < 100n) throw ApiError.badRequest("Nothing is due right now");
  const rp = await createRazorpayOrder({
    amountPaise,
    receipt: `${rental.rental_number}-${Date.now().toString(36)}`,
    notes: { rental_number: rental.rental_number, rental_id: String(rental.id), purpose },
  });
  const payment = await prisma.payment.create({
    data: { rental_id: rental.id, purpose, gateway: "razorpay", gateway_order_id: rp.orderId, amount_paise: amountPaise, status: "created" },
  });
  if (extension) await prisma.rentalExtension.update({ where: { id: extension.id }, data: { payment_id: payment.id } });
  return { razorpay: rp };
}

/** Pay the advance (if a previous attempt was abandoned) or the remaining balance. */
export async function startPayment(customerId, ref, { kind }) {
  const rental = await prisma.rental.findFirst({ where: rentalWhere(ref, customerId), include: { payments: true } });
  if (!rental) throw ApiError.notFound("Rental not found");
  if (["cancelled", "deposit_refunded"].includes(rental.status)) throw ApiError.conflict("This rental is closed");
  const paid = capturedPaise(rental.payments);
  // A deposit paid by cheque is collected by staff, never through this online payment
  const amount =
    kind === "advance" ? BigInt(rental.advance_paise) - paid : onlineDuePaise(rental);
  if (kind === "advance" && rental.status !== "pending_payment") throw ApiError.conflict("The booking payment is already done");
  if (amount <= 0n) throw ApiError.conflict("Nothing is due on this rental");
  return startRazorpay(rental, amount, "rental_booking");
}

/** Applies a captured payment to the rental (status / extension). Runs in a transaction. */
async function applyPayment(tx, rental, payment, actor) {
  const paid = capturedPaise(await tx.payment.findMany({ where: { rental_id: rental.id } }));
  await tx.rental.update({ where: { id: rental.id }, data: { total_paid_paise: paid } });

  if (payment.purpose === "rental_booking" && rental.status === "pending_payment" && paid >= BigInt(rental.advance_paise)) {
    await tx.rental.update({ where: { id: rental.id }, data: { status: "pending_approval" } });
    await history(tx, rental, "pending_approval", { ...actor, note: `Booking payment of ${formatINR(payment.amount_paise)} received` });
    return "booked";
  }

  if (payment.purpose === "rental_extension") {
    const ext = await tx.rentalExtension.findFirst({ where: { rental_id: rental.id, payment_id: payment.id } });
    if (ext && ext.status !== "paid") return applyExtension(tx, rental, ext, actor);
  }

  await history(tx, rental, rental.status, { ...actor, note: `Payment of ${formatINR(payment.amount_paise)} received` });
  return "paid";
}

export async function applyExtension(tx, rental, ext, actor) {
  const rentPart = BigInt(rental.rate_paise) * BigInt(ext.extra_periods);
  const gstPart = BigInt(ext.amount_paise) - rentPart;
  const newEnd = addPeriods(rental.end_date, rental.period, ext.extra_periods);
  const backInTime = rental.status === "overdue" && newEnd >= dateOnly(todayIST());
  // Staff can extend without collecting money (added to the balance) — then it stays "approved"
  await tx.rentalExtension.update({
    where: { id: ext.id },
    data: { status: ext.payment_id ? "paid" : "approved", old_end_date: rental.end_date, new_end_date: newEnd },
  });
  await tx.rental.update({
    where: { id: rental.id },
    data: {
      periods: rental.periods + ext.extra_periods,
      rent_paise: BigInt(rental.rent_paise) + rentPart,
      tax_paise: BigInt(rental.tax_paise) + (gstPart > 0n ? gstPart : 0n),
      end_date: newEnd,
      ...(backInTime ? { status: "active" } : {}),
    },
  });
  await tx.rentalCharge.create({
    data: {
      rental_id: rental.id,
      type: "extension",
      direction: "debit",
      amount_paise: ext.amount_paise,
      description: `Extended by ${periodLabel(rental.period, ext.extra_periods)} (till ${ymd(newEnd)})`,
    },
  });
  await history(tx, rental, backInTime ? "active" : rental.status, { ...actor, note: `Extended by ${periodLabel(rental.period, ext.extra_periods)} — new end date ${ymd(newEnd)}` });
  return "extended";
}

export async function verifyPayment(customerId, ref, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!verifyPaymentSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
    throw ApiError.badRequest("Payment could not be verified. If money was debited, it will be refunded automatically by your bank.", "INVALID_SIGNATURE");
  }
  const rental = await prisma.rental.findFirst({ where: rentalWhere(ref, customerId), include: { customer: true } });
  if (!rental) throw ApiError.notFound("Rental not found");
  const payment = await prisma.payment.findFirst({ where: { gateway_order_id: razorpayOrderId, rental_id: rental.id } });
  if (!payment) throw ApiError.notFound("Payment not found for this rental");

  let outcome = "already";
  if (payment.status !== "captured") {
    outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rentals WHERE id = ${rental.id} FOR UPDATE`;
      const fresh = await tx.rental.findUnique({ where: { id: rental.id } });
      const captured = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "captured", gateway_payment_id: razorpayPaymentId, captured_at: new Date() },
      });
      return applyPayment(tx, fresh, captured, { actorType: "customer", actorId: BigInt(customerId) });
    });
  }

  const dto = await getCustomerRental(customerId, String(rental.id));
  if (outcome === "booked") {
    alertStaff({
      type: "rental_booked",
      title: `New rental booking ${rental.rental_number} · ${formatINR(payment.amount_paise)} paid`,
      message: `${rental.product_name} · ${periodLabel(rental.period, rental.periods)}${rental.kyc_required_docs.length ? " · KYC to verify" : ""}`,
      severity: rental.kyc_required_docs.length ? "warning" : "info",
      link: `/admin/rentals/${rental.id}`,
      entityType: "rental",
      entityId: rental.id,
      permission: "rentals.view",
    });
    notifyRental("rental_booked", rental, {
      amount_paid: formatINR(payment.amount_paise, { symbol: false }),
      balance_due: dto.amounts.balanceDue > 0
        ? `Balance of ₹${dto.amounts.balanceDue.toLocaleString("en-IN")} is due ${rental.balance_due === "on_delivery" ? "on delivery" : "before dispatch"}.`
        : "",
    });
  } else if (outcome === "extended") {
    alertStaff({
      type: "rental_extended",
      title: `${rental.rental_number} extended till ${dto.endDate}`,
      message: `Customer paid ${formatINR(payment.amount_paise)} online.`,
      link: `/admin/rentals/${rental.id}`,
      entityType: "rental",
      entityId: rental.id,
      permission: "rentals.view",
    });
    notifyRental("rental_extended", rental, { end_date: dto.endDate, amount_paid: formatINR(payment.amount_paise, { symbol: false }) });
  }
  return dto;
}

// ---------------------------------------------------------------------------
// While renting
// ---------------------------------------------------------------------------

export async function requestExtension(customerId, ref, { extraPeriods }) {
  const [rental, ctx] = await Promise.all([
    prisma.rental.findFirst({ where: rentalWhere(ref, customerId), include: { plan: true, product: { select: { gst_rate: true } } } }),
    loadContext(),
  ]);
  if (!rental) throw ApiError.notFound("Rental not found");
  if (!["active", "overdue"].includes(rental.status)) throw ApiError.conflict("You can extend a rental once it has been delivered");
  const max = rental.plan?.max_periods || 12;
  if (extraPeriods < 1 || extraPeriods > max) throw ApiError.badRequest(`Extend by 1 to ${periodLabel(rental.period, max)}`);

  const q = quoteExtension({ rate: rental.rate_paise, gstRate: rental.product.gst_rate, periods: extraPeriods, tax: ctx.tax });
  const ext = await prisma.$transaction(async (tx) => {
    // An earlier unpaid request is replaced
    await tx.rentalExtension.updateMany({ where: { rental_id: rental.id, status: "requested" }, data: { status: "rejected" } });
    return tx.rentalExtension.create({
      data: {
        rental_id: rental.id,
        extra_periods: extraPeriods,
        amount_paise: q.total,
        old_end_date: rental.end_date,
        new_end_date: addPeriods(rental.end_date, rental.period, extraPeriods),
        status: "requested",
      },
    });
  });
  const payment = await startRazorpay(rental, q.total, "rental_extension", ext);
  return { ...payment, extension: { id: String(ext.id), amount: Number(q.total) / 100, newEndDate: ymd(ext.new_end_date) } };
}

export async function requestReturn(customerId, ref, { pickupDate }) {
  const rental = await prisma.rental.findFirst({ where: rentalWhere(ref, customerId) });
  if (!rental) throw ApiError.notFound("Rental not found");
  if (!["active", "overdue"].includes(rental.status)) throw ApiError.conflict("A pickup can be requested once the rental is active");
  const date = dateOnly(pickupDate);
  const today = dateOnly(todayIST());
  if (date < addDays(today, 1) || date > addDays(today, 60)) {
    throw ApiError.badRequest("Choose a pickup date between tomorrow and the next 60 days", "VALIDATION_ERROR", { pickupDate: "Out of range" });
  }
  await prisma.$transaction(async (tx) => {
    await tx.rental.update({ where: { id: rental.id }, data: { return_requested_on: date } });
    await history(tx, rental, rental.status, { actorType: "customer", actorId: BigInt(customerId), note: `Customer requested pickup on ${ymd(date)}` });
  });
  alertStaff({
    type: "rental_pickup",
    title: `Pickup requested for ${rental.rental_number}`,
    message: `${rental.product_name} · preferred date ${ymd(date)}`,
    severity: "warning",
    link: `/admin/rentals/${rental.id}`,
    entityType: "rental",
    entityId: rental.id,
    permission: "rentals.view",
  });
  return getCustomerRental(customerId, String(rental.id));
}

/**
 * Cancels before dispatch. Whatever was paid goes back to the original payment method
 * (Razorpay); if that is not possible the refund is left for staff.
 * Shared with the admin cancel (actor differs).
 */
export async function cancelRentalCore(rental, { reason, actorType, actorId = null, adminUserId = null }) {
  if (!CANCELLABLE.includes(rental.status)) {
    throw ApiError.conflict(
      rental.status === "cancelled"
        ? "This rental is already cancelled"
        : "This rental has already been dispatched and can no longer be cancelled. Request a pickup instead."
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.rental.update({
      where: { id: rental.id },
      data: { status: "cancelled", cancel_reason: reason, cancelled_at: new Date(), rental_unit_id: null },
    });
    if (rental.rental_unit_id) {
      await tx.rentalUnit.update({ where: { id: rental.rental_unit_id }, data: { status: "available", current_rental_id: null } });
    }
    await tx.payment.updateMany({ where: { rental_id: rental.id, status: "created" }, data: { status: "failed", failure_reason: "Rental cancelled" } });
    await tx.rentalExtension.updateMany({ where: { rental_id: rental.id, status: "requested" }, data: { status: "rejected" } });
    await history(tx, rental, "cancelled", { actorType, actorId, note: reason });
  });

  // Refund what was paid
  const fresh = await prisma.rental.findUnique({ where: { id: rental.id }, include: { payments: true, refunds: true } });
  const summary = rentalRefundSummary(fresh);
  const { refundProcessingDays } = await getGroup("returns").catch(() => ({ refundProcessingDays: "5-7" }));
  let refundNote = "No payment was collected, so nothing is due.";
  if (summary.balance > 0) {
    const amount = BigInt(Math.round(summary.balance * 100));
    const viaGateway = summary.gatewayAvailable && summary.gatewayRefundable >= summary.balance;
    if (viaGateway) {
      const { refund, error } = await issueRefund({ rentalId: rental.id, amountPaise: amount, reason: "cancel", mode: "gateway", note: "Rental cancelled", adminUserId }).catch(
        (err) => ({ refund: null, error: err })
      );
      if (refund && !error) refundNote = `${formatINR(amount)} will be refunded to your original payment method within ${refundProcessingDays} business days.`;
      else refundNote = `Your refund of ${formatINR(amount)} is being processed by our team.`;
      await prisma.rentalStatusHistory.create({
        data: {
          rental_id: rental.id,
          from_status: "cancelled",
          to_status: "cancelled",
          actor_type: "system",
          note: refund && !error ? `Refund of ${formatINR(amount)} initiated (${refund.gateway_refund_id || `#${refund.id}`})` : `Automatic refund failed: ${error?.message} — refund it from the rental page`,
        },
      });
    } else {
      refundNote = `Your refund of ${formatINR(amount)} will be processed by our team within ${refundProcessingDays} business days.`;
      await prisma.rentalStatusHistory.create({
        data: { rental_id: rental.id, from_status: "cancelled", to_status: "cancelled", actor_type: "system", note: `Refund of ${formatINR(amount)} pending — pay it by bank transfer / UPI from the rental page` },
      });
    }
  }
  const withCustomer = await prisma.rental.findUnique({ where: { id: rental.id }, include: { customer: true } });
  notifyRental("rental_cancelled", withCustomer, { refund_note: refundNote });
  return refundNote;
}

export async function cancelRental(customerId, ref, { reason }) {
  const rental = await prisma.rental.findFirst({ where: rentalWhere(ref, customerId) });
  if (!rental) throw ApiError.notFound("Rental not found");
  const refundNote = await cancelRentalCore(rental, { reason: `Cancelled by customer: ${reason}`, actorType: "customer", actorId: BigInt(customerId) });
  alertStaff({
    type: "rental_cancelled",
    title: `Rental ${rental.rental_number} cancelled by the customer`,
    message: `${reason}. ${refundNote}`,
    severity: "warning",
    link: `/admin/rentals/${rental.id}`,
    entityType: "rental",
    entityId: rental.id,
    permission: "rentals.view",
  });
  return getCustomerRental(customerId, String(rental.id));
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export async function getCustomerRental(customerId, ref) {
  const [rental, ctx] = await Promise.all([
    prisma.rental.findFirst({ where: rentalWhere(ref, customerId), include: RENTAL_INCLUDE }),
    loadContext(),
  ]);
  if (!rental) throw ApiError.notFound("Rental not found");
  return toCustomerRentalDto(rental, ctx);
}

export async function listCustomerRentals(customerId) {
  await syncOverdue();
  const [rows, ctx] = await Promise.all([
    prisma.rental.findMany({ where: { customer_id: BigInt(customerId) }, include: RENTAL_INCLUDE, orderBy: { created_at: "desc" }, take: 100 }),
    loadContext(),
  ]);
  return rows.map((r) => toCustomerRentalDto(r, ctx));
}

export { RENTAL_STATUS_LABEL };
