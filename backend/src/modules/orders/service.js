import crypto from "node:crypto";
import { alertStaff } from "../../services/admin-alerts.service.js";
import { assertInStock, cancelOrderStock, reserveOrder, shipOrder } from "../inventory/stock.js";
import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { publicUrl } from "../../lib/storage.js";
import { notify } from "../../services/notification.service.js";
import { getGroup } from "../settings/service.js";
import { check as checkPincode } from "../settings/pincodes.service.js";
import { STATE_OPTIONS } from "../settings/definitions.js";
import env from "../../../config/env.js";
import { formatINR } from "../../lib/money.js";
import { loadReturnContext, returnPolicy } from "../returns/policy.js";
import { RETURN_DETAIL_INCLUDE, RETURN_STATUS_LABEL, toCustomerReturnDto } from "../returns/dto.js";
import { issueRefund, refundSummary, syncGatewayRefund, toRefundDto, REFUND_METHOD_LABEL } from "../refunds/service.js";

/**
 * Orders service — shared by customer storefront checkout/account and admin sales order page.
 *
 * All money in DB is stored in paise (BigInt) and exposed in rupees (÷ 100).
 */

const STATUS_MAP_CUSTOMER = {
  new: "Placed",
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
  returned: "Delivered",
  refunded: "Delivered",
};

/** Orders a customer can still cancel themselves (nothing has left the warehouse). */
const CUSTOMER_CANCELLABLE = ["pending_payment", "payment_failed", "confirmed", "packed"];

const PAYMENT_STATUS_CUSTOMER = {
  paid: "Paid",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  failed: "Failed",
};

const toRupees = (paise) => Number(paise || 0n) / 100;

function getProductImage(product) {
  if (!product) return "";
  const img = product.images?.find((i) => i.sort_order === 0) || product.images?.[0];
  if (img?.url) return publicUrl(img.url);
  return "";
}

