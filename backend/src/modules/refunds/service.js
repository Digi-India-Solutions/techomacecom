import prisma from "../../../db/db.js";
import { alertStaff } from "../../services/admin-alerts.service.js";
import { ApiError } from "../../lib/http.js";
import { formatINR } from "../../lib/money.js";
import { createRefund, fetchRefund, mapRefundStatus, razorpayConfigured } from "../../lib/razorpay.js";

/**
 * Refunds for orders (cancellations, returns, goodwill). One `refunds` row per attempt.
 *
 *   mode "gateway"        → Razorpay refund to the original payment (prepaid orders)
 *   mode "bank_transfer"  → staff already sent the money by NEFT / IMPS (COD orders) — reference = UTR
 *   mode "upi"            → staff already sent the money by UPI — reference = UPI transaction id
 *
 * The amount is reserved inside a transaction that locks the order row, so two clicks
 * (or two staff members) can never refund more than the customer paid.
 */

export const REFUND_MODES = ["gateway", "bank_transfer", "upi"];
const COUNTS_AS_REFUNDED = ["processing", "processed"];
const PAID_STATUSES = ["paid", "refunded", "partially_refunded"];
const COD_COLLECTED_ORDER_STATUSES = ["delivered", "return_requested", "returned"];

const rupees = (paise) => Number(paise || 0n) / 100;

export const REFUND_METHOD_LABEL = {
  gateway: "Original payment method",
  bank_transfer: "Bank transfer",
  upi: "UPI",
};

/** What the customer actually paid for this order (paise). */
export function paidAmountPaise(order, payments = order.payments || []) {
  const captured = payments
    .filter((p) => p.status === "captured" && p.purpose === "order")
    .reduce((sum, p) => sum + BigInt(p.amount_paise), 0n);
  if (captured > 0n) return captured;
  if (order.payment_method === "cod") {
    return COD_COLLECTED_ORDER_STATUSES.includes(order.status) || PAID_STATUSES.includes(order.payment_status)
      ? BigInt(order.total_paise)
      : 0n;
  }
  return PAID_STATUSES.includes(order.payment_status) ? BigInt(order.total_paise) : 0n;
}

export function refundedAmountPaise(refunds = []) {
  return refunds.filter((r) => COUNTS_AS_REFUNDED.includes(r.status)).reduce((sum, r) => sum + BigInt(r.amount_paise), 0n);
}

/** What the customer has paid for a rental: every captured payment (advance, balance, extension, late fee). */
export function rentalPaidPaise(rental, payments = rental.payments || []) {
  return payments.filter((p) => p.status === "captured").reduce((sum, p) => sum + BigInt(p.amount_paise), 0n);
}

/**
 * The captured Razorpay payment a gateway refund goes back to (null for COD / manual-only payments).
 * With several payments (rental advance + balance + extension) it is the one with the most left to refund.
 */
export function gatewayPayment(payments = [], refunds = [], { purposes = ["order"] } = {}) {
  const left = (p) => BigInt(p.amount_paise) - refundedAmountPaise(refunds.filter((r) => r.payment_id === p.id));
  return (
    payments
      .filter((p) => p.gateway === "razorpay" && p.status === "captured" && p.gateway_payment_id && purposes.includes(p.purpose))
      .map((p) => ({ ...p, left: left(p) }))
      .sort((a, b) => (b.left > a.left ? 1 : b.left < a.left ? -1 : 0))[0] || null
  );
}

const RENTAL_PURPOSES = ["rental_booking", "rental_extension", "late_fee"];

/** Totals shown on the admin order page and used to cap every refund. */
export function refundSummary(order) {
  const paid = paidAmountPaise(order);
  const refunded = refundedAmountPaise(order.refunds || []);
  const balance = paid > refunded ? paid - refunded : 0n;
  const payment = gatewayPayment(order.payments || [], order.refunds || []);
  return {
    paid: rupees(paid),
    refunded: rupees(refunded),
    balance: rupees(balance),
    gatewayAvailable: Boolean(payment) && razorpayConfigured(),
    paymentId: payment?.gateway_payment_id || null,
  };
}

