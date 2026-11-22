import prisma from "../../../db/db.js";
import { alertStaff } from "../../services/admin-alerts.service.js";
import { receiveReturnStock, shipReplacementStock } from "../inventory/stock.js";
import { ApiError } from "../../lib/http.js";
import { formatINR } from "../../lib/money.js";
import { encryptJson, decryptJson } from "../../lib/crypto.js";
import { parseStoredPath } from "../../lib/storage.js";
import { notify } from "../../services/notification.service.js";
import { getGroup } from "../settings/service.js";
import { saveImage } from "../uploads/service.js";
import {
  issueRefund,
  refundSummary,
  refundedAmountPaise,
  REFUND_METHOD_LABEL,
} from "../refunds/service.js";
import { loadReturnContext, returnPolicy, returnedQtyByItem, estimateRefund, OPEN_RETURN_STATUSES } from "./policy.js";
import { RETURN_DETAIL_INCLUDE, RETURN_STATUS_LABEL, toAdminReturnDto, toCustomerReturnDto } from "./dto.js";

/**
 * Return / replacement requests (RMA).
 *
 *   requested ─┬─ approved ─┬─ pickup_scheduled ─┬─ received ─┬─ refunded              (refund)
 *              │            │                    │            └─ replacement_shipped ─ completed (replacement)
 *              ├─ rejected  └─ (refund / replacement can also be sent before the item comes back)
 *              └─ cancelled (by the customer, before pickup)
 *
 * Staff may refund a replacement request (e.g. the item is out of stock) — the customer's
 * choice is a preference, the final resolution is whatever was actually done.
 */

const TRANSITIONS = {
  requested: ["approved", "rejected", "cancelled"],
  approved: ["pickup_scheduled", "received", "refunded", "replacement_shipped", "rejected", "cancelled"],
  pickup_scheduled: ["received", "refunded", "replacement_shipped", "rejected"],
  received: ["refunded", "replacement_shipped", "rejected"],
  replacement_shipped: ["completed"],
  refunded: [],
  completed: [],
  rejected: [],
  cancelled: [],
};
const TERMINAL = ["refunded", "completed", "rejected", "cancelled"];

const ADMIN_INCLUDE = {
  ...RETURN_DETAIL_INCLUDE,
  order: {
    include: {
      customer: { select: { id: true, name: true, email: true, mobile: true } },
      items: true,
      payments: true,
      refunds: true,
    },
  },
};

const typeWord = (type) => (type === "replacement" ? "replacement" : "return");
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

function orderWhere(orderRef, customerId) {
  const ref = String(orderRef);
  return /^\d+$/.test(ref)
    ? { id: BigInt(ref), customer_id: BigInt(customerId) }
    : { order_number: ref, customer_id: BigInt(customerId) };
}

function assertTransition(ret, to) {
  if (!(TRANSITIONS[ret.status] || []).includes(to)) {
    const label = RETURN_STATUS_LABEL[ret.status] || ret.status;
    throw ApiError.conflict(
      TERMINAL.includes(ret.status)
        ? `This request is already closed (${label.toLowerCase()})`
        : `A request that is "${label}" cannot be moved to "${RETURN_STATUS_LABEL[to] || to}"`,
      "INVALID_STATUS"
    );
  }
}

/** Status change + history row (+ a line on the order timeline). Runs inside a transaction. */
async function transition(tx, ret, to, { actorType, actorId = null, note = null, data = {} }) {
  assertTransition(ret, to);
  const updated = await tx.return.update({
    where: { id: ret.id },
    data: { status: to, ...(TERMINAL.includes(to) ? { resolved_at: new Date() } : {}), ...data },
  });
  await tx.returnStatusHistory.create({
    data: { return_id: ret.id, from_status: ret.status, to_status: to, actor_type: actorType, actor_id: actorId, note },
  });
  const orderNote = `${typeWord(ret.type) === "replacement" ? "Replacement" : "Return"} ${ret.return_number}: ${(
    RETURN_STATUS_LABEL[to] || to
  ).toLowerCase()}${note ? ` — ${note}` : ""}`;
  const order = await tx.order.findUnique({ where: { id: ret.order_id }, select: { status: true } });
  await tx.orderStatusHistory.create({
    data: {
      order_id: ret.order_id,
      from_status: order?.status ?? null,
      to_status: order?.status ?? "delivered",
      actor_type: actorType,
      actor_id: actorId,
      note: orderNote.slice(0, 1000),
    },
  });
  return updated;
}