function buildCustomerTimeline(statusHistory, currentStatus) {
  const STEPS = [
    { key: "Placed", label: "Order Placed", desc: "Your order has been received and is being processed." },
    { key: "Confirmed", label: "Verified by Procurement", desc: "Order confirmed and product(s) are being prepared." },
    { key: "Packed", label: "Packed & Ready", desc: "Items packed and ready for dispatch." },
    { key: "Dispatched", label: "Dispatched", desc: "Your order is on its way." },
    { key: "Delivered", label: "Delivered", desc: "Order successfully delivered." },
  ];

  const historyMap = {};
  for (const h of statusHistory || []) {
    const mapped = STATUS_MAP_CUSTOMER[h.to_status];
    if (mapped && !historyMap[mapped]) {
      historyMap[mapped] = h.created_at;
    }
  }

  const displayStatus = STATUS_MAP_CUSTOMER[currentStatus] || "Placed";
  const currentIdx = STEPS.findIndex((s) => s.key === displayStatus);
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

function toShippingAddress(snap) {
  if (!snap) return null;
  return {
    id: snap.id || "",
    type: snap.type || "Clinic",
    name: snap.name || snap.contact_name || "",
    clinicHospitalName: snap.organisation_name || snap.clinicHospitalName || snap.clinic_name || null,
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

/**
 * Formatter for storefront Customer DTO.
 * Pass `ctx` (from loadReturnContext()) to include return eligibility; without it canReturn is false.
 */
export function toStorefrontOrderDto(order, shipment, extra = null, ctx = null) {
  const displayStatus = order.status === "returned" ? "Returned" : STATUS_MAP_CUSTOMER[order.status] || "Placed";

  const policy = ctx ? returnPolicy(order, ctx) : null;
  const itemPolicy = new Map((policy?.items || []).map((p) => [p.orderItemId, p]));

  const returns = [...(order.returns || [])]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((r) => toCustomerReturnDto(r, order));

  const items = (order.items || []).map((item) => {
    const p = itemPolicy.get(String(item.id));
    return {
      orderItemId: String(item.id),
      productId: String(item.product_id),
      productName: item.product_name,
      productSlug: item.product?.slug || undefined,
      brandName: item.product?.brand?.name || item.variant?.product?.brand?.name || "",
      image: getProductImage(item.product) || item.variant?.image_url || "",
      sku: item.sku,
      variantName: item.variant_name && item.variant_name !== "Default" ? item.variant_name : undefined,
      quantity: item.quantity,
      unitPrice: toRupees(item.unit_price_paise),
      totalPrice: toRupees(item.line_total_paise),
      returnableQty: p?.returnableQty ?? 0,
      returnedQty: p?.returnedQty ?? 0,
      nonReturnable: p?.nonReturnable ?? false,
    };
  });

  const timeline = buildCustomerTimeline(order.status_history || [], order.status);

  const pm = order.payment_method;
  const paymentMethod =
    pm === "cod" ? "Cash on Delivery" : "Online Razorpay (Cards/UPI/EMI)";
  const paymentStatus = PAYMENT_STATUS_CUSTOMER[order.payment_status] || "Pending";

  const invoice = (order.invoices || []).sort(
    (a, b) => new Date(b.issued_at) - new Date(a.issued_at)
  )[0];

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
    trackingNumber: shipment?.awb_code || undefined,
    courierPartner: shipment?.courier_name || undefined,
    trackingUrl: shipment?.tracking_url || undefined,
    estimatedDelivery: order.delivered_at
      ? order.delivered_at.toISOString().slice(0, 10)
      : "",
    deliveredAt: order.delivered_at ? order.delivered_at.toISOString() : undefined,
    timeline,
    invoiceNumber: invoice?.invoice_number || undefined,
    invoiceUrl: invoice?.pdf_url || undefined,
    couponCode: order.coupon_code || undefined,
    canCancel: CUSTOMER_CANCELLABLE.includes(order.status),
    canReturn: policy?.canReturn || false,
    returnPolicy: policy
      ? {
          windowDays: policy.windowDays,
          windowEndsAt: policy.windowEndsAt ? policy.windowEndsAt.toISOString() : null,
          windowOpen: policy.windowOpen,
          types: policy.types,
          blockReason: policy.blockReason,
        }
      : undefined,
    returns,
    refunds: (order.refunds || []).map((r) => toRefundDto(r)),
    cancelReason: order.cancel_reason || undefined,
    cancelledAt: order.cancelled_at ? order.cancelled_at.toISOString() : undefined,
    razorpay: extra?.razorpay || order.razorpay || undefined,
  };
}

/** Formatter for Admin Panel Order DTO */
export function toAdminOrderDto(order, sellerSettings = {}) {
  const shipment = order.shipments?.[0] || null;
  const invoice = (order.invoices || []).sort(
    (a, b) => new Date(b.issued_at) - new Date(a.issued_at)
  )[0];

  const store = sellerSettings.store || null;
  const tax = sellerSettings.tax || null;

  const seller = store
    ? {
        name: store.storeName || "Buy Denmed Healthcare Pvt Ltd",
        brandName: store.brandName || "Buy Denmed",
        address: store.address || "",
        gstin: store.gstin || "",
        supportPhone: store.supportPhone || "",
        supportEmail: store.supportEmail || "",
        logoUrl: publicUrl(store.logoPath) || null,
        invoicePrefix: tax?.invoicePrefix || "BDM/26-27/",
        invoiceNumberDigits: tax?.invoiceNumberDigits || 4,
        dispatchStateCode: tax?.dispatchStateCode || "07",
        dispatchStateName:
          STATE_OPTIONS.find((s) => s.code === tax?.dispatchStateCode)?.name ||
          tax?.dispatchStateCode ||
          "Delhi",
        signatoryName: tax?.signatoryName || "Authorised Signatory",
        signatoryUrl: publicUrl(tax?.signatoryPath) || null,
        footerTerms: tax?.footerTerms || "",
      }
    : undefined;

  const numPart = order.order_number ? String(order.order_number).replace(/^[^\d]*-?/, "") : "";
  const invoicePrefix = tax?.invoicePrefix || "BDM/26-27/";
  const digits = tax?.invoiceNumberDigits || 4;
  const derivedInvoiceNumber = invoice?.invoice_number || `${invoicePrefix}${numPart.padStart(digits, "0")}`;

  const paymentMethod =
    order.payment_method === "cod"
      ? "COD"
      : order.payment_method === "emi"
      ? "EMI"
      : "Razorpay";

  const paymentStatus = ["paid", "refunded", "partially_refunded", "failed"].includes(order.payment_status)
    ? order.payment_status
    : "pending";

  const rawStatus = order.status || "pending_payment";
  // Map internal status to admin enum: new | confirmed | packed | shipped | delivered | cancelled | returned
  let orderStatus = "new";
  if (rawStatus === "pending_payment") orderStatus = "new";
  else if (["confirmed", "processing"].includes(rawStatus)) orderStatus = "confirmed";
  else if (["packed", "ready_to_ship"].includes(rawStatus)) orderStatus = "packed";
  else if (["shipped", "out_for_delivery"].includes(rawStatus)) orderStatus = "shipped";
  else if (rawStatus === "delivered") orderStatus = "delivered";
  else if (rawStatus === "cancelled") orderStatus = "cancelled";
  else if (["returned", "return_requested", "return_approved", "return_picked_up"].includes(rawStatus)) orderStatus = "returned";
  else if (rawStatus === "new") orderStatus = "new";

  const sAddr = order.shipping_address || {};
  const bAddr = order.billing_address || order.shipping_address || {};

  const items = (order.items || []).map((it) => {
    const unitPrice = toRupees(it.unit_price_paise);
    const lineTotal = toRupees(it.line_total_paise);
    const gstRate = Number(it.gst_rate || 12);
    const totalGst = toRupees(BigInt(it.cgst_paise || 0n) + BigInt(it.sgst_paise || 0n) + BigInt(it.igst_paise || 0n));

    return {
      id: String(it.id),
      productId: String(it.product_id),
      productName: it.product_name,
      variantName: it.variant_name || "Default",
      sku: it.sku,
      imageUrl: getProductImage(it.product) || it.variant?.image_url || "",
      qty: it.quantity,
      unitPrice,
      gstPercent: gstRate,
      gstAmount: totalGst,
      lineTotal,
    };
  });

  const timeline = (order.status_history || []).map((h) => ({
    id: String(h.id),
    status: (h.to_status || "Updated").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    note: h.note || `Order marked as ${h.to_status}`,
    actor: h.actor_type === "admin" ? "Admin" : h.actor_type === "system" ? "System" : "Customer",
    timestamp: h.created_at.toISOString(),
  }));

  let internalNotes = [];
  if (order.notes_internal) {
    try {
      const parsed = JSON.parse(order.notes_internal);
      internalNotes = Array.isArray(parsed) ? parsed : [order.notes_internal];
    } catch {
      internalNotes = [order.notes_internal];
    }
  }

  return {
    id: String(order.id),
    orderNumber: order.order_number,
    customerId: String(order.customer_id),
    customerName: sAddr.name || order.customer?.name || "Customer",
    customerEmail: order.customer?.email || "",
    customerPhone: sAddr.phone || order.customer?.mobile || "",
    shippingAddress: {
      name: sAddr.name || order.customer?.name || "",
      phone: sAddr.phone || order.customer?.mobile || "",
      line1: sAddr.line1 || sAddr.addressLine1 || "",
      line2: sAddr.line2 || sAddr.addressLine2 || "",
      city: sAddr.city || "",
      state: sAddr.state || "",
      pincode: sAddr.pincode || "",
    },
    billingAddress: {
      name: bAddr.name || sAddr.name || order.customer?.name || "",
      phone: bAddr.phone || sAddr.phone || order.customer?.mobile || "",
      line1: bAddr.line1 || bAddr.addressLine1 || sAddr.line1 || sAddr.addressLine1 || "",
      line2: bAddr.line2 || bAddr.addressLine2 || sAddr.line2 || sAddr.addressLine2 || "",
      city: bAddr.city || sAddr.city || "",
      state: bAddr.state || sAddr.state || "",
      pincode: bAddr.pincode || sAddr.pincode || "",
    },
    gstDetails: order.gstin
      ? {
          companyName: order.company_name || "",
          gstin: order.gstin,
        }
      : undefined,
    items,
    subtotal: toRupees(order.subtotal_paise),
    discount: toRupees(BigInt(order.discount_paise || 0n) + BigInt(order.coupon_discount_paise || 0n)),
    couponCode: order.coupon_code || undefined,
    shippingCharge: toRupees(order.shipping_paise || 0n),
    codCharge: toRupees(order.cod_charge_paise || 0n),
    gstTotal: toRupees(order.tax_paise),
    total: toRupees(order.total_paise),
    paymentMethod,
    paymentStatus,
    orderStatus,
    invoiceNumber: derivedInvoiceNumber,
    invoiceUrl: invoice?.pdf_url || undefined,
    seller,
    shipment: shipment
      ? {
          courier: shipment.courier_name || "Courier",
          awb: shipment.awb_code || "",
          trackingUrl: shipment.tracking_url || "",
          weightKg: shipment.weight_grams ? shipment.weight_grams / 1000 : 1,
          lengthCm: shipment.dimensions?.lengthCm || 10,
          widthCm: shipment.dimensions?.widthCm || 10,
          heightCm: shipment.dimensions?.heightCm || 10,
          shippedAt: (shipment.created_at || new Date()).toISOString(),
        }
      : undefined,
    cancelReason: order.cancel_reason || undefined,
    refunds: (order.refunds || []).map((r) => toRefundDto(r, { admin: true })),
    refundSummary: refundSummary(order),
    returns: (order.returns || []).map((r) => ({
      id: String(r.id),
      returnNumber: r.return_number,
      type: r.type,
      status: r.status,
      statusLabel: RETURN_STATUS_LABEL[r.status] || r.status,
      itemCount: (r.items || []).reduce((sum, ri) => sum + ri.quantity, 0),
      requestedAmount: toRupees(r.requested_amount_paise),
      createdAt: r.created_at.toISOString(),
    })),
    timeline,
    internalNotes,
    createdAt: (order.placed_at || order.created_at).toISOString(),
    updatedAt: (order.updated_at || order.created_at).toISOString(),
  };
}

export const ORDER_INCLUDE = {
  customer: {
    select: { id: true, name: true, mobile: true, email: true },
  },
  items: {
    include: {
      product: {
        include: {
          brand: { select: { name: true } },
          images: { select: { url: true, sort_order: true }, orderBy: { sort_order: "asc" }, take: 1 },
        },
      },
      variant: { select: { id: true, name: true, sku: true, image_url: true } },
    },
  },
  status_history: {
    orderBy: { created_at: "asc" },
  },
  shipments: {
    where: { direction: "forward", return_id: null }, // replacement shipments belong to their return
    orderBy: { created_at: "desc" },
    take: 1,
  },
  invoices: {
    orderBy: { issued_at: "desc" },
    take: 1,
    select: { invoice_number: true, pdf_url: true, issued_at: true },
  },
  returns: {
    include: RETURN_DETAIL_INCLUDE,
    orderBy: { created_at: "desc" },
  },
  payments: true,
  refunds: {
    orderBy: { created_at: "asc" },
    include: { admin_user: { select: { name: true } } },
  },
};

/** Helper to resolve product and variant from cart item */
async function resolveProductAndVariant(item, tx = prisma) {
  let product = null;
  let variant = null;

  if (item.productId && /^\d+$/.test(String(item.productId))) {
    product = await tx.product.findUnique({
      where: { id: BigInt(item.productId) },
      include: { variants: true },
    });
  }

  if (!product && item.sku) {
    product = await tx.product.findFirst({
      where: { sku: item.sku },
      include: { variants: true },
    });
  }

  if (!product) {
    product = await tx.product.findFirst({
      where: { status: "active" },
      include: { variants: true },
    });
  }

  if (!product) {
    product = await tx.product.findFirst({
      include: { variants: true },
    });
  }

  if (!product) {
    throw ApiError.badRequest("No products configured in catalog");
  }

  if (item.variantId && /^\d+$/.test(String(item.variantId))) {
    variant = product.variants.find((v) => v.id === BigInt(item.variantId));
  }
  if (!variant) {
    variant = product.variants.find((v) => v.is_default) || product.variants[0];
  }

  return { product, variant };
}

/** Generate unique order number (e.g. ORD-2026-8842) */
async function generateOrderNumber(tx = prisma) {
  const year = new Date().getFullYear();
  const count = await tx.order.count();
  const baseNum = 8840 + count + 1;
  let candidate = `ORD-${year}-${baseNum}`;

  const exists = await tx.order.findUnique({ where: { order_number: candidate } });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `ORD-${year}-${randomSuffix}`;
  }
  return candidate;
}

// ---------------------------------------------------------------------------
// Storefront Customer Actions
// ---------------------------------------------------------------------------

export async function createCustomerOrder(customerId, data) {
  if (!data.items || !data.items.length) {
    throw ApiError.badRequest("Cart has no items");
  }
  if (!data.shippingAddress) {
    throw ApiError.badRequest("Delivery address is required");
  }

  const pin = await checkPincode(String(data.shippingAddress?.pincode || "").trim(), "ecommerce");
  if (!pin.serviceable) {
    throw ApiError.badRequest(`Delivery is not available to PIN ${data.shippingAddress?.pincode}`, "NOT_SERVICEABLE");
  }
  if (data.paymentMethod === "cod") {
    const shipping = await getGroup("shipping");
    if (!shipping.codEnabled) {
      throw ApiError.badRequest("Cash on Delivery is currently disabled", "COD_DISABLED");
    }
    if (!pin.codAvailable) {
      throw ApiError.badRequest(`Cash on Delivery is not available for PIN ${data.shippingAddress?.pincode}. Please choose online payment.`, "COD_NOT_AVAILABLE");
    }
    const totalRupees = Number(data.total) || 0;
    if (shipping.codMaxOrderValue > 0 && totalRupees > shipping.codMaxOrderValue) {
      throw ApiError.badRequest(`Cash on Delivery is only available for orders up to ₹${shipping.codMaxOrderValue.toLocaleString("en-IN")}. Please choose online payment.`, "COD_LIMIT_EXCEEDED");
    }
  }

  const customer = await prisma.customer.findUnique({ where: { id: BigInt(customerId) } });
  if (!customer) throw ApiError.unauthorized("Customer not found");

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);

    const isCod = data.paymentMethod === "cod";
    const isOnline = data.paymentMethod === "razorpay";
    const initialStatus = isOnline ? "pending_payment" : "confirmed";
    const paymentStatus = isOnline ? "pending" : (isCod ? "pending" : "paid");
    const paymentMethod = ["cod", "emi", "razorpay"].includes(String(data.paymentMethod).toLowerCase())
      ? String(data.paymentMethod).toLowerCase()
      : "cod";

    const subtotalPaise = BigInt(Math.round((Number(data.subtotal) || 0) * 100));
    const discountPaise = BigInt(Math.round((Number(data.discount) || 0) * 100));
    const shippingPaise = BigInt(Math.round((Number(data.shipping) || 0) * 100));
    const codChargePaise = BigInt(Math.round((Number(data.codCharge) || 0) * 100));
    const taxPaise = BigInt(Math.round((Number(data.tax) || 0) * 100));
    const totalPaise = BigInt(Math.round((Number(data.total) || 0) * 100));

    const isIntraState = (data.shippingAddress?.state || "").toLowerCase().includes("delhi");

    const orderItemsData = [];
    for (const it of data.items) {
      const { product, variant } = await resolveProductAndVariant(it, tx);
      const unitPricePaise = BigInt(Math.round((Number(it.unitPrice) || 0) * 100));
      const mrpPaise = BigInt(Math.round((Number(it.mrp || it.unitPrice) || 0) * 100));
      const lineTotalPaise = unitPricePaise * BigInt(it.quantity || 1);
      const gstRate = Number(product.gst_rate || 12);

      const taxAmountPaise = (lineTotalPaise * BigInt(gstRate)) / BigInt(100 + gstRate);
      const halfTax = taxAmountPaise / 2n;

      orderItemsData.push({
        product_id: product.id,
        variant_id: variant.id,
        product_name: it.productName || product.name,
        variant_name: it.variantName || variant.name || "Default",
        sku: it.sku || variant.sku || product.sku,
        hsn_code: product.hsn_code || null,
        quantity: it.quantity || 1,
        unit_price_paise: unitPricePaise,
        mrp_paise: mrpPaise,
        gst_rate: gstRate,
        cgst_paise: isIntraState ? halfTax : 0n,
        sgst_paise: isIntraState ? halfTax : 0n,
        igst_paise: isIntraState ? 0n : taxAmountPaise,
        line_total_paise: lineTotalPaise,
      });
    }

    // Never sell more than is available (lines of the same variant are added up)
    await assertInStock(
      tx,
      orderItemsData.map((it) => ({ variantId: it.variant_id, quantity: it.quantity, name: it.product_name }))
    );

    const created = await tx.order.create({
      data: {
        order_number: orderNumber,
        customer_id: BigInt(customerId),
        status: initialStatus,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        shipping_address: data.shippingAddress,
        billing_address: data.billingAddress || data.shippingAddress,
        gstin: data.gstDetails?.gstin || null,
        company_name: data.gstDetails?.legalBusinessName || null,
        subtotal_paise: subtotalPaise,
        discount_paise: discountPaise,
        coupon_code: data.couponCode || null,
        shipping_paise: shippingPaise,
        cod_charge_paise: codChargePaise,
        tax_paise: taxPaise,
        total_paise: totalPaise,
        placed_at: new Date(),
        items: {
          create: orderItemsData,
        },
        status_history: {
          create: {
            from_status: null,
            to_status: initialStatus,
            actor_type: "customer",
            actor_id: BigInt(customerId),
            note: isCod
              ? "Cash on Delivery requested — Verification pending"
              : "Prepaid online order placed",
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    if (data.shippingAddress) {
      const s = data.shippingAddress;
      const count = await tx.address.count({ where: { customer_id: BigInt(customerId) } });
      if (count === 0 && (s.addressLine1 || s.line1) && s.pincode) {
        await tx.address.create({
          data: {
            customer_id: BigInt(customerId),
            name: s.name || customer.name || "Customer",
            phone: s.phone || customer.mobile || "",
            organisation_name: s.clinicHospitalName || null,
            line1: s.addressLine1 || s.line1 || "",
            line2: s.addressLine2 || s.line2 || null,
            city: s.city || "",
            state: s.state || "",
            pincode: s.pincode || "",
            is_default: true,
            type: "clinic",
          },
        });
      }
      if ((!customer.name && s.name) || (!customer.mobile && s.phone)) {
        await tx.customer.update({
          where: { id: BigInt(customerId) },
          data: {
            name: customer.name || s.name || undefined,
            mobile: customer.mobile || s.phone || undefined,
          },
        });
      }
    }

    // COD orders are confirmed at once → hold the stock now (online orders: when payment is verified)
    if (initialStatus === "confirmed") await reserveOrder(tx, created);

    return created;
  });

  let razorpayInfo = null;
  if (data.paymentMethod === "razorpay") {
    const keyId = env.razorpay?.keyId || process.env.RAZORPAY_KEY_ID || "rzp_test_TmsfO3hloFEA31";
    const keySecret = env.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET || "1xt3UXSTLfyVhQa3G9SSVIKY";

    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(order.total_paise),
          currency: "INR",
          receipt: order.order_number,
          notes: {
            orderId: String(order.id),
            orderNumber: order.order_number,
            customerId: String(customerId),
          },
        }),
      });

      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        razorpayInfo = {
          keyId,
          orderId: rzpData.id,
          amount: rzpData.amount,
          currency: rzpData.currency,
        };

        await prisma.payment.create({
          data: {
            order_id: order.id,
            purpose: "order",
            gateway: "razorpay",
            gateway_order_id: rzpData.id,
            amount_paise: order.total_paise,
            status: "created",
            raw_response: rzpData,
          },
        });
      } else {
        const errText = await rzpRes.text();
        console.error("Razorpay order creation failed:", errText);
      }
    } catch (err) {
      console.error("Razorpay network error:", err);
    }
  }

  // Asynchronous notification for COD (online orders notify upon successful payment verification)
  if (data.paymentMethod === "cod") {
    alertStaff({
      type: "order_new",
      title: `New COD order ${order.order_number} · ${formatINR(order.total_paise)}`,
      message: `${customer.name || data.shippingAddress?.name || "Customer"} · ${order.items.length} item${order.items.length === 1 ? "" : "s"} · ${data.shippingAddress?.city || ""}`,
      link: `/admin/orders/${order.id}`,
      entityType: "order",
      entityId: order.id,
      permission: "orders.view",
    });
    try {
      notify("order_placed", {
        email: customer.email,
        mobile: customer.mobile,
        vars: {
          customer_name: customer.name || data.shippingAddress.name,
          order_number: order.order_number,
          total: (Number(order.total_paise) / 100).toLocaleString("en-IN"),
        },
        entityType: "order",
        entityId: order.id,
      });
    } catch (err) {
      // Non-blocking
    }
  }

  return toStorefrontOrderDto(order, null, { razorpay: razorpayInfo });
}

