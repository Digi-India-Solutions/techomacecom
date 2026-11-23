import { publicUrl } from "../../lib/storage.js";
import { toRefundDto } from "../refunds/service.js";
import { KYC_DOCUMENT_TYPES } from "../settings/definitions.js";
import { PERIOD_UNITS, timeLabel, DEPOSIT_PAYMENT_PURPOSE, capturedPaise, depositChequeDuePaise, lateFeeToday, onlineDuePaise, periodLabel, rentalTotalPaise, todayIST, daysBetween, dateOnly, ymd } from "./pricing.js";

/** Response shapes for rentals (storefront "My rentals" + admin Rentals). Money in rupees. */

export const RENTAL_STATUS_LABEL = {
  pending_payment: "Awaiting payment",
  pending_approval: "Under review",
  approved: "Confirmed",
  dispatched: "Dispatched",
  active: "Active",
  extension_requested: "Extension requested",
  overdue: "Overdue",
  return_scheduled: "Pickup scheduled",
  returned: "Returned",
  deposit_refunded: "Completed",
  cancelled: "Cancelled",
};

export const KYC_STATUS_LABEL = {
  pending: "Documents needed",
  submitted: "Under verification",
  approved: "Verified",
  rejected: "Re-upload needed",
};

const DOC = Object.fromEntries(KYC_DOCUMENT_TYPES.map((d) => [d.key, d]));
const PAYMENT_PURPOSE = { rental_booking: "Booking payment", rental_extension: "Extension", late_fee: "Late fee", rental_deposit: "Deposit cheque" };
const PAYMENT_METHOD = { cash: "Cash", upi: "UPI", bank_transfer: "Bank transfer", cheque: "Cheque" };

export const RENTAL_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, mobile: true } },
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      gst_rate: true,
      images: { select: { url: true }, orderBy: { sort_order: "asc" }, take: 1 },
      brand: { select: { name: true } },
    },
  },
  plan: true,
  unit: { select: { id: true, unit_code: true, serial_number: true, condition: true, status: true } },
  kyc_documents: { orderBy: { created_at: "asc" } },
  extensions: { orderBy: { created_at: "asc" } },
  charges: { orderBy: { created_at: "asc" } },
  status_history: { orderBy: { created_at: "asc" } },
  payments: { orderBy: { created_at: "asc" } },
  refunds: { orderBy: { created_at: "asc" }, include: { admin_user: { select: { name: true } } } },
  shipments: { orderBy: { created_at: "asc" } },
};

const rupees = (paise) => Number(paise || 0n) / 100;
const iso = (d) => (d ? new Date(d).toISOString() : null);

function address(a) {
  if (!a) return null;
  return {
    name: a.name || "",
    phone: a.phone || "",
    organisation: a.organisation_name || a.clinicHospitalName || "",
    line1: a.line1 || a.addressLine1 || "",
    line2: a.line2 || a.addressLine2 || "",
    landmark: a.landmark || "",
    city: a.city || "",
    state: a.state || "",
    pincode: a.pincode || "",
  };
}

/** Latest upload per required document type (older rejected copies stay for the audit trail). */
export function kycSummary(r) {
  const required = r.kyc_required_docs || [];
  const docs = (r.kyc_documents || []).map((d) => ({
    id: String(d.id),
    docType: d.doc_type,
    label: DOC[d.doc_type]?.label || d.doc_type,
    fileName: d.file_name,
    mimeType: d.mime_type,
    size: d.size_bytes,
    status: d.status,
    rejectReason: d.reject_reason || null,
    uploadedAt: iso(d.created_at),
  }));
  const latest = (key) => [...docs].reverse().find((d) => d.docType === key) || null;
  return {
    required: required.length > 0,
    status: r.kyc_status,
    statusLabel: r.kyc_status ? KYC_STATUS_LABEL[r.kyc_status] : null,
    note: r.kyc_note || null,
    requirements: required.map((key) => ({
      key,
      label: DOC[key]?.label || key,
      hint: DOC[key]?.hint || "",
      document: latest(key),
    })),
    documents: docs,
  };
}

