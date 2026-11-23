import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { formatINR } from "../../lib/money.js";
import { notify } from "../../services/notification.service.js";
import { getGroup } from "../settings/service.js";
import { issueRefund, syncGatewayRefund, REFUND_METHOD_LABEL } from "../refunds/service.js";
import { RENTAL_INCLUDE, RENTAL_STATUS_LABEL, toAdminRentalDto } from "./dto.js";
import { sendKycFile } from "./kyc-storage.js";
import {
  addPeriods,
  capturedPaise,
  dateOnly,
  daysBetween,
  lateFeeToday,
  periodLabel,
  quoteExtension,
  DEPOSIT_PAYMENT_PURPOSE,
  depositChequeDuePaise,
  onlineDuePaise,
  todayIST,
  ymd,
  addDays,
} from "./pricing.js";
import { applyExtension, cancelRentalCore, history, loadContext, notifyRental, rentalWhere, syncOverdue } from "./service.js";

/**
 * Rentals — staff side (admin → Rentals). Every write checks the current status first,
 * so two people working on the same rental cannot push it into an impossible state.
 */

const BEFORE_DISPATCH = ["pending_payment", "pending_approval", "approved"];
const IN_USE = ["active", "overdue", "extension_requested"];

async function load(id) {
  const rental = await prisma.rental.findFirst({ where: rentalWhere(id), include: RENTAL_INCLUDE });
  if (!rental) throw ApiError.notFound("Rental not found");
  return rental;
}

function expect(rental, statuses, action) {
  if (!statuses.includes(rental.status)) {
    throw ApiError.conflict(`Cannot ${action} while the rental is "${RENTAL_STATUS_LABEL[rental.status] || rental.status}"`, "INVALID_STATUS");
  }
}

/** Unpaid rent / charges (a deposit paid by cheque is tracked separately — depositChequeDuePaise). */
const balanceOf = (r) => onlineDuePaise(r);

async function availableUnits(productId) {
  const units = await prisma.rentalUnit.findMany({
    where: { product_id: productId, status: "available", condition: { in: ["new", "good"] } },
    orderBy: [{ condition: "asc" }, { unit_code: "asc" }],
    select: { id: true, unit_code: true, serial_number: true, condition: true, next_service_due: true },
  });
  return units.map((u) => ({
    id: String(u.id),
    unitCode: u.unit_code,
    serialNumber: u.serial_number,
    condition: u.condition,
    nextServiceDue: ymd(u.next_service_due),
  }));
}

export async function getAdminRental(id) {
  const [rental, ctx] = await Promise.all([load(id), loadContext()]);
  const ids = [...new Set(rental.status_history.filter((h) => h.actor_type === "admin" && h.actor_id).map((h) => h.actor_id))];
  const admins = ids.length ? await prisma.adminUser.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const units = ["pending_approval", "approved"].includes(rental.status) ? await availableUnits(rental.product_id) : null;
  return toAdminRentalDto(rental, ctx, { adminNames: new Map(admins.map((a) => [String(a.id), a.name])), units, detail: true });
}

const STATUS_GROUPS = {
  needs_action: ["pending_approval", "approved", "return_scheduled", "returned"],
  in_use: ["dispatched", "active", "extension_requested", "overdue"],
  open: ["pending_payment", "pending_approval", "approved", "dispatched", "active", "extension_requested", "overdue", "return_scheduled", "returned"],
};