export async function verifyCustomerOrderPayment(
  customerId,
  orderId,
  { razorpayPaymentId, razorpayOrderId, razorpaySignature }
) {
  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    throw ApiError.badRequest("Missing payment verification parameters");
  }

  const keySecret = env.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET || "1xt3UXSTLfyVhQa3G9SSVIKY";
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw ApiError.badRequest("Invalid payment signature");
  }

  let oId;
  try {
    oId = BigInt(orderId);
  } catch {
    const found = await prisma.order.findUnique({ where: { order_number: orderId } });
    if (!found) throw ApiError.notFound("Order not found");
    oId = found.id;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: oId,
      customer_id: BigInt(customerId),
    },
    include: ORDER_INCLUDE,
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "confirmed",
        payment_status: "paid",
        confirmed_at: new Date(),
      },
      include: ORDER_INCLUDE,
    });

    const existingPayment = await tx.payment.findFirst({
      where: { gateway_order_id: razorpayOrderId },
    });

    if (existingPayment) {
      await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          gateway_payment_id: razorpayPaymentId,
          status: "captured",
          captured_at: new Date(),
        },
      });
    } else {
      await tx.payment.create({
        data: {
          order_id: order.id,
          purpose: "order",
          gateway: "razorpay",
          gateway_order_id: razorpayOrderId,
          gateway_payment_id: razorpayPaymentId,
          amount_paise: order.total_paise,
          status: "captured",
          captured_at: new Date(),
        },
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        order_id: order.id,
        from_status: order.status,
        to_status: "confirmed",
        actor_type: "customer",
        actor_id: BigInt(customerId),
        note: `Online Razorpay payment verified (ID: ${razorpayPaymentId})`,
      },
    });

    await reserveOrder(tx, o);
    return o;
  });

  alertStaff({
    type: "order_new",
    title: `New paid order ${updated.order_number} · ${formatINR(updated.total_paise)}`,
    message: `Paid online (Razorpay ${razorpayPaymentId})`,
    link: `/admin/orders/${updated.id}`,
    entityType: "order",
    entityId: updated.id,
    permission: "orders.view",
  });

  try {
    const customer = await prisma.customer.findUnique({ where: { id: BigInt(customerId) } });
    notify("order_placed", {
      email: customer?.email,
      mobile: customer?.mobile,
      vars: {
        customer_name: customer?.name || updated.shipping_address?.name || "Customer",
        order_number: updated.order_number,
        total: (Number(updated.total_paise) / 100).toLocaleString("en-IN"),
      },
      entityType: "order",
      entityId: updated.id,
    });
  } catch (err) {
    // Non-blocking
  }

  return toStorefrontOrderDto(updated, null);
}