export function toRefundDto(r, { admin = false } = {}) {
  const dto = {
    id: String(r.id),
    amount: rupees(r.amount_paise),
    reason: r.reason, // cancel | return | goodwill | deposit_refund
    method: r.method, // gateway | bank_transfer | upi
    methodLabel: REFUND_METHOD_LABEL[r.method] || r.method,
    status: r.status, // processing | processed | failed
    reference: r.reference || r.gateway_refund_id || null,
    note: r.note || null,
    returnId: r.return_id ? String(r.return_id) : null,
    createdAt: r.created_at.toISOString(),
    processedAt: r.processed_at ? r.processed_at.toISOString() : null,
  };
  if (admin) {
    dto.gatewayRefundId = r.gateway_refund_id || null;
    dto.failureReason = r.failure_reason || null;
    dto.processedBy = r.admin_user?.name || (r.admin_user_id ? "Staff" : "System");
  }
  return dto;
}

/** Totals for a rental (paid / refunded / still refundable). */
export function rentalRefundSummary(rental) {
  const paid = rentalPaidPaise(rental);
  const refunded = refundedAmountPaise(rental.refunds || []);
  const balance = paid > refunded ? paid - refunded : 0n;
  const payment = gatewayPayment(rental.payments || [], rental.refunds || [], { purposes: RENTAL_PURPOSES });
  return {
    paid: rupees(paid),
    refunded: rupees(refunded),
    balance: rupees(balance),
    gatewayAvailable: Boolean(payment) && razorpayConfigured(),
    gatewayRefundable: payment ? rupees(payment.left) : 0,
  };
}

/** Keeps orders.payment_status in line with what has been refunded. */
export async function syncOrderPaymentStatus(orderId, tx = prisma) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true, refunds: true } });
  if (!order) return null;
  const paid = paidAmountPaise(order);
  const refunded = refundedAmountPaise(order.refunds);
  let next = order.payment_status;
  if (refunded > 0n && paid > 0n) next = refunded >= paid ? "refunded" : "partially_refunded";
  if (next !== order.payment_status) {
    await tx.order.update({ where: { id: orderId }, data: { payment_status: next } });
  }
  return next;
}

/**
 * Issues one refund.
 * @returns {Promise<{ refund, error?: ApiError }>} — gateway failures are recorded on the row (status "failed")
 *          and returned as `error`; pass throwOnFailure to raise them instead.
 */