export async function listAdminRentals({ status = "all", q, due } = {}) {
  await syncOverdue();
  const where = {};
  if (status !== "all") where.status = STATUS_GROUPS[status] ? { in: STATUS_GROUPS[status] } : status;
  if (due === "7d") {
    const today = dateOnly(todayIST());
    where.status = { in: ["active"] };
    where.end_date = { gte: today, lte: addDays(today, 7) };
  }
  if (due === "kyc") {
    where.kyc_status = "submitted";
    where.status = { notIn: ["pending_payment", "cancelled", "deposit_refunded"] }; // only paid bookings need verifying
  }
  if (q) {
    where.OR = [
      { rental_number: { contains: q, mode: "insensitive" } },
      { product_name: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { mobile: { contains: q } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { unit: { serial_number: { contains: q, mode: "insensitive" } } },
    ];
  }

  const today = dateOnly(todayIST());
  const [rows, ctx, counts, dueSoon, kycToReview, deposits] = await Promise.all([
    prisma.rental.findMany({ where, include: RENTAL_INCLUDE, orderBy: { created_at: "desc" }, take: 300 }),
    loadContext(),
    prisma.rental.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.rental.count({ where: { status: "active", end_date: { gte: today, lte: addDays(today, 7) } } }),
    prisma.rental.count({ where: { kyc_status: "submitted", status: { notIn: ["pending_payment", "cancelled", "deposit_refunded"] } } }),
    prisma.rental.aggregate({
      where: { status: { in: ["approved", "dispatched", "active", "extension_requested", "overdue", "return_scheduled", "returned"] } },
      _sum: { deposit_paise: true },
    }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  return {
    items: rows.map((r) => toAdminRentalDto(r, ctx)),
    counts: { all: Object.values(byStatus).reduce((a, b) => a + b, 0), ...byStatus },
    summary: {
      awaitingApproval: byStatus.pending_approval || 0,
      kycToReview,
      toDispatch: byStatus.approved || 0,
      inUse: (byStatus.active || 0) + (byStatus.dispatched || 0) + (byStatus.extension_requested || 0),
      overdue: byStatus.overdue || 0,
      dueIn7Days: dueSoon,
      pickups: byStatus.return_scheduled || 0,
      depositsToRefund: byStatus.returned || 0,
      depositsHeld: Number(deposits._sum.deposit_paise || 0n) / 100,
    },
  };
}

// ---------------------------------------------------------------------------
// Approval & KYC
// ---------------------------------------------------------------------------

export async function reviewKyc(id, { decisions, note }, admin) {
  const rental = await load(id);
  if (!rental.kyc_required_docs.length) throw ApiError.badRequest("This rental does not need KYC documents");
  if (["cancelled", "deposit_refunded"].includes(rental.status)) throw ApiError.conflict("This rental is closed");
  const docs = new Map(rental.kyc_documents.map((d) => [String(d.id), d]));
  for (const d of decisions) {
    if (!docs.has(d.docId)) throw ApiError.badRequest("Unknown document");
    if (d.status === "rejected" && !d.reason) throw ApiError.badRequest("Give a reason for every rejected document", "VALIDATION_ERROR", { [`reason.${d.docId}`]: "Required" });
  }

  const outcome = await prisma.$transaction(async (tx) => {
    for (const d of decisions) {
      await tx.rentalKycDocument.update({
        where: { id: BigInt(d.docId) },
        data: { status: d.status, reject_reason: d.status === "rejected" ? d.reason : null, reviewed_by: admin.id, reviewed_at: new Date() },
      });
    }
    const all = await tx.rentalKycDocument.findMany({ where: { rental_id: rental.id }, orderBy: { created_at: "asc" } });
    const latest = (key) => all.filter((x) => x.doc_type === key).pop();
    const states = rental.kyc_required_docs.map((key) => latest(key)?.status || "missing");
    const kycStatus = states.includes("rejected") || states.includes("missing") ? "rejected" : states.every((s) => s === "approved") ? "approved" : "submitted";
    const rejectedNote =
      note ||
      all
        .filter((x) => x.status === "rejected" && latest(x.doc_type)?.id === x.id)
        .map((x) => `${x.doc_type.replace(/_/g, " ")}: ${x.reject_reason}`)
        .join("; ");
    await tx.rental.update({
      where: { id: rental.id },
      data: { kyc_status: kycStatus, kyc_note: kycStatus === "rejected" ? rejectedNote : null, kyc_reviewed_by: admin.id, kyc_reviewed_at: new Date() },
    });
    await history(tx, rental, rental.status, {
      actorType: "admin",
      actorId: admin.id,
      note: kycStatus === "approved" ? "KYC documents verified" : kycStatus === "rejected" ? `KYC re-upload requested: ${rejectedNote}` : "KYC documents reviewed",
    });
    return { kycStatus, rejectedNote };
  });
  if (outcome.kycStatus === "rejected") notifyRental("rental_kyc_rejected", rental, { reason: outcome.rejectedNote });
  return getAdminRental(id);
}

async function assignUnitTx(tx, rental, unitId, admin) {
  const unit = await tx.rentalUnit.findUnique({ where: { id: BigInt(unitId) } });
  if (!unit || unit.product_id !== rental.product_id) throw ApiError.badRequest("Choose a unit of the same product");
  if (unit.status !== "available" && unit.current_rental_id !== rental.id) {
    throw ApiError.conflict(`Unit ${unit.unit_code} is not available (${unit.status.replace(/_/g, " ")})`);
  }
  if (["damaged", "retired", "needs_service"].includes(unit.condition)) throw ApiError.conflict(`Unit ${unit.unit_code} needs service before it can be rented`);
  if (rental.rental_unit_id && rental.rental_unit_id !== unit.id) {
    await tx.rentalUnit.update({ where: { id: rental.rental_unit_id }, data: { status: "available", current_rental_id: null } });
  }
  await tx.rentalUnit.update({ where: { id: unit.id }, data: { status: "reserved", current_rental_id: rental.id } });
  await tx.rental.update({ where: { id: rental.id }, data: { rental_unit_id: unit.id } });
  await history(tx, rental, rental.status, { actorType: "admin", actorId: admin.id, note: `Unit ${unit.unit_code} (S/N ${unit.serial_number}) assigned`, unitId: unit.id });
  return unit;
}

export async function approveRental(id, { unitId, note }, admin) {
  const rental = await load(id);
  expect(rental, ["pending_approval"], "approve");
  if (rental.kyc_required_docs.length && rental.kyc_status !== "approved") {
    throw ApiError.conflict("Verify the customer's KYC documents before approving");
  }
  let unit = null;
  try {
    await prisma.$transaction(async (tx) => {
      if (unitId) unit = await assignUnitTx(tx, rental, unitId, admin);
      await tx.rental.update({ where: { id: rental.id }, data: { status: "approved" } });
      await history(tx, rental, "approved", { actorType: "admin", actorId: admin.id, note: note || "Booking confirmed" });
    });
  } catch (err) {
    if (err?.code === "P2002") throw ApiError.conflict("That unit is already on another open rental");
    throw err;
  }
  notifyRental("rental_approved", rental, { serial_number: unit?.serial_number || "a certified unit" });
  return getAdminRental(id);
}

export async function assignUnit(id, { unitId }, admin) {
  const rental = await load(id);
  expect(rental, ["pending_approval", "approved"], "assign a unit");
  try {
    await prisma.$transaction((tx) => assignUnitTx(tx, rental, unitId, admin));
  } catch (err) {
    if (err?.code === "P2002") throw ApiError.conflict("That unit is already on another open rental");
    throw err;
  }
  return getAdminRental(id);
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export async function dispatchRental(id, { courier, awb, trackingUrl, note }, admin) {
  const rental = await load(id);
  expect(rental, ["approved"], "dispatch");
  if (!rental.rental_unit_id) throw ApiError.conflict("Assign a unit before dispatching");
  const due = balanceOf(rental);
  if (rental.balance_due === "before_dispatch" && due > 0n) {
    throw ApiError.conflict(`Collect the balance of ${formatINR(due)} before dispatch (the customer can pay it from My Rentals, or record an offline payment)`);
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.create({
        data: { rental_id: rental.id, direction: "forward", courier_name: courier, awb_code: awb || null, tracking_url: trackingUrl || null, status: "in_transit" },
      });
      await tx.rentalUnit.update({ where: { id: rental.rental_unit_id }, data: { status: "in_transit" } });
      await tx.rental.update({ where: { id: rental.id }, data: { status: "dispatched", dispatched_at: new Date() } });
      await history(tx, rental, "dispatched", {
        actorType: "admin",
        actorId: admin.id,
        note: note || `Dispatched via ${courier}${awb ? ` (AWB ${awb})` : ""}`,
        unitId: rental.rental_unit_id,
      });
    });
  } catch (err) {
    if (err?.code === "P2002") throw ApiError.conflict(`AWB ${awb} is already used by another shipment`, "DUPLICATE_AWB", { awb: "Already used" });
    throw err;
  }
  notifyRental("rental_dispatched", rental, { courier, awb: awb || "—", tracking_url: trackingUrl || "" });
  return getAdminRental(id);
}

/** The rental period starts on the delivery date. */
export async function markDelivered(id, { deliveredOn }, admin) {
  const rental = await load(id);
  expect(rental, ["dispatched"], "mark delivered");
  const due = balanceOf(rental);
  if (due > 0n) throw ApiError.conflict(`${formatINR(due)} is still unpaid — record the payment collected on delivery first`);
  const chequeDue = depositChequeDuePaise(rental);
  if (chequeDue > 0n) throw ApiError.conflict(`Collect the deposit cheque of ${formatINR(chequeDue)} and record it before marking delivered`);
  const start = dateOnly(deliveredOn || todayIST());
  if (start > dateOnly(todayIST())) throw ApiError.badRequest("The delivery date cannot be in the future");
  const end = addPeriods(start, rental.period, rental.periods);
  await prisma.$transaction(async (tx) => {
    await tx.shipment.updateMany({ where: { rental_id: rental.id, direction: "forward", status: { not: "delivered" } }, data: { status: "delivered", delivered_at: new Date() } });
    await tx.rentalUnit.update({ where: { id: rental.rental_unit_id }, data: { status: "with_customer" } });
    await tx.rental.update({ where: { id: rental.id }, data: { status: "active", delivered_at: new Date(), start_date: start, end_date: end } });
    await history(tx, rental, "active", {
      actorType: "admin",
      actorId: admin.id,
      note: `Delivered and installed on ${ymd(start)} — rental runs till ${ymd(end)}`,
      unitId: rental.rental_unit_id,
    });
  });
  return getAdminRental(id);
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** Cash / UPI / bank transfer collected by staff. */
export async function recordPayment(id, { amount, method, reference, note }, admin) {
  const rental = await load(id);
  if (["cancelled", "deposit_refunded"].includes(rental.status)) throw ApiError.conflict("This rental is closed");
  const due = balanceOf(rental);
  if (due <= 0n) throw ApiError.conflict("Nothing is due on this rental");
  if (amount > due) throw ApiError.badRequest(`At most ${formatINR(due)} is due`);
  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM rentals WHERE id = ${rental.id} FOR UPDATE`;
    const fresh = await tx.rental.findUnique({ where: { id: rental.id } });
    await tx.payment.create({
      data: {
        rental_id: rental.id,
        purpose: "rental_booking",
        gateway: "manual",
        method,
        amount_paise: amount,
        status: "captured",
        captured_at: new Date(),
        raw_response: { reference: reference || null, note: note || null, recordedBy: admin.name },
      },
    });
    const paid = capturedPaise(await tx.payment.findMany({ where: { rental_id: rental.id } }));
    await tx.rental.update({ where: { id: rental.id }, data: { total_paid_paise: paid } });
    const label = `${formatINR(amount)} received by ${method.replace("_", " ")}${reference ? ` (Ref ${reference})` : ""}`;
    if (fresh.status === "pending_payment" && paid >= BigInt(fresh.advance_paise)) {
      await tx.rental.update({ where: { id: rental.id }, data: { status: "pending_approval" } });
      await history(tx, fresh, "pending_approval", { actorType: "admin", actorId: admin.id, note: label });
      return "booked";
    }
    await history(tx, fresh, fresh.status, { actorType: "admin", actorId: admin.id, note: label });
    return "paid";
  });
  if (outcome === "booked") {
    notifyRental("rental_booked", rental, { amount_paid: formatINR(amount, { symbol: false }), balance_due: "" });
  }
  return getAdminRental(id);
}

/** The customer chose to pay the refundable deposit by cheque — staff record it once collected. */
export async function recordDepositCheque(id, { chequeNumber, bank, note }, admin) {
  const rental = await load(id);
  if (["cancelled", "deposit_refunded", "returned"].includes(rental.status)) throw ApiError.conflict("This rental is closed");
  if (rental.deposit_mode !== "cheque") throw ApiError.conflict("The customer paid the deposit online on this rental");
  const amount = depositChequeDuePaise(rental);
  if (amount <= 0n) throw ApiError.conflict("The deposit cheque is already recorded");
  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        rental_id: rental.id,
        purpose: DEPOSIT_PAYMENT_PURPOSE,
        gateway: "manual",
        method: "cheque",
        amount_paise: amount,
        status: "captured",
        captured_at: new Date(),
        raw_response: { reference: chequeNumber, bank: bank || null, note: note || null, recordedBy: admin.name },
      },
    });
    const paid = capturedPaise(await tx.payment.findMany({ where: { rental_id: rental.id } }));
    await tx.rental.update({ where: { id: rental.id }, data: { total_paid_paise: paid } });
    await history(tx, rental, rental.status, {
      actorType: "admin",
      actorId: admin.id,
      note: `Deposit cheque ${chequeNumber}${bank ? ` (${bank})` : ""} for ${formatINR(amount)} received`,
    });
  });
  return getAdminRental(id);
}

/** Staff extends a rental (payment collected offline, or added to the balance). */
export async function extendRental(id, { extraPeriods, collected, method, reference }, admin) {
  const [rental, ctx] = await Promise.all([load(id), loadContext()]);
  expect(rental, IN_USE, "extend");
  const max = rental.plan?.max_periods || 12;
  if (extraPeriods > max) throw ApiError.badRequest(`Extend by at most ${periodLabel(rental.period, max)}`);
  const q = quoteExtension({ rate: rental.rate_paise, gstRate: rental.product.gst_rate, periods: extraPeriods, tax: ctx.tax });

  await prisma.$transaction(async (tx) => {
    await tx.rentalExtension.updateMany({ where: { rental_id: rental.id, status: "requested" }, data: { status: "rejected" } });
    let paymentId = null;
    if (collected) {
      const p = await tx.payment.create({
        data: {
          rental_id: rental.id,
          purpose: "rental_extension",
          gateway: "manual",
          method,
          amount_paise: q.total,
          status: "captured",
          captured_at: new Date(),
          raw_response: { reference: reference || null, recordedBy: admin.name },
        },
      });
      paymentId = p.id;
    }
    const ext = await tx.rentalExtension.create({
      data: { rental_id: rental.id, extra_periods: extraPeriods, amount_paise: q.total, old_end_date: rental.end_date, status: "approved", payment_id: paymentId },
    });
    const fresh = await tx.rental.findUnique({ where: { id: rental.id } });
    await applyExtension(tx, fresh, ext, { actorType: "admin", actorId: admin.id });
    const paid = capturedPaise(await tx.payment.findMany({ where: { rental_id: rental.id } }));
    await tx.rental.update({ where: { id: rental.id }, data: { total_paid_paise: paid } });
  });
  const updated = await load(id);
  notifyRental("rental_extended", updated, {
    end_date: ymd(updated.end_date),
    amount_paid: collected ? formatINR(q.total, { symbol: false }) : "0 (added to your balance)",
  });
  return getAdminRental(id);
}

// ---------------------------------------------------------------------------
// Return
// ---------------------------------------------------------------------------

export async function scheduleReturn(id, { pickupDate, courier, awb, trackingUrl, note }, admin) {
  const rental = await load(id);
  expect(rental, [...IN_USE, "return_scheduled"], "schedule a pickup");
  const date = dateOnly(pickupDate);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.create({
        data: {
          rental_id: rental.id,
          direction: "reverse",
          courier_name: courier || "Buy Denmed pickup team",
          awb_code: awb || null,
          tracking_url: trackingUrl || null,
          pickup_date: date,
          status: "pickup_scheduled",
        },
      });
      await tx.rental.update({ where: { id: rental.id }, data: { status: "return_scheduled", return_requested_on: rental.return_requested_on || date } });
      await history(tx, rental, "return_scheduled", { actorType: "admin", actorId: admin.id, note: note || `Pickup on ${ymd(date)}${courier ? ` via ${courier}` : ""}` });
    });
  } catch (err) {
    if (err?.code === "P2002") throw ApiError.conflict(`AWB ${awb} is already used by another shipment`, "DUPLICATE_AWB", { awb: "Already used" });
    throw err;
  }
  notifyRental("rental_return_scheduled", rental, {
    pickup_date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  });
  return getAdminRental(id);
}

/**
 * Equipment is back: record its condition and any deductions from the deposit.
 * Deposit refund = deposit − deductions (never below zero; unpaid dues can be deducted too).
 */
export async function receiveReturn(id, { condition, notes, deductions, receivedOn }, admin) {
  const rental = await load(id);
  expect(rental, [...IN_USE, "return_scheduled"], "receive the equipment");
  const total = deductions.reduce((s, d) => s + d.amount, 0n);
  const deposit = BigInt(rental.deposit_paise);
  if (total > deposit + balanceOf(rental)) throw ApiError.badRequest("Deductions cannot be more than the deposit plus unpaid dues");
  const refund = deposit - total > 0n ? deposit - total : 0n;
  const received = dateOnly(receivedOn || todayIST());

  await prisma.$transaction(async (tx) => {
    for (const d of deductions) {
      await tx.rentalCharge.create({
        data: { rental_id: rental.id, type: d.type, direction: "debit", amount_paise: d.amount, description: d.description || null, admin_user_id: admin.id },
      });
    }
    await tx.shipment.updateMany({ where: { rental_id: rental.id, direction: "reverse", status: { not: "delivered" } }, data: { status: "delivered", delivered_at: new Date() } });
    if (rental.rental_unit_id) {
      await tx.rentalUnit.update({
        where: { id: rental.rental_unit_id },
        data: {
          status: condition === "good" ? "available" : "under_service",
          condition: condition === "good" ? "good" : condition,
          current_rental_id: null,
        },
      });
    }
    await tx.rental.update({
      where: { id: rental.id },
      data: { status: "returned", returned_at: received, return_condition: condition, return_notes: notes || null, deposit_refund_paise: refund },
    });
    await history(tx, rental, "returned", {
      actorType: "admin",
      actorId: admin.id,
      note: `Received on ${ymd(received)} in ${condition.replace("_", " ")} condition${total > 0n ? ` — deductions ${formatINR(total)}` : ""}. Deposit to refund: ${formatINR(refund)}`,
      unitId: rental.rental_unit_id,
    });
  });
  return getAdminRental(id);
}

export async function refundDeposit(id, { amount, mode, reference, note }, admin) {
  const rental = await load(id);
  expect(rental, ["returned"], "refund the deposit");
  const planned = BigInt(rental.deposit_refund_paise ?? 0n);
  if (amount > planned) throw ApiError.badRequest(`The deposit refund after deductions is ${formatINR(planned)}`);

  if (amount > 0n && mode === "gateway" && rental.deposit_mode === "cheque") {
    throw ApiError.badRequest("This deposit was paid by cheque — refund it by bank transfer or UPI and enter the reference");
  }

  let refund = null;
  if (amount > 0n) {
    ({ refund } = await issueRefund({ rentalId: rental.id, amountPaise: amount, reason: "deposit_refund", mode, reference, note, adminUserId: admin.id, throwOnFailure: true }));
  }
  await prisma.$transaction(async (tx) => {
    if (refund) {
      await tx.rentalCharge.create({
        data: { rental_id: rental.id, type: "deposit_refund", direction: "credit", amount_paise: amount, refund_id: refund.id, admin_user_id: admin.id, description: note || null },
      });
    }
    await tx.rental.update({ where: { id: rental.id }, data: { status: "deposit_refunded", deposit_refunded_at: new Date(), deposit_refund_paise: amount } });
    await history(tx, rental, "deposit_refunded", {
      actorType: "admin",
      actorId: admin.id,
      note: amount > 0n ? `Deposit refund of ${formatINR(amount)} via ${REFUND_METHOD_LABEL[mode].toLowerCase()}` : "Closed — nothing left to refund after deductions",
    });
  });
  if (amount > 0n) {
    notifyRental("deposit_refunded", rental, {
      refund_amount: formatINR(amount, { symbol: false }),
      reference: refund?.reference || refund?.gateway_refund_id || String(refund?.id || ""),
    });
  }
  return getAdminRental(id);
}

/** Any other refund on a rental (e.g. a cancelled booking that could not be refunded automatically). */
export async function issueRentalRefund(id, { amount, mode, reference, note }, admin) {
  const rental = await load(id);
  await issueRefund({ rentalId: rental.id, amountPaise: amount, reason: rental.status === "cancelled" ? "cancel" : "goodwill", mode, reference, note, adminUserId: admin.id, throwOnFailure: true });
  await prisma.$transaction((tx) =>
    history(tx, rental, rental.status, { actorType: "admin", actorId: admin.id, note: `Refund of ${formatINR(amount)} via ${REFUND_METHOD_LABEL[mode].toLowerCase()}` })
  );
  return getAdminRental(id);
}

export async function syncRentalRefund(id, refundId) {
  const rental = await load(id);
  if (!rental.refunds.some((r) => String(r.id) === String(refundId))) throw ApiError.notFound("Refund not found on this rental");
  await syncGatewayRefund(BigInt(refundId));
  return getAdminRental(id);
}

export async function cancelRental(id, { reason }, admin) {
  const rental = await load(id);
  expect(rental, BEFORE_DISPATCH, "cancel");
  await cancelRentalCore(rental, { reason: `Cancelled by staff: ${reason}`, actorType: "admin", actorId: admin.id, adminUserId: admin.id });
  return getAdminRental(id);
}

// ---------------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------------

export async function sendReminder(id, admin) {
  const [rental, ctx] = await Promise.all([load(id), loadContext()]);
  expect(rental, IN_USE, "send a reminder");
  const late = lateFeeToday(rental, ctx.rental);
  const endDate = new Date(rental.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const event = rental.status === "overdue" ? "rental_overdue" : "rental_due_reminder";
  const results = await notify(event, {
    email: rental.customer?.email,
    mobile: rental.customer?.mobile,
    vars: {
      customer_name: rental.customer?.name || "Customer",
      rental_number: rental.rental_number,
      end_date: endDate,
      reminder_days: String(Math.max(0, daysBetween(dateOnly(todayIST()), rental.end_date))),
      late_fee: formatINR(ctx.rental.lateFeePerDayPaise, { symbol: false }),
    },
    entityType: "rental",
    entityId: rental.id,
  });
  await prisma.$transaction((tx) =>
    history(tx, rental, rental.status, {
      actorType: "admin",
      actorId: admin.id,
      note: `${event === "rental_overdue" ? `Overdue reminder (${late.days} day${late.days === 1 ? "" : "s"} late)` : "Due-date reminder"} sent`,
    })
  );
  return { sent: results.filter((r) => r.status === "sent").map((r) => r.channel), rental: await getAdminRental(id) };
}

export async function addNote(id, text, admin) {
  const rental = await load(id);
  let notes = [];
  try {
    notes = rental.notes_internal ? JSON.parse(rental.notes_internal) : [];
  } catch {
    notes = [{ text: rental.notes_internal, by: "Staff", at: rental.updated_at.toISOString() }];
  }
  notes.unshift({ text, by: admin.name, at: new Date().toISOString() });
  await prisma.rental.update({ where: { id: rental.id }, data: { notes_internal: JSON.stringify(notes.slice(0, 100)) } });
  return getAdminRental(id);
}

export async function streamKycDocument(id, docId, res) {
  const rental = await prisma.rental.findFirst({ where: rentalWhere(id), select: { id: true } });
  if (!rental) throw ApiError.notFound("Rental not found");
  const doc = await prisma.rentalKycDocument.findFirst({ where: { id: docId, rental_id: rental.id } });
  if (!doc) throw ApiError.notFound("Document not found");
  await sendKycFile(res, doc);
}

export { getGroup };
