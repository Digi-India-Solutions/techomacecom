import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { getGroup } from "../settings/service.js";
import { publicUrl } from "../../lib/storage.js";

/**
 * Account orders service — storefront "My Orders" for a signed-in customer.
 *
 * Returns the same shape the storefront Order type expects so the frontend
 * never has to guess.  Money is always returned in rupees (÷ 100).
 */

/** Map DB status to the storefront OrderStatus enum. */
const STATUS_MAP = {
  pending_payment: "Placed",
  payment_failed: "Placed",
  confirmed: "Confirmed",
  processing: "Confirmed",
  packed: "Packed",
  ready_to_ship: "Packed",
  shipped: "Dispatched",
  out_for_delivery: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Delivered",
  return_approved: "Delivered",
  return_picked_up: "Delivered",
  refunded: "Delivered",
};

const toRupees = (paise) => Number(paise) / 100;

/** Build the 5-step tracking timeline from status_history + current status. */
function buildTimeline(statusHistory, currentStatus) {
  const STEPS = [
    { key: "Placed", label: "Order Placed", desc: "Your order has been received and payment is being processed." },
    { key: "Confirmed", label: "Verified by Procurement", desc: "Order confirmed and product(s) are being prepared." },
    { key: "Packed", label: "Packed & Ready", desc: "Items packed and ready for dispatch." },
    { key: "Dispatched", label: "Dispatched", desc: "Your order is on its way." },
    { key: "Delivered", label: "Delivered", desc: "Order successfully delivered." },
  ];

  // Build a map of status → timestamp from history
  const historyMap = {};
  for (const h of statusHistory) {
    const mapped = STATUS_MAP[h.to_status];
    if (mapped && !historyMap[mapped]) {
      historyMap[mapped] = h.created_at;
    }
  }

  const displayStatus = STATUS_MAP[currentStatus] || "Placed";

  // Find which step index we're currently at
  const currentIdx = STEPS.findIndex((s) => s.key === displayStatus);
  // For cancelled orders, mark only Placed as completed
  const isCancelled = currentStatus === "cancelled";

  return STEPS.map((step, i) => {
    let completed;
    if (isCancelled) {
      completed = step.key === "Placed";
    } else {
      completed = currentIdx === -1 ? false : i <= currentIdx;
    }

    const ts = historyMap[step.key];
    let dateStr = "";
    if (ts) {
      dateStr = new Date(ts).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (!completed) {
      dateStr = "Pending";
    }

    return {
      status: step.key,
      date: dateStr,
      title: step.label,
      description: step.desc,
      completed,
    };
  });
}

/** Convert shipping_address JSON snapshot to storefront Address shape. */
function toShippingAddress(snap) {
  if (!snap) return null;
  return {
    id: snap.id || "",
    type: snap.type || "Home",
    name: snap.name || snap.contact_name || "",
    clinicHospitalName: snap.organisation_name || snap.clinicHospitalName || null,
    phone: snap.phone || "",
    addressLine1: snap.line1 || snap.addressLine1 || "",
    addressLine2: snap.line2 || snap.addressLine2 || "",
    landmark: snap.landmark || "",
    city: snap.city || "",
    state: snap.state || "",
    pincode: snap.pincode || "",
    isDefault: false,
  };
}

/** Resolve product image URL from the first variant image, then product images. */
function getProductImage(product) {
  if (!product) return "";
  // Try main product image first
  const img = product.images?.find((i) => i.sort_order === 0) || product.images?.[0];
  if (img?.url) return publicUrl(img.url);
  return "";
}

/** Map a Prisma order row (with relations) → storefront Order DTO. */
function toOrderDto(order, shipment) {
  const displayStatus = STATUS_MAP[order.status] || "Placed";

  const items = (order.items || []).map((item) => ({
    productId: String(item.product_id),
    productName: item.product_name,
    brandName: item.product?.brand?.name || item.variant?.product?.brand?.name || "",
    image: getProductImage(item.product),
    sku: item.sku,
    variantName: item.variant_name || undefined,
    quantity: item.quantity,
    unitPrice: toRupees(item.unit_price_paise),
    totalPrice: toRupees(item.line_total_paise),
  }));

  const timeline = buildTimeline(order.status_history || [], order.status);

  // Payment method display
  const pm = order.payment_method;
  const paymentMethod =
    pm === "cod" ? "Cash on Delivery" : "Online Razorpay (Cards/UPI/EMI)";

  // Payment status display
  const ps = order.payment_status;
  const paymentStatus =
    ps === "paid" ? "Paid" : ps === "refunded" ? "Refunded" : "Pending";

  // Invoice (latest)
  const invoice = (order.invoices || []).sort(
    (a, b) => new Date(b.issued_at) - new Date(a.issued_at)
  )[0];

  // Coupon & COD charges
  const totalDiscount =
    toRupees(order.discount_paise) + toRupees(order.coupon_discount_paise);

  return {
    id: String(order.id),
    orderNumber: order.order_number,
    date: order.placed_at?.toISOString() || order.created_at?.toISOString(),
    status: displayStatus,
    items,
    subtotal: toRupees(order.subtotal_paise),
    discount: totalDiscount,
    shipping: toRupees(order.shipping_paise) + toRupees(order.cod_charge_paise),
    gstAmount: toRupees(order.tax_paise),
    totalAmount: toRupees(order.total_paise),
    paymentMethod,
    paymentStatus,
    shippingAddress: toShippingAddress(order.shipping_address),
    gstDetails: order.gstin
      ? { gstin: order.gstin, legalBusinessName: order.company_name || "" }
      : undefined,
    // Shipment details
    trackingNumber: shipment?.awb_code || undefined,
    courierPartner: shipment?.courier_name || undefined,
    trackingUrl: shipment?.tracking_url || undefined,
    estimatedDelivery: order.delivered_at
      ? order.delivered_at.toISOString().slice(0, 10)
      : "",
    timeline,
    // Invoice
    invoiceNumber: invoice?.invoice_number || undefined,
    invoiceUrl: invoice?.pdf_url || undefined,
    couponCode: order.coupon_code || undefined,
  };
}

/** SELECT includes everything the DTO needs. */
const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          brand: { select: { name: true } },
          images: { select: { url: true, sort_order: true }, orderBy: { sort_order: "asc" }, take: 1 },
        },
      },
      variant: { select: { id: true } },
    },
  },
  status_history: {
    orderBy: { created_at: "asc" },
    select: { to_status: true, created_at: true },
  },
  shipments: {
    where: { direction: "forward" },
    orderBy: { created_at: "desc" },
    take: 1,
    select: {
      awb_code: true,
      courier_name: true,
      tracking_url: true,
      delivered_at: true,
      status: true,
    },
  },
  invoices: {
    orderBy: { issued_at: "desc" },
    take: 1,
    select: { invoice_number: true, pdf_url: true, issued_at: true },
  },
};

/** List all orders for a customer, newest first. */
export async function listOrders(customerId) {
  const orders = await prisma.order.findMany({
    where: { customer_id: BigInt(customerId) },
    include: ORDER_INCLUDE,
    orderBy: { placed_at: "desc" },
  });

  return orders.map((o) => {
    const shipment = o.shipments?.[0] || null;
    return toOrderDto(o, shipment);
  });
}

/** Single order — 404 if it doesn't belong to this customer. */
export async function getOrder(customerId, orderId) {
  // Accept both numeric id and orderNumber (BDM-2026-…)
  const isNumeric = /^\d+$/.test(String(orderId));
  const where = isNumeric
    ? { id: BigInt(orderId), customer_id: BigInt(customerId) }
    : { order_number: orderId, customer_id: BigInt(customerId) };

  const order = await prisma.order.findFirst({ where, include: ORDER_INCLUDE });
  if (!order) throw ApiError.notFound("Order not found");

  const shipment = order.shipments?.[0] || null;
  return toOrderDto(order, shipment);
}