export async function issueRefund({
  orderId = null,
  rentalId = null,
  returnId = null,
  amountPaise,
  reason,
  mode,
  reference = null,
  note = null,
  adminUserId = null,
  throwOnFailure = false,
}) {
  if (!REFUND_MODES.includes(mode)) throw ApiError.badRequest("Choose how the refund is paid");
  if (amountPaise < 100n) throw ApiError.badRequest("A refund must be at least ₹1");
  if (mode !== "gateway" && !String(reference || "").trim()) {
    throw ApiError.badRequest(
      mode === "upi" ? "Enter the UPI transaction id of the transfer" : "Enter the UTR / reference of the bank transfer",
      "VALIDATION_ERROR",
      { reference: "Required for manual refunds" }
    );
  }

  if (!orderId === !rentalId) throw new Error("issueRefund needs exactly one of orderId / rentalId");
  const isRental = Boolean(rentalId);
  const what = isRental ? "rental" : "order";

  // 1 — reserve the amount (row lock on the order / rental: concurrent refunds wait here)
  const { refund, order, payment } = await prisma.$transaction(async (tx) => {
    if (isRental) await tx.$queryRaw`SELECT id FROM rentals WHERE id = ${rentalId} FOR UPDATE`;
    else await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const order = isRental
      ? await tx.rental.findUnique({ where: { id: rentalId }, include: { payments: true, refunds: true } })
      : await tx.order.findUnique({ where: { id: orderId }, include: { payments: true, refunds: true } });
    if (!order) throw ApiError.notFound(isRental ? "Rental not found" : "Order not found");

    const paid = isRental ? rentalPaidPaise(order) : paidAmountPaise(order);
    if (paid <= 0n) throw ApiError.badRequest(`Nothing has been paid for this ${what} yet, so there is nothing to refund`);
    const balance = paid - refundedAmountPaise(order.refunds);
    if (amountPaise > balance) {
      throw ApiError.badRequest(
        balance > 0n
          ? `You can refund at most ${formatINR(balance)} on this ${what} (${formatINR(paid)} paid, ${formatINR(paid - balance)} already refunded)`
          : `This ${what} has already been fully refunded`
      );
    }

    let payment = null;
    if (mode === "gateway") {
      if (!isRental && order.payment_method === "cod") {
        throw ApiError.badRequest("Cash on delivery orders are refunded by bank transfer or UPI");
      }
      payment = gatewayPayment(order.payments, order.refunds, { purposes: isRental ? RENTAL_PURPOSES : ["order"] });
      if (!payment) {
        throw ApiError.badRequest(
          `No captured Razorpay payment was found for this ${what}. Refund it by bank transfer or UPI and enter the reference.`
        );
      }
      if (amountPaise > payment.left) {
        throw ApiError.badRequest(
          `Razorpay can refund at most ${formatINR(payment.left)} back to the original payment. Refund the rest by bank transfer or UPI.`
        );
      }
    }

    const refund = await tx.refund.create({
      data: {
        order_id: orderId,
        rental_id: rentalId,
        return_id: returnId,
        payment_id: payment?.id ?? null,
        amount_paise: amountPaise,
        reason,
        method: mode,
        reference: mode === "gateway" ? null : String(reference).trim().slice(0, 80),
        note: note ? String(note).trim().slice(0, 500) : null,
        status: mode === "gateway" ? "processing" : "processed",
        processed_at: mode === "gateway" ? null : new Date(),
        admin_user_id: adminUserId,
      },
    });
    return { refund, order, payment };
  });

  if (mode !== "gateway") {
    if (!isRental) await syncOrderPaymentStatus(orderId);
    return { refund };
  }

  // 2 — ask Razorpay (outside the transaction: never hold a DB lock during a network call)
  try {
    const rp = await createRefund(payment.gateway_payment_id, {
      amountPaise,
      receipt: `refund-${refund.id}`,
      notes: { [isRental ? "rental_number" : "order_number"]: isRental ? order.rental_number : order.order_number, refund_id: String(refund.id), reason },
    });
    const status = mapRefundStatus(rp.status);
    const updated = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        gateway_refund_id: rp.id,
        status,
        processed_at: status === "processed" ? new Date() : null,
        failure_reason: status === "failed" ? "Razorpay marked the refund as failed" : null,
      },
    });
    if (!isRental) await syncOrderPaymentStatus(orderId);
    if (status === "failed") {
      const error = new ApiError(502, "GATEWAY_ERROR", "Razorpay could not process the refund");
      if (throwOnFailure) throw error;
      return { refund: updated, error };
    }
    return { refund: updated };
  } catch (err) {
    const error = err instanceof ApiError ? err : new ApiError(502, "GATEWAY_ERROR", err.message || "Refund failed");
    const failed = await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "failed", failure_reason: error.message.slice(0, 500) },
    });
    if (!throwOnFailure) {
      // Automatic refund (customer cancellation) — nobody is watching, so tell the team
      alertStaff({
        type: "refund_failed",
        title: `Automatic refund of ${formatINR(amountPaise)} failed`,
        message: `${isRental ? `Rental ${order.rental_number}` : `Order ${order.order_number}`}: ${error.message}`,
        severity: "urgent",
        link: isRental ? `/admin/rentals/${rentalId}` : `/admin/orders/${orderId}`,
        entityType: isRental ? "rental" : "order",
        entityId: isRental ? rentalId : orderId,
        permission: isRental ? "rentals.edit" : "returns.edit",
      });
    }
    if (throwOnFailure) throw error;
    return { refund: failed, error };
  }
}

/** Re-reads a Razorpay refund that is still "processing" (normal-speed refunds settle in a few days). */
export async function syncGatewayRefund(refundId) {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } });
  if (!refund) throw ApiError.notFound("Refund not found");
  if (refund.method !== "gateway" || !refund.gateway_refund_id) {
    throw ApiError.badRequest("Only Razorpay refunds can be refreshed");
  }
  const rp = await fetchRefund(refund.gateway_refund_id);
  const status = mapRefundStatus(rp.status);
  const updated = await prisma.refund.update({
    where: { id: refund.id },
    data: {
      status,
      processed_at: status === "processed" ? refund.processed_at || new Date() : refund.processed_at,
      failure_reason: status === "failed" ? "Razorpay marked the refund as failed" : null,
    },
  });
  if (updated.order_id) await syncOrderPaymentStatus(updated.order_id);
  return updated;
}