export async function listCustomerOrders(customerId) {
  const [orders, ctx] = await Promise.all([
    prisma.order.findMany({
      where: { customer_id: BigInt(customerId) },
      include: ORDER_INCLUDE,
      orderBy: { placed_at: "desc" },
    }),
    loadReturnContext(),
  ]);

  return orders.map((o) => toStorefrontOrderDto(o, o.shipments?.[0] || null, null, ctx));
}

export async function getCustomerOrder(customerId, orderId) {
  const isNumeric = /^\d+$/.test(String(orderId));
  const where = isNumeric
    ? { id: BigInt(orderId), customer_id: BigInt(customerId) }
    : { order_number: orderId, customer_id: BigInt(customerId) };

  const [order, ctx] = await Promise.all([prisma.order.findFirst({ where, include: ORDER_INCLUDE }), loadReturnContext()]);
  if (!order) throw ApiError.notFound("Order not found");

  return toStorefrontOrderDto(order, order.shipments?.[0] || null, null, ctx);
}

/**
 * Customer cancels before dispatch. Prepaid orders are refunded to the original payment
 * method straight away (Razorpay); if that is not possible the refund shows as pending
 * for staff on the admin order page.
 */
export async function cancelCustomerOrder(customerId, orderId, { reason, note }) {
  const isNumeric = /^\d+$/.test(String(orderId));
  const where = isNumeric
    ? { id: BigInt(orderId), customer_id: BigInt(customerId) }
    : { order_number: orderId, customer_id: BigInt(customerId) };

  const existing = await prisma.order.findFirst({ where, include: { customer: true, payments: true, refunds: true } });
  if (!existing) throw ApiError.notFound("Order not found");
  if (existing.status === "cancelled") throw ApiError.badRequest("This order is already cancelled");
  if (!CUSTOMER_CANCELLABLE.includes(existing.status)) {
    throw ApiError.badRequest(
      `This order has already been ${existing.status.replace(/_/g, " ")} and can no longer be cancelled. You can request a return after delivery.`
    );
  }

  const cancelReason = `${reason}${note ? ` — ${note}` : ""}`.slice(0, 500);
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: existing.id },
      data: {
        status: "cancelled",
        cancel_reason: cancelReason,
        cancelled_at: new Date(),
        status_history: {
          create: {
            from_status: existing.status,
            to_status: "cancelled",
            actor_type: "customer",
            actor_id: BigInt(customerId),
            note: `Cancelled by customer: ${cancelReason}`,
          },
        },
      },
      include: { items: true },
    });
    await cancelOrderStock(tx, o);
  });

  const refundNote = await refundCancelledOrder(existing, { actorType: "customer", actorId: BigInt(customerId) });
  alertStaff({
    type: "order_cancelled",
    title: `Order ${existing.order_number} cancelled by the customer`,
    message: `${cancelReason}. ${refundNote}`,
    severity: "warning",
    link: `/admin/orders/${existing.id}`,
    entityType: "order",
    entityId: existing.id,
    permission: "orders.view",
  });
  notify("order_cancelled", {
    email: existing.customer?.email,
    mobile: existing.customer?.mobile,
    vars: {
      customer_name: existing.customer?.name || existing.shipping_address?.name || "Customer",
      order_number: existing.order_number,
      refund_note: refundNote,
    },
    entityType: "order",
    entityId: existing.id,
  }).catch(() => undefined);

  return getCustomerOrder(customerId, String(existing.id));
}