/** Customer-facing progress tracker. */
function steps(r) {
  const at = (...statuses) => {
    const h = [...(r.status_history || [])].reverse().find((x) => statuses.includes(x.to_status));
    return iso(h?.created_at);
  };
  if (r.status === "cancelled") {
    return [
      { key: "booked", label: "Booked", done: true, current: false, at: iso(r.created_at) },
      { key: "cancelled", label: "Cancelled", done: true, current: true, at: iso(r.cancelled_at) || at("cancelled") },
    ];
  }
  const order = ["pending_payment", "pending_approval", "approved", "dispatched", "active", "return_scheduled", "returned", "deposit_refunded"];
  const pos = (s) => (s === "overdue" || s === "extension_requested" ? order.indexOf("active") : order.indexOf(s));
  const cur = pos(r.status);
  const list = [
    { key: "booked", label: "Booked", reachedAt: 1, at: at("pending_approval") || iso(r.created_at) },
    { key: "approved", label: "Confirmed", reachedAt: 2, at: at("approved") },
    { key: "dispatched", label: "Dispatched", reachedAt: 3, at: iso(r.dispatched_at) || at("dispatched") },
    { key: "active", label: "In use", reachedAt: 4, at: iso(r.delivered_at) || at("active") },
    { key: "returned", label: "Returned", reachedAt: 6, at: iso(r.returned_at) || at("returned") },
    { key: "deposit_refunded", label: "Deposit refunded", reachedAt: 7, at: iso(r.deposit_refunded_at) || at("deposit_refunded") },
  ];
  return list.map((s, i) => ({
    key: s.key,
    label: s.label,
    done: cur >= s.reachedAt,
    current: cur >= s.reachedAt && (i === list.length - 1 || cur < list[i + 1].reachedAt),
    at: cur >= s.reachedAt ? s.at : null,
  }));
}

function shipment(s) {
  if (!s) return null;
  return {
    courier: s.courier_name || "",
    awb: s.awb_code || "",
    trackingUrl: s.tracking_url || "",
    pickupDate: s.pickup_date ? ymd(s.pickup_date) : null,
    status: s.status,
    createdAt: iso(s.created_at),
    deliveredAt: iso(s.delivered_at),
  };
}

/**
 * Shared by both DTOs.
 * @param ctx { rental: settings.rental } — for late fees / what the customer may do
 */