async function nextReturnNumber(tx) {
  const year = new Date().getFullYear();
  const last = await tx.return.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  const seq = Number(last?.id || 0n) + 1;
  return `RET-${year}-${String(seq).padStart(5, "0")}`;
}

function notifyCustomer(event, ret, vars = {}) {
  const order = ret.order || {};
  const customer = order.customer || {};
  notify(event, {
    email: customer.email,
    mobile: customer.mobile,
    vars: {
      customer_name: customer.name || order.shipping_address?.name || "Customer",
      order_number: order.order_number,
      return_number: ret.return_number,
      request_type: typeWord(ret.type),
      ...vars,
    },
    entityType: "return",
    entityId: ret.id,
  }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

const CUSTOMER_ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, mobile: true } },
  items: { include: { product: { select: { category_id: true } } } },
  returns: { include: { items: true } },
  status_history: { where: { to_status: "delivered" }, orderBy: { created_at: "asc" }, take: 1 },
};

/** Photos are uploaded first (POST /returns/photos) and sent back as stored paths. */
export async function saveReturnPhotos(files = []) {
  const { maxPhotos } = await getGroup("returns");
  if (!files.length) throw ApiError.badRequest('Attach photos in the "files" field', "NO_FILE");
  if (files.length > maxPhotos) throw ApiError.badRequest(`Upload at most ${maxPhotos} photos`);
  const saved = [];
  for (const file of files) {
    const img = await saveImage(file, "returns", { maxDimension: 1600, variantWidths: [] });
    saved.push({ path: img.path, url: img.url });
  }
  return saved;
}