/**
 * After a cancellation: refund whatever was paid. Returns a sentence for the customer.
 * Never throws — the cancellation itself has already happened.
 */
async function refundCancelledOrder(order, { actorType, actorId = null, adminUserId = null }) {
  const summary = refundSummary(order);
  if (summary.balance <= 0) return "No payment was collected, so nothing is due.";

  const { refundProcessingDays } = await getGroup("returns").catch(() => ({ refundProcessingDays: "5-7" }));
  const amount = BigInt(Math.round(summary.balance * 100));
  let historyNote;
  let customerNote;

  if (summary.gatewayAvailable) {
    const { refund, error } = await issueRefund({
      orderId: order.id,
      amountPaise: amount,
      reason: "cancel",
      mode: "gateway",
      note: "Order cancelled",
      adminUserId,
    }).catch((err) => ({ refund: null, error: err }));
    if (refund && !error) {
      historyNote = `Refund of ${formatINR(amount)} initiated to the original payment method (${refund.gateway_refund_id || `refund #${refund.id}`})`;
      customerNote = `${formatINR(amount)} will be refunded to your original payment method within ${refundProcessingDays} business days.`;
    } else {
      historyNote = `Automatic refund of ${formatINR(amount)} failed: ${error?.message || "unknown error"} — issue it from the order's Refunds panel`;
      customerNote = `Your refund of ${formatINR(amount)} is being processed by our team.`;
    }
  } else {
    historyNote = `Refund of ${formatINR(amount)} pending — no Razorpay payment to refund automatically; pay it by bank transfer / UPI from the Refunds panel`;
    customerNote = `Your refund of ${formatINR(amount)} will be processed by our team within ${refundProcessingDays} business days.`;
  }

  await prisma.orderStatusHistory.create({
    data: { order_id: order.id, from_status: "cancelled", to_status: "cancelled", actor_type: actorType, actor_id: actorId, note: historyNote },
  });
  return customerNote;
}

