import prisma from "../../../db/db.js";
import { getGroup } from "../settings/service.js";

/**
 * Who may return what — driven by admin → Settings → Returns:
 *   • only delivered orders, within `returnWindowDays` of delivery
 *   • not items whose category (or a parent category) is in `nonReturnableCategoryIds`
 *   • at most the quantity not already in another (not rejected / cancelled) return
 */

export const OPEN_RETURN_STATUSES = ["requested", "approved", "pickup_scheduled", "received", "replacement_shipped"];
export const CLOSED_RETURN_STATUSES = ["refunded", "completed", "rejected", "cancelled"];
const RELEASES_QUANTITY = ["rejected", "cancelled"]; // these give the units back to the customer
const DELIVERED_ORDER_STATUSES = ["delivered", "return_requested", "returned"];
const DAY_MS = 24 * 60 * 60 * 1000;

let categoryCache = { at: 0, parents: new Map() };

async function categoryParents() {
  if (Date.now() - categoryCache.at < 60_000) return categoryCache.parents;
  const rows = await prisma.category.findMany({ select: { id: true, parent_id: true } });
  const parents = new Map(rows.map((r) => [String(r.id), r.parent_id ? String(r.parent_id) : null]));
  categoryCache = { at: Date.now(), parents };
  return parents;
}

/** Settings + category tree, loaded once per request and passed to returnPolicy(). */
export async function loadReturnContext() {
  const [settings, parents] = await Promise.all([getGroup("returns"), categoryParents()]);
  return { settings, parents, blocked: new Set((settings.nonReturnableCategoryIds || []).map(String)) };
}

export function isNonReturnableCategory(categoryId, ctx) {
  let id = categoryId ? String(categoryId) : null;
  for (let depth = 0; id && depth < 6; depth++) {
    if (ctx.blocked.has(id)) return true;
    id = ctx.parents.get(id) || null;
  }
  return false;
}

/** delivered_at, or the time the order history first says "delivered" (orders delivered before that column was filled). */
export function deliveredAtOf(order) {
  if (order.delivered_at) return new Date(order.delivered_at);
  const hit = (order.status_history || []).find((h) => h.to_status === "delivered");
  if (hit) return new Date(hit.created_at);
  return DELIVERED_ORDER_STATUSES.includes(order.status) ? new Date(order.updated_at || order.placed_at) : null;
}

/** order_item id → units already in a live or finished return */
export function returnedQtyByItem(returns = []) {
  const used = new Map();
  for (const r of returns) {
    if (RELEASES_QUANTITY.includes(r.status)) continue;
    for (const ri of r.items || []) {
      const key = String(ri.order_item_id);
      used.set(key, (used.get(key) || 0) + ri.quantity);
    }
  }
  return used;
}

export function returnPolicy(order, ctx) {
  const s = ctx.settings;
  const types = [s.refundEnabled && "refund", s.replacementEnabled && "replacement"].filter(Boolean);
  const deliveredAt = DELIVERED_ORDER_STATUSES.includes(order.status) ? deliveredAtOf(order) : null;
  const windowEndsAt = deliveredAt ? new Date(deliveredAt.getTime() + s.returnWindowDays * DAY_MS) : null;
  const windowOpen = Boolean(windowEndsAt && Date.now() <= windowEndsAt.getTime());

  let blockReason = null;
  if (deliveredAt) {
    if (!s.returnsEnabled || types.length === 0) {
      blockReason = "Online returns are not available right now. Please contact customer support.";
    } else if (!windowOpen) {
      blockReason = `The ${s.returnWindowDays}-day return window for this order closed on ${windowEndsAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })}.`;
    }
  }

  const used = returnedQtyByItem(order.returns);
  const items = (order.items || []).map((it) => {
    const returnedQty = used.get(String(it.id)) || 0;
    const nonReturnable = isNonReturnableCategory(it.product?.category_id, ctx);
    const remaining = Math.max(0, it.quantity - returnedQty);
    return {
      orderItemId: String(it.id),
      returnedQty,
      nonReturnable,
      returnableQty: deliveredAt && !blockReason && !nonReturnable ? remaining : 0,
    };
  });

  if (deliveredAt && !blockReason && items.length && items.every((i) => i.returnableQty === 0)) {
    blockReason = items.every((i) => i.nonReturnable)
      ? "The items in this order are not returnable."
      : "Every returnable item in this order is already part of a return request.";
  }

  return {
    windowDays: s.returnWindowDays,
    deliveredAt,
    windowEndsAt,
    windowOpen,
    types,
    items,
    canReturn: Boolean(deliveredAt) && !blockReason,
    blockReason,
  };
}

/**
 * Refund estimate for the selected lines, based on what was actually paid
 * (so product discounts, coupons and GST are already accounted for).
 * Returning every unit of the order refunds the full order total, shipping included.
 *
 * @param lines [{ item: order_items row, quantity }]
 * @returns {{ total: bigint, perLine: bigint[] }}
 */
export function estimateRefund(order, lines, alreadyReturned = new Map()) {
  const sumLines = (order.items || []).reduce((s, it) => s + BigInt(it.line_total_paise), 0n);
  const extras = BigInt(order.shipping_paise || 0n) + BigInt(order.cod_charge_paise || 0n);
  const goodsPaid = BigInt(order.total_paise) - extras > 0n ? BigInt(order.total_paise) - extras : 0n;

  const perLine = lines.map(({ item, quantity }) => {
    if (sumLines === 0n || item.quantity <= 0) return 0n;
    return (goodsPaid * BigInt(item.line_total_paise) * BigInt(quantity)) / (sumLines * BigInt(item.quantity));
  });

  const returningEverything =
    (order.items || []).length > 0 &&
    order.items.every((it) => {
      const now = lines.filter((l) => String(l.item.id) === String(it.id)).reduce((s, l) => s + l.quantity, 0);
      return now === it.quantity && !(alreadyReturned.get(String(it.id)) > 0);
    });

  let total = perLine.reduce((s, v) => s + v, 0n);
  if (returningEverything) {
    const diff = BigInt(order.total_paise) - total; // rounding + shipping
    if (diff > 0n && perLine.length) perLine[perLine.length - 1] += diff;
    total = BigInt(order.total_paise);
  }
  return { total, perLine };
}
