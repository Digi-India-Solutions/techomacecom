import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { toStorefrontOrderDto, ORDER_INCLUDE } from "./service.js";

const toRupees = (paise) => Number(paise || 0n) / 100;
const toPaise = (rupees) => BigInt(Math.round(Number(rupees || 0) * 100));

export function formatAdminReturn(r) {
  let parsed = {};
  if (r.admin_note) {
    try {
      parsed = JSON.parse(r.admin_note);
    } catch {
      parsed = { adminNote: r.admin_note };
    }
  }

  const order = r.order || {};
  const sAddr = order.shipping_address || {};

  const items = (r.items || []).map((ri) => {
    const oi = ri.order_item || {};
    const unitPrice = toRupees(oi.unit_price_paise);
    const lineTotal = toRupees(oi.line_total_paise);
    return {
      productName: oi.product_name || "Product",
      sku: oi.sku || "",
      qty: ri.quantity || 1,
      refundEligibleAmount: lineTotal > 0 ? lineTotal : unitPrice * (ri.quantity || 1),
    };
  });

  const refundHistory = (r.refunds || []).map((ref) => ({
    id: String(ref.id),
    amount: toRupees(ref.amount_paise),
    method: ref.method === "bank_transfer" ? "Bank Transfer (NEFT/IMPS)" : "Razorpay",
    reference: ref.gateway_refund_id || `REF-${ref.id}`,
    processedBy: "Admin",
    processedAt: (ref.processed_at || ref.created_at).toISOString(),
  }));

  return {
    id: String(r.id),
    returnNumber: r.return_number,
    orderId: String(order.id || r.order_id),
    orderNumber: order.order_number || "",
    customerName: sAddr.name || order.customer?.name || "Customer",
    customerPhone: sAddr.phone || order.customer?.mobile || "",
    paymentMethod:
      order.payment_method === "cod"
        ? "COD"
        : order.payment_method === "emi"
        ? "EMI"
        : "Razorpay",
    items:
      items.length > 0
        ? items
        : (order.items || []).map((oi) => ({
            productName: oi.product_name || "Product",
            sku: oi.sku || "",
            qty: oi.quantity || 1,
            refundEligibleAmount: toRupees(oi.line_total_paise),
          })),
    reason: r.reason || "Return Requested",
    customerNote: parsed.customerNote || "",
    photos: r.photos || [],
    status: r.status,
    adminNote: parsed.adminNote || (typeof r.admin_note === "string" && !r.admin_note.startsWith("{") ? r.admin_note : ""),
    pickupDate: parsed.pickupDate || "",
    pickupCourier: parsed.pickupCourier || "BlueDart Reverse",
    bankDetails: parsed.bankDetails || undefined,
    refundHistory,
    createdAt: r.created_at.toISOString(),
  };
}