// ---------------------------------------------------------------------------
// Admin Actions
// ---------------------------------------------------------------------------

async function getSellerSettings() {
  const [store, tax] = await Promise.all([
    getGroup("store").catch(() => null),
    getGroup("tax").catch(() => null),
  ]);
  return { store, tax };
}

export async function listAdminOrders(filters = {}) {
  const where = {};

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { order_number: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { mobile: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { items: { some: { sku: { contains: q, mode: "insensitive" } } } },
    ];
  }

  if (filters.status && filters.status !== "all") {
    // Map admin status tab to DB statuses
    if (filters.status === "new") where.status = { in: ["new", "pending_payment"] };
    else if (filters.status === "confirmed") where.status = { in: ["confirmed", "processing"] };
    else if (filters.status === "packed") where.status = { in: ["packed", "ready_to_ship"] };
    else if (filters.status === "shipped") where.status = { in: ["shipped", "out_for_delivery"] };
    else if (filters.status === "delivered") where.status = "delivered";
    else if (filters.status === "cancelled") where.status = "cancelled";
    else if (filters.status === "returned") where.status = { in: ["returned", "return_requested", "return_approved", "return_picked_up"] };
    else where.status = filters.status;
  }

  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    where.payment_method = filters.paymentMethod.toLowerCase();
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    where.payment_status = filters.paymentStatus.toLowerCase();
  }

  if (filters.dateFrom) {
    where.placed_at = { ...(where.placed_at || {}), gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    const end = new Date(filters.dateTo);
    end.setHours(23, 59, 59, 999);
    where.placed_at = { ...(where.placed_at || {}), lte: end };
  }

  const [orders, sellerSettings] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { placed_at: "desc" },
    }),
    getSellerSettings(),
  ]);

  return orders.map((o) => toAdminOrderDto(o, sellerSettings));
}

