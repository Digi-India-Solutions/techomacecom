import { publicUrl } from "../../lib/storage.js";
import { decryptJson } from "../../lib/crypto.js";
import { toRefundDto } from "../refunds/service.js";

/**
 * Response shapes for return / replacement requests (storefront + admin).
 * Money is sent in rupees. Bank / UPI details are masked except in the admin detail view.
 */

export const RETURN_STATUS_LABEL = {
  requested: "Request submitted",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  received: "Item received",
  replacement_shipped: "Replacement shipped",
  refunded: "Refunded",
  completed: "Replacement delivered",
  rejected: "Not approved",
  cancelled: "Cancelled",
};

export const RETURN_TYPE_LABEL = { refund: "Return & refund", replacement: "Replacement" };

const STEP_LABEL = {
  requested: "Request submitted",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  received: "Received & inspected",
  refunded: "Refund issued",
  replacement_shipped: "Replacement shipped",
  completed: "Replacement delivered",
  rejected: "Not approved",
  cancelled: "Cancelled",
};

/** Everything the DTOs below read. Used by the orders and returns services. */
export const RETURN_DETAIL_INCLUDE = {
  items: {
    include: {
      order_item: {
        include: {
          product: { select: { id: true, slug: true, images: { select: { url: true, sort_order: true }, orderBy: { sort_order: "asc" }, take: 1 } } },
          variant: { select: { image_url: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  },
  refunds: { orderBy: { created_at: "asc" }, include: { admin_user: { select: { name: true } } } },
  shipments: { orderBy: { created_at: "asc" } },
  status_history: { orderBy: { created_at: "asc" } },
};

const rupees = (paise) => Number(paise || 0n) / 100;
const iso = (d) => (d ? new Date(d).toISOString() : null);

function itemImage(oi) {
  const img = oi?.product?.images?.[0]?.url || oi?.variant?.image_url;
  return img ? publicUrl(img) : "";
}

export function maskAccount(acc) {
  if (!acc) return null;
  if (acc.mode === "upi") {
    const [user = "", host = ""] = String(acc.upiId || "").split("@");
    return { mode: "upi", label: `UPI · ${user.slice(0, 2)}•••@${host}` };
  }
  const num = String(acc.accountNumber || "");
  return {
    mode: "bank",
    label: `${acc.bankName ? `${acc.bankName} · ` : ""}A/c •••• ${num.slice(-4)}`,
  };
}

function shipmentDto(s) {
  if (!s) return null;
  return {
    courier: s.courier_name || "",
    awb: s.awb_code || "",
    trackingUrl: s.tracking_url || "",
    pickupDate: s.pickup_date ? s.pickup_date.toISOString().slice(0, 10) : null,
    status: s.status,
    createdAt: iso(s.created_at),
    deliveredAt: iso(s.delivered_at),
  };
}

/** Progress tracker for the storefront and admin (skipped steps count as done). */
export function buildSteps(ret) {
  const reached = (status) => [...(ret.status_history || [])].reverse().find((h) => h.to_status === status)?.created_at || null;

  if (ret.status === "rejected" || ret.status === "cancelled") {
    return [
      { key: "requested", label: STEP_LABEL.requested, done: true, current: false, at: iso(reached("requested") || ret.created_at) },
      { key: ret.status, label: STEP_LABEL[ret.status], done: true, current: true, at: iso(reached(ret.status) || ret.resolved_at) },
    ];
  }

  const path =
    ret.status === "refunded"
      ? "refund"
      : ret.status === "replacement_shipped" || ret.status === "completed"
        ? "replacement"
        : ret.type;
  const keys = ["requested", "approved", "pickup_scheduled", "received", ...(path === "refund" ? ["refunded"] : ["replacement_shipped", "completed"])];
  const currentIdx = keys.indexOf(ret.status);

  return keys.map((key, i) => ({
    key,
    label: STEP_LABEL[key],
    done: i <= currentIdx,
    current: i === currentIdx,
    at: iso(key === "requested" ? reached(key) || ret.created_at : reached(key)),
  }));
}

function common(ret) {
  const reverse = (ret.shipments || []).filter((s) => s.direction === "reverse").pop();
  const replacement = (ret.shipments || []).filter((s) => s.direction === "forward").pop();
  return {
    id: String(ret.id),
    returnNumber: ret.return_number,
    type: ret.type,
    typeLabel: RETURN_TYPE_LABEL[ret.type] || ret.type,
    status: ret.status,
    statusLabel: RETURN_STATUS_LABEL[ret.status] || ret.status,
    reason: ret.reason || "",
    customerNote: ret.customer_note || "",
    photos: (ret.photos || []).map((p) => publicUrl(p)).filter(Boolean),
    items: (ret.items || []).map((ri) => ({
      id: String(ri.id),
      orderItemId: String(ri.order_item_id),
      productName: ri.order_item?.product_name || "Product",
      variantName: ri.order_item?.variant_name && ri.order_item.variant_name !== "Default" ? ri.order_item.variant_name : "",
      sku: ri.order_item?.sku || "",
      image: itemImage(ri.order_item),
      quantity: ri.quantity,
      orderedQuantity: ri.order_item?.quantity || ri.quantity,
      refundAmount: rupees(ri.refund_amount_paise),
      condition: ri.condition_received || null,
    })),
    requestedAmount: rupees(ret.requested_amount_paise),
    rejectionReason: ret.rejection_reason || null,
    pickup: shipmentDto(reverse),
    replacementShipment: shipmentDto(replacement),
    steps: buildSteps(ret),
    createdAt: iso(ret.created_at),
    updatedAt: iso(ret.updated_at),
    resolvedAt: iso(ret.resolved_at),
  };
}

export function toCustomerReturnDto(ret, order = ret.order) {
  const refunds = (ret.refunds || []).map((r) => toRefundDto(r));
  return {
    ...common(ret),
    orderId: order ? String(order.id) : String(ret.order_id),
    orderNumber: order?.order_number || "",
    refundAccount: maskAccount(decryptJson(ret.refund_account)),
    refunds,
    refundedAmount: refunds.filter((r) => r.status !== "failed").reduce((s, r) => s + r.amount, 0),
    canCancel: ["requested", "approved"].includes(ret.status),
    timeline: (ret.status_history || []).map((h) => ({
      status: h.to_status,
      label: RETURN_STATUS_LABEL[h.to_status] || h.to_status,
      note: h.actor_type === "admin" || h.actor_type === "system" ? h.note || "" : "",
      at: iso(h.created_at),
    })),
  };
}

/**
 * @param opts.detail   include decrypted bank / UPI details (admin detail view only)
 * @param opts.adminNames Map of admin id → name for the history
 */
export function toAdminReturnDto(ret, { detail = false, adminNames = new Map(), refundable } = {}) {
  const order = ret.order || {};
  const ship = order.shipping_address || {};
  const account = decryptJson(ret.refund_account);
  const refunds = (ret.refunds || []).map((r) => toRefundDto(r, { admin: true }));
  return {
    ...common(ret),
    orderId: String(order.id || ret.order_id),
    orderNumber: order.order_number || "",
    orderTotal: rupees(order.total_paise),
    orderPlacedAt: iso(order.placed_at),
    orderDeliveredAt: iso(order.delivered_at),
    paymentMethod: order.payment_method === "cod" ? "COD" : order.payment_method === "emi" ? "EMI" : "Razorpay",
    customer: {
      id: order.customer_id ? String(order.customer_id) : "",
      name: ship.name || order.customer?.name || "Customer",
      phone: ship.phone || order.customer?.mobile || "",
      email: order.customer?.email || "",
      address: [ship.line1 || ship.addressLine1, ship.line2 || ship.addressLine2, ship.city, ship.state, ship.pincode]
        .filter(Boolean)
        .join(", "),
    },
    refundAccount: account ? { ...maskAccount(account), ...(detail ? { details: account } : {}) } : null,
    adminNote: ret.admin_note || "",
    refunds,
    refundedAmount: refunds.filter((r) => r.status !== "failed").reduce((s, r) => s + r.amount, 0),
    history: (ret.status_history || []).map((h) => ({
      id: String(h.id),
      status: h.to_status,
      label: RETURN_STATUS_LABEL[h.to_status] || h.to_status,
      note: h.note || "",
      actor:
        h.actor_type === "admin"
          ? adminNames.get(String(h.actor_id)) || "Staff"
          : h.actor_type === "customer"
            ? "Customer"
            : "System",
      at: iso(h.created_at),
    })),
    ...(refundable ? { refundable } : {}),
  };
}