function base(r, ctx) {
  const total = rentalTotalPaise(r);
  const paid = capturedPaise(r.payments);
  const refunded = (r.refunds || []).filter((x) => x.status !== "failed").reduce((s, x) => s + BigInt(x.amount_paise), 0n);
  const advanceLeft = BigInt(r.advance_paise) - paid > 0n ? BigInt(r.advance_paise) - paid : 0n;
  const balance = onlineDuePaise(r); // a cheque deposit is tracked on its own (depositChequeDue)
  const depositChequeDue = depositChequeDuePaise(r);
  const cheque = (r.payments || []).filter((p) => p.purpose === DEPOSIT_PAYMENT_PURPOSE && p.status === "captured").pop();
  const late = lateFeeToday(r, ctx.rental);
  const today = todayIST();
  const forward = (r.shipments || []).filter((s) => s.direction === "forward").pop();
  const reverse = (r.shipments || []).filter((s) => s.direction === "reverse").pop();
  const pendingExtension = (r.extensions || []).find((e) => e.status === "requested");

  return {
    id: String(r.id),
    rentalNumber: r.rental_number,
    status: r.status,
    statusLabel: RENTAL_STATUS_LABEL[r.status] || r.status,
    product: {
      id: String(r.product_id),
      name: r.product_name,
      slug: r.product?.slug || "",
      brand: r.product?.brand?.name || "",
      image: publicUrl(r.product?.images?.[0]?.url) || "",
    },
    plan: {
      period: r.period,
      periodLabel: PERIOD_UNITS[r.period]?.adverb || r.period,
      unit: PERIOD_UNITS[r.period]?.one || r.period,
      rate: rupees(r.rate_paise),
      periods: r.periods,
      durationLabel: periodLabel(r.period, r.periods),
      minPeriods: r.plan?.min_periods ?? 1,
      maxPeriods: r.plan?.max_periods ?? 12,
    },
    requestedStartDate: ymd(r.requested_start_date),
    requestedDeliveryTime: r.requested_delivery_time || null,
    requestedDeliveryTimeLabel: timeLabel(r.requested_delivery_time),
    startDate: ymd(r.start_date),
    endDate: ymd(r.end_date),
    daysLeft: r.end_date && ["active", "overdue"].includes(r.status) ? daysBetween(dateOnly(today), r.end_date) : null,
    overdueDays: late.days,
    lateFeeAccrued: rupees(late.fee),
    amounts: {
      rent: rupees(r.rent_paise),
      delivery: rupees(r.charges_paise),
      gst: rupees(r.tax_paise),
      deposit: rupees(r.deposit_paise),
      total: rupees(total),
      advancePercent: r.advance_percent,
      advance: rupees(r.advance_paise),
      paid: rupees(paid),
      advanceDue: rupees(advanceLeft),
      balanceDue: rupees(balance),
      refunded: rupees(refunded),
      depositRefund: r.deposit_refund_paise != null ? rupees(r.deposit_refund_paise) : null,
      depositChequeDue: rupees(depositChequeDue),
    },
    deposit: {
      mode: r.deposit_mode || "online", // online | cheque
      chequeReceived: r.deposit_mode === "cheque" && BigInt(r.deposit_paise) > 0n && depositChequeDue === 0n,
      chequeNumber: cheque?.raw_response?.reference || null,
      chequeBank: cheque?.raw_response?.bank || null,
      chequeReceivedAt: iso(cheque?.captured_at),
    },
    balanceDuePolicy: r.balance_due,
    deliveryAddress: address(r.delivery_address),
    kyc: kycSummary(r),
    unit: r.unit && ["dispatched", "active", "overdue", "extension_requested", "return_scheduled", "returned", "deposit_refunded"].includes(r.status)
      ? { serialNumber: r.unit.serial_number }
      : null,
    delivery: shipment(forward),
    returnPickup: shipment(reverse),
    returnRequestedOn: ymd(r.return_requested_on),
    returnCondition: r.return_condition || null,
    returnNotes: r.return_notes || null,
    deductions: (r.charges || [])
      .filter((c) => ["late_fee", "damage", "missing_accessory"].includes(c.type))
      .map((c) => ({ id: String(c.id), type: c.type, amount: rupees(c.amount_paise), description: c.description || "" })),
    extensions: (r.extensions || []).map((e) => ({
      id: String(e.id),
      extraPeriods: e.extra_periods,
      amount: rupees(e.amount_paise),
      status: e.status,
      oldEndDate: ymd(e.old_end_date),
      newEndDate: ymd(e.new_end_date),
      createdAt: iso(e.created_at),
    })),
    pendingExtensionId: pendingExtension ? String(pendingExtension.id) : null,
    payments: (r.payments || [])
      .filter((p) => p.status === "captured")
      .map((p) => ({
        id: String(p.id),
        amount: rupees(p.amount_paise),
        purpose: PAYMENT_PURPOSE[p.purpose] || p.purpose,
        method: p.gateway === "razorpay" ? `Online${p.method ? ` · ${p.method.toUpperCase()}` : ""}` : PAYMENT_METHOD[p.method] || "Offline",
        reference: p.gateway_payment_id || p.raw_response?.reference || null,
        paidAt: iso(p.captured_at || p.created_at),
      })),
    refunds: (r.refunds || []).map((x) => toRefundDto(x)),
    steps: steps(r),
    cancelReason: r.cancel_reason || null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

const BEFORE_DISPATCH = ["pending_payment", "pending_approval", "approved"];
const IN_USE = ["active", "overdue"];

export function toCustomerRentalDto(r, ctx) {
  const b = base(r, ctx);
  const kycNeedsUpload = b.kyc.required && ["pending", "rejected"].includes(r.kyc_status) && r.status !== "cancelled";
  return {
    ...b,
    timeline: (r.status_history || []).map((h) => ({
      status: h.to_status,
      label: RENTAL_STATUS_LABEL[h.to_status] || h.to_status,
      note: h.actor_type === "customer" ? "" : h.note || "",
      at: iso(h.created_at),
    })),
    actions: {
      payAdvance: r.status === "pending_payment" && b.amounts.advanceDue > 0,
      payBalance: r.status !== "pending_payment" && r.status !== "cancelled" && r.status !== "deposit_refunded" && b.amounts.balanceDue > 0,
      cancel: BEFORE_DISPATCH.includes(r.status),
      uploadKyc: kycNeedsUpload,
      extend: IN_USE.includes(r.status) && !b.pendingExtensionId,
      requestReturn: IN_USE.includes(r.status) && !r.return_requested_on,
    },
  };
}

export function toAdminRentalDto(r, ctx, { adminNames = new Map(), units = null, detail = false } = {}) {
  const b = base(r, ctx);
  let notes = [];
  if (r.notes_internal) {
    try {
      notes = JSON.parse(r.notes_internal);
    } catch {
      notes = [{ text: r.notes_internal, by: "Staff", at: iso(r.updated_at) }];
    }
  }
  return {
    ...b,
    customer: {
      id: String(r.customer_id),
      name: r.customer?.name || b.deliveryAddress?.name || "Customer",
      phone: r.customer?.mobile || b.deliveryAddress?.phone || "",
      email: r.customer?.email || "",
    },
    unit: r.unit
      ? { id: String(r.unit.id), unitCode: r.unit.unit_code, serialNumber: r.unit.serial_number, condition: r.unit.condition, status: r.unit.status }
      : null,
    prescriptionRequired: Boolean(r.plan?.prescription_required),
    ledger: (r.charges || []).map((c) => ({
      id: String(c.id),
      type: c.type,
      direction: c.direction,
      amount: rupees(c.amount_paise),
      description: c.description || "",
      at: iso(c.created_at),
    })),
    refunds: (r.refunds || []).map((x) => toRefundDto(x, { admin: true })),
    internalNotes: notes,
    ...(detail
      ? {
          history: (r.status_history || []).map((h) => ({
            id: String(h.id),
            status: h.to_status,
            label: RENTAL_STATUS_LABEL[h.to_status] || h.to_status,
            note: h.note || "",
            actor: h.actor_type === "admin" ? adminNames.get(String(h.actor_id)) || "Staff" : h.actor_type === "customer" ? "Customer" : "System",
            at: iso(h.created_at),
          })),
          availableUnits: units,
        }
      : {}),
  };
}