export async function getAdminOrder(id) {
  const isNumeric = /^\d+$/.test(String(id));
  const where = isNumeric ? { id: BigInt(id) } : { order_number: id };

  const [order, sellerSettings] = await Promise.all([
    prisma.order.findFirst({ where, include: ORDER_INCLUDE }),
    getSellerSettings(),
  ]);
  if (!order) throw ApiError.notFound("Order not found");

  return toAdminOrderDto(order, sellerSettings);
}

export async function updateAdminOrderStatus(id, { status, actor, note, adminId = null }) {
  const isNumeric = /^\d+$/.test(String(id));
  const where = isNumeric ? { id: BigInt(id) } : { order_number: id };

  const existing = await prisma.order.findFirst({ where, include: { customer: true, payments: true, refunds: true } });
  if (!existing) throw ApiError.notFound("Order not found");

  const DB_STATUS_MAP = {
    new: "pending_payment",
    confirmed: "confirmed",
    packed: "packed",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    returned: "returned",
  };
  const dbStatus = DB_STATUS_MAP[status];
  if (!dbStatus) throw ApiError.badRequest(`Unknown order status "${status}"`);
  if (existing.status === "cancelled" && dbStatus !== "cancelled") {
    throw ApiError.badRequest("Cancelled orders cannot be reopened. Ask the customer to place a new order.");
  }
  if (dbStatus === existing.status) throw ApiError.badRequest(`The order is already ${status}`);

  // Cash on delivery: the courier collected the money on delivery
  const codCollected = dbStatus === "delivered" && existing.payment_method === "cod" && existing.payment_status === "pending";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: existing.id },
      data: {
        status: dbStatus,
        payment_status: codCollected ? "paid" : existing.payment_status,
        cancel_reason: dbStatus === "cancelled" ? (note || "Cancelled by admin") : existing.cancel_reason,
        confirmed_at: dbStatus === "confirmed" && !existing.confirmed_at ? new Date() : existing.confirmed_at,
        delivered_at: dbStatus === "delivered" && !existing.delivered_at ? new Date() : existing.delivered_at,
        cancelled_at: dbStatus === "cancelled" && !existing.cancelled_at ? new Date() : existing.cancelled_at,
        status_history: {
          create: {
            from_status: existing.status,
            to_status: dbStatus,
            actor_type: "admin",
            actor_id: adminId,
            note: note || `Marked as ${status} by ${actor || "Admin"}`,
          },
        },
      },
    });
    // Stock follows the status
    const withItems = await tx.order.findUnique({ where: { id: existing.id }, include: { items: true } });
    if (["confirmed", "packed"].includes(dbStatus)) await reserveOrder(tx, withItems, { adminId });
    else if (["shipped", "delivered"].includes(dbStatus)) {
      await reserveOrder(tx, withItems, { adminId }); // orders confirmed before stock tracking
      await shipOrder(tx, withItems, { adminId });
    } else if (dbStatus === "cancelled") await cancelOrderStock(tx, withItems, { adminId });
    if (codCollected) {
      await tx.payment.create({
        data: {
          order_id: existing.id,
          purpose: "order",
          gateway: "cod",
          amount_paise: existing.total_paise,
          status: "captured",
          captured_at: new Date(),
        },
      });
    }
  });

  if (dbStatus === "cancelled") {
    const refundNote = await refundCancelledOrder(existing, { actorType: "admin", actorId: adminId, adminUserId: adminId });
    notify("order_cancelled", {
      email: existing.customer?.email,
      mobile: existing.customer?.mobile,
      vars: {
        customer_name: existing.customer?.name || existing.shipping_address?.name || "Customer",
        order_number: existing.order_number,
        refund_note: refundNote,
      },
      entityType: "order",
      entityId: existing.id,
    }).catch(() => undefined);
  }

  return getAdminOrder(String(existing.id));
}