/** Customer cancels order before shipment */
export async function cancelCustomerOrder(customerId, orderId, { reason, note }) {
  const isNumeric = /^\d+$/.test(String(orderId));
  const where = isNumeric
    ? { id: BigInt(orderId), customer_id: BigInt(customerId) }
    : { order_number: orderId, customer_id: BigInt(customerId) };

  const existing = await prisma.order.findFirst({
    where,
    include: ORDER_INCLUDE,
  });

  if (!existing) throw ApiError.notFound("Order not found");

  const nonCancelable = ["shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
  if (nonCancelable.includes(existing.status)) {
    throw ApiError.badRequest(
      existing.status === "cancelled"
        ? "Order is already cancelled"
        : `Order cannot be cancelled as it is already ${existing.status.replace(/_/g, " ")}`
    );
  }

  const cancelReason = reason ? `${reason}${note ? ` (${note})` : ""}` : (note || "Cancelled by customer");
  const isPrepaid = existing.payment_status === "paid";
  const nextPaymentStatus = isPrepaid ? "refunded" : existing.payment_status;

  const updated = await prisma.$transaction(async (tx) => {
    if (isPrepaid) {
      await tx.refund.create({
        data: {
          order_id: existing.id,
          amount_paise: existing.total_paise,
          reason: "cancel",
          method: existing.payment_method === "cod" ? "bank_transfer" : "gateway",
          gateway_refund_id: `RFND-CANCEL-${Date.now().toString().slice(-6)}`,
          status: "processed",
          processed_at: new Date(),
        },
      });
    }

    const order = await tx.order.update({
      where: { id: existing.id },
      data: {
        status: "cancelled",
        payment_status: nextPaymentStatus,
        cancel_reason: cancelReason,
        cancelled_at: new Date(),
        status_history: {
          create: {
            from_status: existing.status,
            to_status: "cancelled",
            actor_type: "customer",
            note: `Order cancelled by customer: ${cancelReason}${isPrepaid ? " · Auto-refund initiated" : ""}`,
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    return order;
  });

  return toStorefrontOrderDto(updated);
}

/** Customer submits a return request for a delivered order */
export async function createCustomerReturn(customerId, orderId, { reason, customerNote, photos, itemIds, bankDetails }) {
  const isNumeric = /^\d+$/.test(String(orderId));
  const where = isNumeric
    ? { id: BigInt(orderId), customer_id: BigInt(customerId) }
    : { order_number: orderId, customer_id: BigInt(customerId) };

  const existing = await prisma.order.findFirst({
    where,
    include: ORDER_INCLUDE,
  });

  if (!existing) throw ApiError.notFound("Order not found");

  if (!["delivered", "shipped"].includes(existing.status)) {
    throw ApiError.badRequest("Returns can only be requested once the order has been delivered");
  }

  // Check if active return already exists
  const activeReturn = (existing.returns || []).find((r) =>
    ["requested", "approved", "pickup_scheduled", "received"].includes(r.status)
  );
  if (activeReturn) {
    throw ApiError.badRequest(`A return request (${activeReturn.return_number}) is already in progress for this order`);
  }

  // Check 7-day policy window
  const deliveredAt = existing.delivered_at || existing.placed_at || existing.created_at;
  const daysDiff = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 7.5) {
    throw ApiError.badRequest("Return window has expired. Under company policy, returns must be requested within 7 days of delivery.");
  }

  const numPart = existing.order_number ? String(existing.order_number).replace(/^[^\d]*-?/, "") : Date.now().toString().slice(-4);
  const returnNumber = `RET-${new Date().getFullYear()}-${numPart}`;

  const metadata = {
    customerNote: customerNote || "",
    bankDetails: bankDetails || null,
    requestedAt: new Date().toISOString(),
  };

  const createdReturn = await prisma.$transaction(async (tx) => {
    const ret = await tx.return.create({
      data: {
        order_id: existing.id,
        return_number: returnNumber,
        reason: reason || "Customer Return",
        photos: Array.isArray(photos) ? photos : [],
        status: "requested",
        admin_note: JSON.stringify(metadata),
      },
    });

    // Create return items for selected items (or all items)
    const targetItems = Array.isArray(itemIds) && itemIds.length > 0
      ? existing.items.filter((it) => itemIds.includes(String(it.id)) || itemIds.includes(String(it.product_id)))
      : existing.items;

    for (const it of targetItems) {
      await tx.returnItem.create({
        data: {
          return_id: ret.id,
          order_item_id: it.id,
          quantity: it.quantity || 1,
        },
      });
    }

    await tx.order.update({
      where: { id: existing.id },
      data: {
        status: "return_requested",
        status_history: {
          create: {
            from_status: existing.status,
            to_status: "return_requested",
            actor_type: "customer",
            note: `Return requested (${returnNumber}): ${reason}${customerNote ? ` - ${customerNote}` : ""}`,
          },
        },
      },
    });

    return ret;
  });

  const refreshedOrder = await prisma.order.findUnique({
    where: { id: existing.id },
    include: ORDER_INCLUDE,
  });

  return {
    returnRequest: {
      id: String(createdReturn.id),
      returnNumber: createdReturn.return_number,
      status: createdReturn.status,
      reason: createdReturn.reason,
      createdAt: createdReturn.created_at.toISOString(),
    },
    order: toStorefrontOrderDto(refreshedOrder),
  };
}

/** Admin: List all return requests */
export async function listAdminReturns() {
  const returns = await prisma.return.findMany({
    include: {
      order: {
        include: {
          customer: true,
          items: true,
        },
      },
      items: {
        include: {
          order_item: true,
        },
      },
      refunds: {
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return returns.map(formatAdminReturn);
}

/** Admin: Update return request status (approve, schedule pickup, receive, reject) */
export async function updateAdminReturnStatus(id, { status, adminNote, pickupDate, pickupCourier }) {
  const isNumeric = /^\d+$/.test(String(id));
  const where = isNumeric ? { id: BigInt(id) } : { return_number: id };

  const existing = await prisma.return.findFirst({
    where,
    include: {
      order: { include: { customer: true, items: true } },
      items: { include: { order_item: true } },
      refunds: true,
    },
  });

  if (!existing) throw ApiError.notFound("Return request not found");

  let parsed = {};
  if (existing.admin_note) {
    try {
      parsed = JSON.parse(existing.admin_note);
    } catch {
      parsed = { adminNote: existing.admin_note };
    }
  }

  if (adminNote !== undefined) parsed.adminNote = adminNote;
  if (pickupDate !== undefined) parsed.pickupDate = pickupDate;
  if (pickupCourier !== undefined) parsed.pickupCourier = pickupCourier;

  const updated = await prisma.$transaction(async (tx) => {
    const ret = await tx.return.update({
      where: { id: existing.id },
      data: {
        status,
        admin_note: JSON.stringify(parsed),
      },
      include: {
        order: { include: { customer: true, items: true } },
        items: { include: { order_item: true } },
        refunds: true,
      },
    });

    // If reverse pickup scheduled, record a reverse shipment
    if (status === "pickup_scheduled" && pickupCourier) {
      await tx.shipment.create({
        data: {
          order_id: existing.order_id,
          return_id: existing.id,
          direction: "reverse",
          courier_name: pickupCourier,
          awb_code: `REV${Math.floor(100000000 + Math.random() * 900000000)}`,
          status: "pickup_scheduled",
        },
      });
    }

    // If marked received, update order status to returned
    if (status === "received") {
      await tx.order.update({
        where: { id: existing.order_id },
        data: { status: "returned" },
      });
    }

    // Add status history to order
    await tx.orderStatusHistory.create({
      data: {
        order_id: existing.order_id,
        from_status: existing.order?.status || "return_requested",
        to_status: status === "received" ? "returned" : existing.order?.status || "return_requested",
        actor_type: "admin",
        note: `Return ${existing.return_number} marked ${status.replace(/_/g, " ")}${adminNote ? `: ${adminNote}` : ""}`,
      },
    });

    return ret;
  });

  return formatAdminReturn(updated);
}

/** Admin: Process refund for a return */
export async function processAdminReturnRefund(id, { amount, method, reference, processedBy }) {
  const isNumeric = /^\d+$/.test(String(id));
  const where = isNumeric ? { id: BigInt(id) } : { return_number: id };

  const existing = await prisma.return.findFirst({
    where,
    include: {
      order: { include: { customer: true, items: true } },
      items: { include: { order_item: true } },
      refunds: true,
    },
  });

  if (!existing) throw ApiError.notFound("Return request not found");

  const amountPaise = toPaise(amount);
  const refundMethod = method === "Razorpay" ? "gateway" : "bank_transfer";
  const refCode = reference || `RFND-${Date.now().toString().slice(-6)}`;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        order_id: existing.order_id,
        return_id: existing.id,
        amount_paise: amountPaise,
        reason: "return",
        method: refundMethod,
        gateway_refund_id: refCode,
        status: "processed",
        processed_at: new Date(),
      },
    });

    const ret = await tx.return.update({
      where: { id: existing.id },
      data: { status: "refunded" },
      include: {
        order: { include: { customer: true, items: true } },
        items: { include: { order_item: true } },
        refunds: true,
      },
    });

    await tx.order.update({
      where: { id: existing.order_id },
      data: {
        status: "returned",
        payment_status: "refunded",
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        order_id: existing.order_id,
        from_status: existing.order?.status || "returned",
        to_status: "returned",
        actor_type: "admin",
        note: `Refund of ₹${amount} issued via ${method} (Ref: ${refCode}) by ${processedBy || "Admin"}`,
      },
    });

    return ret;
  });

  return formatAdminReturn(updated);
}