export async function createCustomerReturn(customerId, orderRef, input) {
  const order = await prisma.order.findFirst({ where: orderWhere(orderRef, customerId), include: CUSTOMER_ORDER_INCLUDE });
  if (!order) throw ApiError.notFound("Order not found");

  const ctx = await loadReturnContext();
  const policy = returnPolicy(order, ctx);
  if (!policy.canReturn) {
    throw ApiError.badRequest(policy.blockReason || "You can request a return once the order has been delivered", "NOT_RETURNABLE");
  }
  if (!policy.types.includes(input.type)) {
    throw ApiError.badRequest(
      input.type === "refund" ? "Refunds are not available — please choose a replacement" : "Replacements are not available — please choose a refund",
      "TYPE_NOT_ALLOWED"
    );
  }

  // Photos: our own uploads in the "returns" folder only
  const photos = [...new Set(input.photos)].map((p) => {
    const stored = parseStoredPath(p);
    if (!stored || stored.folder !== "returns") throw ApiError.badRequest("Upload photos with the form before submitting", "INVALID_PHOTO");
    return stored.path;
  });
  if (ctx.settings.photosRequired && photos.length === 0) {
    throw ApiError.badRequest("Please add at least one photo of the product and its packaging", "VALIDATION_ERROR", { photos: "Add at least one photo" });
  }
  if (photos.length > ctx.settings.maxPhotos) throw ApiError.badRequest(`Upload at most ${ctx.settings.maxPhotos} photos`);

  // Items and quantities
  const merged = new Map();
  for (const line of input.items) merged.set(line.orderItemId, (merged.get(line.orderItemId) || 0) + line.quantity);
  const lines = [...merged].map(([orderItemId, quantity]) => {
    const item = order.items.find((it) => String(it.id) === orderItemId);
    if (!item) throw ApiError.badRequest("One of the selected items is not part of this order");
    const allowed = policy.items.find((p) => p.orderItemId === orderItemId)?.returnableQty || 0;
    if (allowed === 0) throw ApiError.badRequest(`"${item.product_name}" cannot be returned`);
    if (quantity > allowed) throw ApiError.badRequest(`You can return at most ${allowed} × "${item.product_name}"`);
    return { item, quantity };
  });

  // Where a COD refund goes
  let refundAccount = null;
  if (input.type === "refund" && order.payment_method === "cod") {
    if (!input.refundAccount) {
      throw ApiError.badRequest("Tell us the bank account or UPI id for your refund", "VALIDATION_ERROR", {
        refundAccount: "Required for cash on delivery orders",
      });
    }
    refundAccount = encryptJson(input.refundAccount);
  }

  const estimate = estimateRefund(order, lines, returnedQtyByItem(order.returns));

  let created;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    try {
      created = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`;
        // Re-check quantities under the lock (two tabs submitting at once)
        const live = await tx.return.findMany({ where: { order_id: order.id }, include: { items: true } });
        const used = returnedQtyByItem(live);
        for (const { item, quantity } of lines) {
          if ((used.get(String(item.id)) || 0) + quantity > item.quantity) {
            throw ApiError.conflict(`"${item.product_name}" is already part of another return request`);
          }
        }

        const ret = await tx.return.create({
          data: {
            order_id: order.id,
            return_number: await nextReturnNumber(tx),
            type: input.type,
            reason: input.reason,
            customer_note: input.customerNote,
            photos,
            status: "requested",
            requested_amount_paise: estimate.total, // item value — also the starting point if a replacement ends up refunded
            refund_account: refundAccount,
            items: {
              create: lines.map(({ item, quantity }, i) => ({
                order_item_id: item.id,
                quantity,
                refund_amount_paise: estimate.perLine[i],
              })),
            },
            status_history: {
              create: { from_status: null, to_status: "requested", actor_type: "customer", actor_id: BigInt(customerId), note: input.reason },
            },
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            order_id: order.id,
            from_status: order.status,
            to_status: order.status,
            actor_type: "customer",
            actor_id: BigInt(customerId),
            note: `${input.type === "replacement" ? "Replacement" : "Return"} requested (${ret.return_number}): ${input.reason}`,
          },
        });
        return ret;
      });
    } catch (err) {
      if (err?.code !== "P2002" || attempt === 2) throw err; // return_number collision → try the next number
    }
  }

  notifyCustomer("return_requested", { ...created, order });
  alertStaff({
    type: "return_requested",
    title: `${input.type === "replacement" ? "Replacement" : "Return"} requested: ${created.return_number}`,
    message: `Order ${order.order_number} · ${input.reason}${photos.length ? ` · ${photos.length} photo${photos.length === 1 ? "" : "s"}` : ""}`,
    severity: "warning",
    link: `/admin/returns?id=${created.id}`,
    entityType: "return",
    entityId: created.id,
    permission: "returns.view",
  });
  return created;
}

export async function cancelCustomerReturn(customerId, returnId) {
  const ret = await prisma.return.findFirst({
    where: { id: returnId, order: { customer_id: BigInt(customerId) } },
    include: { order: { select: { id: true, order_number: true } } },
  });
  if (!ret) throw ApiError.notFound("Return request not found");
  if (!["requested", "approved"].includes(ret.status)) {
    throw ApiError.conflict(
      ret.status === "cancelled"
        ? "This request is already cancelled"
        : "This request can no longer be cancelled online — the pickup is already arranged. Please contact support."
    );
  }
  await prisma.$transaction((tx) =>
    transition(tx, ret, "cancelled", { actorType: "customer", actorId: BigInt(customerId), note: "Cancelled by customer" })
  );
  alertStaff({
    type: "return_cancelled",
    title: `Customer withdrew ${ret.return_number}`,
    message: `Order ${ret.order?.order_number || ""} — no action needed.`,
    link: `/admin/returns?id=${ret.id}`,
    entityType: "return",
    entityId: ret.id,
    permission: "returns.view",
  });
  return getCustomerReturn(customerId, returnId);
}

export async function getCustomerReturn(customerId, returnId) {
  const ret = await prisma.return.findFirst({
    where: { id: returnId, order: { customer_id: BigInt(customerId) } },
    include: { ...RETURN_DETAIL_INCLUDE, order: { select: { id: true, order_number: true } } },
  });
  if (!ret) throw ApiError.notFound("Return request not found");
  return toCustomerReturnDto(ret);
}

export async function listCustomerReturns(customerId) {
  const rows = await prisma.return.findMany({
    where: { order: { customer_id: BigInt(customerId) } },
    include: { ...RETURN_DETAIL_INCLUDE, order: { select: { id: true, order_number: true } } },
    orderBy: { created_at: "desc" },
    take: 100,
  });
  return rows.map((r) => toCustomerReturnDto(r));
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function loadAdminReturn(id) {
  const ret = await prisma.return.findUnique({ where: { id }, include: ADMIN_INCLUDE });
  if (!ret) throw ApiError.notFound("Return request not found");
  return ret;
}

function refundableFor(ret) {
  const summary = refundSummary(ret.order);
  const alreadyForReturn = refundedAmountPaise(ret.refunds);
  const remainingEstimate = BigInt(ret.requested_amount_paise) - alreadyForReturn;
  const balancePaise = BigInt(Math.round(summary.balance * 100));
  const suggestedPaise = remainingEstimate > 0n ? (remainingEstimate < balancePaise ? remainingEstimate : balancePaise) : 0n;
  const account = decryptJson(ret.refund_account);
  const isCod = ret.order.payment_method === "cod";
  return {
    paid: summary.paid,
    alreadyRefunded: summary.refunded,
    max: summary.balance,
    suggested: Number(BigInt(ret.requested_amount_paise) > 0n ? suggestedPaise : balancePaise) / 100,
    gatewayAvailable: summary.gatewayAvailable,
    defaultMode: isCod || !summary.gatewayAvailable ? (account?.mode === "upi" ? "upi" : "bank_transfer") : "gateway",
  };
}

async function adminNamesFor(ret) {
  const ids = [...new Set((ret.status_history || []).filter((h) => h.actor_type === "admin" && h.actor_id).map((h) => h.actor_id))];
  if (!ids.length) return new Map();
  const rows = await prisma.adminUser.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(rows.map((r) => [String(r.id), r.name]));
}

export async function getAdminReturn(id) {
  const ret = await loadAdminReturn(id);
  return toAdminReturnDto(ret, { detail: true, adminNames: await adminNamesFor(ret), refundable: refundableFor(ret) });
}

const STATUS_GROUPS = { open: OPEN_RETURN_STATUSES, closed: ["refunded", "completed", "rejected", "cancelled"] };

export async function listAdminReturns({ status = "all", type = "all", q } = {}) {
  const where = {};
  if (status !== "all") where.status = STATUS_GROUPS[status] ? { in: STATUS_GROUPS[status] } : status;
  if (type !== "all") where.type = type;
  if (q) {
    where.OR = [
      { return_number: { contains: q, mode: "insensitive" } },
      { order: { order_number: { contains: q, mode: "insensitive" } } },
      { order: { customer: { name: { contains: q, mode: "insensitive" } } } },
      { order: { customer: { mobile: { contains: q } } } },
      { order: { customer: { email: { contains: q, mode: "insensitive" } } } },
      { items: { some: { order_item: { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product_name: { contains: q, mode: "insensitive" } }] } } } },
    ];
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [rows, counts, refunded30d] = await Promise.all([
    prisma.return.findMany({ where, include: ADMIN_INCLUDE, orderBy: { created_at: "desc" }, take: 300 }),
    prisma.return.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.refund.aggregate({
      where: { return_id: { not: null }, status: { in: ["processing", "processed"] }, created_at: { gte: since } },
      _sum: { amount_paise: true },
    }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const count = (...statuses) => statuses.reduce((s, k) => s + (byStatus[k] || 0), 0);
  return {
    items: rows.map((r) => toAdminReturnDto(r)),
    summary: {
      needsReview: count("requested"),
      inPickup: count("approved", "pickup_scheduled"),
      awaitingResolution: count("received"),
      replacementInTransit: count("replacement_shipped"),
      open: count(...OPEN_RETURN_STATUSES),
      closed: count("refunded", "completed", "rejected", "cancelled"),
      total: count(...Object.keys(TRANSITIONS)),
      refundedLast30Days: Number(refunded30d._sum.amount_paise || 0n) / 100,
    },
  };
}

export async function approveReturn(id, { note }, admin) {
  const ret = await loadAdminReturn(id);
  await prisma.$transaction((tx) => transition(tx, ret, "approved", { actorType: "admin", actorId: admin.id, note }));
  notifyCustomer("return_approved", ret, { note: note || "" });
  return getAdminReturn(id);
}

export async function rejectReturn(id, { reason }, admin) {
  const ret = await loadAdminReturn(id);
  await prisma.$transaction((tx) =>
    transition(tx, ret, "rejected", { actorType: "admin", actorId: admin.id, note: reason, data: { rejection_reason: reason } })
  );
  notifyCustomer("return_rejected", ret, { reason });
  return getAdminReturn(id);
}

export async function schedulePickup(id, { pickupDate, courier, awb, trackingUrl, note }, admin) {
  const ret = await loadAdminReturn(id);
  assertTransition(ret, "pickup_scheduled");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.create({
        data: {
          order_id: ret.order_id,
          return_id: ret.id,
          direction: "reverse",
          courier_name: courier,
          awb_code: awb || null,
          tracking_url: trackingUrl || null,
          pickup_date: new Date(`${pickupDate}T00:00:00Z`),
          status: "pickup_scheduled",
        },
      });
      await transition(tx, ret, "pickup_scheduled", {
        actorType: "admin",
        actorId: admin.id,
        note: note || `Pickup on ${fmtDate(`${pickupDate}T00:00:00Z`)} via ${courier}${awb ? ` (AWB ${awb})` : ""}`,
      });
    });
  } catch (err) {
    if (err?.code === "P2002") throw ApiError.conflict(`AWB ${awb} is already used by another shipment`, "DUPLICATE_AWB", { awb: "Already used" });
    throw err;
  }
  notifyCustomer("return_pickup_scheduled", ret, {
    pickup_date: fmtDate(`${pickupDate}T00:00:00Z`),
    courier,
    awb: awb || "will be shared by the courier",
  });
  return getAdminReturn(id);
}

export async function markReceived(id, { items, note }, admin) {
  const ret = await loadAdminReturn(id);
  assertTransition(ret, "received");
  const known = new Set(ret.items.map((i) => String(i.id)));
  for (const it of items) if (!known.has(it.id)) throw ApiError.badRequest("Unknown item in this return");

  await prisma.$transaction(async (tx) => {
    for (const it of items) {
      await tx.returnItem.update({ where: { id: BigInt(it.id) }, data: { condition_received: it.condition } });
    }
    await tx.shipment.updateMany({
      where: { return_id: ret.id, direction: "reverse", status: { not: "delivered" } },
      data: { status: "delivered", delivered_at: new Date() },
    });
    // Resellable units go back into sale stock; damaged ones are only logged
    await receiveReturnStock(
      tx,
      ret,
      ret.items.map((ri) => ({
        returnItem: ri,
        orderItem: ri.order_item,
        condition: items.find((i) => i.id === String(ri.id))?.condition || "resellable",
      })),
      { adminId: admin.id }
    );
    const damaged = items.filter((i) => i.condition === "damaged").length;
    await transition(tx, ret, "received", {
      actorType: "admin",
      actorId: admin.id,
      note: note || (items.length ? `Inspected: ${items.length - damaged} resellable, ${damaged} damaged` : "Item received at the warehouse"),
    });
  });
  notifyCustomer("return_received", ret);
  return getAdminReturn(id);
}

/** Order becomes "returned" once every unit has come back and been refunded. */
async function markOrderReturnedIfComplete(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, returns: { where: { status: "refunded" }, include: { items: true } } },
  });
  if (!order || order.status === "returned") return;
  const used = returnedQtyByItem(order.returns);
  if (order.items.every((it) => (used.get(String(it.id)) || 0) >= it.quantity)) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "returned",
        status_history: { create: { from_status: order.status, to_status: "returned", actor_type: "system", note: "All items returned and refunded" } },
      },
    });
  }
}

export async function refundReturn(id, { amount, mode, reference, note }, admin) {
  const ret = await loadAdminReturn(id);
  assertTransition(ret, "refunded");

  const { refund } = await issueRefund({
    orderId: ret.order_id,
    returnId: ret.id,
    amountPaise: amount,
    reason: "return",
    mode,
    reference,
    note,
    adminUserId: admin.id,
    throwOnFailure: true,
  });

  const fresh = await prisma.return.findUnique({ where: { id: ret.id } });
  await prisma.$transaction((tx) =>
    transition(tx, fresh, "refunded", {
      actorType: "admin",
      actorId: admin.id,
      note: `${formatINR(amount)} refunded via ${REFUND_METHOD_LABEL[mode].toLowerCase()}${refund.status === "processing" ? " (processing at the bank)" : ""}`,
    })
  );
  await markOrderReturnedIfComplete(ret.order_id);

  const { refundProcessingDays } = await getGroup("returns");
  notifyCustomer("refund_processed", ret, {
    refund_amount: formatINR(amount, { symbol: false }),
    refund_method: mode === "gateway" ? "original payment method" : REFUND_METHOD_LABEL[mode].toLowerCase(),
    reference: refund.reference || refund.gateway_refund_id || String(refund.id),
    refund_days: refundProcessingDays,
  });
  return getAdminReturn(id);
}

export async function shipReplacement(id, { courier, awb, trackingUrl, note }, admin) {
  const ret = await loadAdminReturn(id);
  assertTransition(ret, "replacement_shipped");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.create({
        data: {
          order_id: ret.order_id,
          return_id: ret.id,
          direction: "forward",
          courier_name: courier,
          awb_code: awb || null,
          tracking_url: trackingUrl || null,
          status: "in_transit",
        },
      });
      await shipReplacementStock(tx, ret, ret.items.map((ri) => ({ returnItem: ri, orderItem: ri.order_item })), { adminId: admin.id });
      await transition(tx, ret, "replacement_shipped", {
        actorType: "admin",
        actorId: admin.id,
        note: note || `Replacement shipped via ${courier}${awb ? ` (AWB ${awb})` : ""}`,
      });
    });
  } catch (err) {
    if (err?.code === "P2002") throw ApiError.conflict(`AWB ${awb} is already used by another shipment`, "DUPLICATE_AWB", { awb: "Already used" });
    throw err;
  }
  notifyCustomer("replacement_shipped", ret, { courier, awb: awb || "—", tracking_url: trackingUrl || "" });
  return getAdminReturn(id);
}

export async function completeReturn(id, { note }, admin) {
  const ret = await loadAdminReturn(id);
  await prisma.$transaction(async (tx) => {
    await tx.shipment.updateMany({
      where: { return_id: ret.id, direction: "forward", status: { not: "delivered" } },
      data: { status: "delivered", delivered_at: new Date() },
    });
    await transition(tx, ret, "completed", { actorType: "admin", actorId: admin.id, note: note || "Replacement delivered" });
  });
  return getAdminReturn(id);
}

export async function updateAdminNote(id, { adminNote }) {
  await loadAdminReturn(id);
  await prisma.return.update({ where: { id }, data: { admin_note: adminNote || null } });
  return getAdminReturn(id);
}