/** Admin → order page → Refunds: refund part or all of an order (goodwill, cancellation, return without RMA). */
export async function issueAdminOrderRefund(id, { amount, mode, reference, note, reason }, admin) {
  const isNumeric = /^\d+$/.test(String(id));
  const order = await prisma.order.findFirst({
    where: isNumeric ? { id: BigInt(id) } : { order_number: id },
    include: { customer: true },
  });
  if (!order) throw ApiError.notFound("Order not found");

  const { refund } = await issueRefund({
    orderId: order.id,
    amountPaise: amount,
    reason,
    mode,
    reference,
    note,
    adminUserId: admin.id,
    throwOnFailure: true,
  });

  await prisma.orderStatusHistory.create({
    data: {
      order_id: order.id,
      from_status: order.status,
      to_status: order.status,
      actor_type: "admin",
      actor_id: admin.id,
      note: `Refund of ${formatINR(amount)} via ${REFUND_METHOD_LABEL[mode].toLowerCase()}${
        refund.reference ? ` (Ref ${refund.reference})` : refund.gateway_refund_id ? ` (${refund.gateway_refund_id})` : ""
      }${note ? ` — ${note}` : ""}`,
    },
  });

  const { refundProcessingDays } = await getGroup("returns");
  notify("refund_processed", {
    email: order.customer?.email,
    mobile: order.customer?.mobile,
    vars: {
      customer_name: order.customer?.name || order.shipping_address?.name || "Customer",
      order_number: order.order_number,
      refund_amount: formatINR(amount, { symbol: false }),
      refund_method: mode === "gateway" ? "original payment method" : REFUND_METHOD_LABEL[mode].toLowerCase(),
      reference: refund.reference || refund.gateway_refund_id || String(refund.id),
      refund_days: refundProcessingDays,
    },
    entityType: "order",
    entityId: order.id,
  }).catch(() => undefined);

  return getAdminOrder(String(order.id));
}

/** Re-reads a "processing" Razorpay refund. */
export async function syncAdminOrderRefund(id, refundId) {
  const order = await getAdminOrder(id);
  const belongs = order.refunds.some((r) => r.id === String(refundId));
  if (!belongs) throw ApiError.notFound("Refund not found on this order");
  await syncGatewayRefund(BigInt(refundId));
  return getAdminOrder(id);
}

export async function createAdminOrderShipment(id, { courier, weightKg, lengthCm, widthCm, heightCm, actor }) {
  const isNumeric = /^\d+$/.test(String(id));
  const where = isNumeric ? { id: BigInt(id) } : { order_number: id };

  const existing = await prisma.order.findFirst({ where });
  if (!existing) throw ApiError.notFound("Order not found");

  const awb = `SR${Math.floor(100000000 + Math.random() * 900000000)}`;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.shipment.create({
      data: {
        order_id: existing.id,
        direction: "forward",
        courier_name: courier,
        awb_code: awb,
        tracking_url: `https://shiprocket.co/tracking/${awb}`,
        weight_grams: Math.round((weightKg || 1) * 1000),
        dimensions: { lengthCm, widthCm, heightCm },
        status: "created",
      },
    });

    const order = await tx.order.update({
      where: { id: existing.id },
      data: {
        status: "shipped",
        status_history: {
          create: {
            from_status: existing.status,
            to_status: "shipped",
            actor_type: "admin",
            note: `Shiprocket AWB ${awb} via ${courier}`,
          },
        },
      },
      include: ORDER_INCLUDE,
    });
    await reserveOrder(tx, order);
    await shipOrder(tx, order);

    return order;
  });

  const sellerSettings = await getSellerSettings();
  return toAdminOrderDto(updated, sellerSettings);
}

export async function addAdminOrderNote(id, note) {
  const isNumeric = /^\d+$/.test(String(id));
  const where = isNumeric ? { id: BigInt(id) } : { order_number: id };

  const existing = await prisma.order.findFirst({ where });
  if (!existing) throw ApiError.notFound("Order not found");

  let notes = [];
  if (existing.notes_internal) {
    try {
      const parsed = JSON.parse(existing.notes_internal);
      notes = Array.isArray(parsed) ? parsed : [existing.notes_internal];
    } catch {
      notes = [existing.notes_internal];
    }
  }
  notes.unshift(note);

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: { notes_internal: JSON.stringify(notes) },
    include: ORDER_INCLUDE,
  });

  const sellerSettings = await getSellerSettings();
  return toAdminOrderDto(updated, sellerSettings);
}

export async function bulkMarkAdminOrdersPacked(ids, actor) {
  for (const rawId of ids) {
    try {
      await updateAdminOrderStatus(rawId, {
        status: "packed",
        actor,
        note: "Bulk marked packed",
      });
    } catch {
      // Continue next
    }
  }
}
