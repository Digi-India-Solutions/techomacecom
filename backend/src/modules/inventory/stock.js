import { ApiError } from "../../lib/http.js";

/**
 * Stock that follows orders and returns (sale inventory — rental machines are tracked as
 * serial-numbered rental_units instead).
 *
 *   order confirmed (COD placed / online payment verified / staff confirm) → reserve   (available −q)
 *   order shipped / delivered                                               → sale      (physical −q, reserve released)
 *   order cancelled before shipping                                         → release   (available +q)
 *   order cancelled after shipping (RTO)                                    → return    (physical +q)
 *   returned item received in resellable condition                          → return    (physical +q)
 *   replacement shipped                                                     → sale      (physical −q)
 *
 * Every movement is tagged with the order / return line (reference_type + reference_id), so each
 * step runs at most once per line and always hits the warehouse row that was reserved.
 * All functions take the Prisma transaction client.
 */

const avail = (inv) => Math.max(0, inv.quantity - inv.reserved);

async function movementsFor(tx, refType, refId) {
  return tx.stockMovement.findMany({ where: { reference_type: refType, reference_id: refId }, orderBy: { id: "asc" } });
}

/** Where a line stands: untracked (never reserved) | reserved | sold | released | returned */
function lineState(moves) {
  let state = "untracked";
  for (const m of moves) {
    if (m.reason === "reserve") state = "reserved";
    else if (m.reason === "release") state = "released";
    else if (m.reason === "sale") state = "sold";
    else if (m.reason === "return") state = "returned";
  }
  return state;
}

async function inventoryRow(tx, variantId, warehouseId = null) {
  if (warehouseId) {
    const row = await tx.inventory.findUnique({ where: { variant_id_warehouse_id: { variant_id: variantId, warehouse_id: warehouseId } } });
    if (row) return row;
  }
  const rows = await tx.inventory.findMany({ where: { variant_id: variantId } });
  if (rows.length) return rows.sort((a, b) => avail(b) - avail(a))[0];
  // No stock row yet for this variant → create one in the first active warehouse (stock 0)
  const wh = await tx.warehouse.findFirst({ where: { is_active: true }, orderBy: { id: "asc" } });
  if (!wh) return null;
  return tx.inventory.create({ data: { variant_id: variantId, warehouse_id: wh.id, quantity: 0, reserved: 0 } });
}

async function move(tx, inv, { quantity, reserved, change, reason, refType, refId, note, adminId }) {
  const q = Math.max(0, quantity);
  const r = Math.max(0, reserved);
  await tx.inventory.update({ where: { id: inv.id }, data: { quantity: q, reserved: r } });
  await tx.stockMovement.create({
    data: {
      variant_id: inv.variant_id,
      warehouse_id: inv.warehouse_id,
      change_qty: change,
      reason,
      reference_type: refType,
      reference_id: refId,
      balance_after: Math.max(0, q - r),
      admin_user_id: adminId ?? null,
      note,
    },
  });
}

/** Available units of a variant across warehouses. */
export async function availableFor(tx, variantId) {
  const rows = await tx.inventory.findMany({ where: { variant_id: variantId } });
  return rows.reduce((s, r) => s + avail(r), 0);
}

/** Checkout guard: throws when any line asks for more than is available. */
export async function assertInStock(tx, lines) {
  const need = new Map();
  for (const l of lines) need.set(String(l.variantId), (need.get(String(l.variantId)) || 0) + l.quantity);
  for (const l of lines) {
    const want = need.get(String(l.variantId));
    if (want == null) continue;
    const have = await availableFor(tx, BigInt(l.variantId));
    if (have < want) {
      throw ApiError.conflict(
        have > 0 ? `Only ${have} left of "${l.name}". Please reduce the quantity.` : `"${l.name}" is out of stock right now.`,
        "OUT_OF_STOCK"
      );
    }
    need.delete(String(l.variantId));
  }
}

export async function reserveOrder(tx, order, { adminId = null } = {}) {
  for (const it of order.items) {
    const moves = await movementsFor(tx, "order_item", it.id);
    if (lineState(moves) !== "untracked") continue;
    const inv = await inventoryRow(tx, it.variant_id);
    if (!inv) continue;
    await move(tx, inv, {
      quantity: inv.quantity,
      reserved: inv.reserved + it.quantity,
      change: -it.quantity,
      reason: "reserve",
      refType: "order_item",
      refId: it.id,
      note: `Reserved for order ${order.order_number}`,
      adminId,
    });
  }
}

export async function shipOrder(tx, order, { adminId = null } = {}) {
  for (const it of order.items) {
    const moves = await movementsFor(tx, "order_item", it.id);
    const state = lineState(moves);
    if (state === "sold") continue;
    const reservedMove = moves.find((m) => m.reason === "reserve");
    const inv = await inventoryRow(tx, it.variant_id, reservedMove?.warehouse_id);
    if (!inv) continue;
    await move(tx, inv, {
      quantity: inv.quantity - it.quantity,
      reserved: state === "reserved" ? inv.reserved - it.quantity : inv.reserved,
      change: -it.quantity,
      reason: "sale",
      refType: "order_item",
      refId: it.id,
      note: `Shipped with order ${order.order_number}`,
      adminId,
    });
  }
}

/** Cancellation: give back reserved stock, or take shipped units back into stock (RTO). */
export async function cancelOrderStock(tx, order, { adminId = null } = {}) {
  for (const it of order.items) {
    const moves = await movementsFor(tx, "order_item", it.id);
    const state = lineState(moves);
    const last = moves[moves.length - 1];
    if (state === "reserved") {
      const inv = await inventoryRow(tx, it.variant_id, last.warehouse_id);
      await move(tx, inv, {
        quantity: inv.quantity,
        reserved: inv.reserved - it.quantity,
        change: it.quantity,
        reason: "release",
        refType: "order_item",
        refId: it.id,
        note: `Order ${order.order_number} cancelled — reservation released`,
        adminId,
      });
    } else if (state === "sold") {
      const inv = await inventoryRow(tx, it.variant_id, last.warehouse_id);
      await move(tx, inv, {
        quantity: inv.quantity + it.quantity,
        reserved: inv.reserved,
        change: it.quantity,
        reason: "return",
        refType: "order_item",
        refId: it.id,
        note: `Order ${order.order_number} cancelled after dispatch — back in stock`,
        adminId,
      });
    }
  }
}

/**
 * Return received. Resellable units go back into stock; damaged ones are logged (no stock change).
 * @param items [{ returnItem, orderItem, condition }]
 */
export async function receiveReturnStock(tx, ret, items, { adminId = null } = {}) {
  for (const { returnItem, orderItem, condition } of items) {
    const moves = await movementsFor(tx, "return_item", returnItem.id);
    if (moves.some((m) => m.reason === "return" || m.reason === "damage")) continue;
    const sold = (await movementsFor(tx, "order_item", orderItem.id)).filter((m) => m.reason === "sale").pop();
    const inv = await inventoryRow(tx, orderItem.variant_id, sold?.warehouse_id);
    if (!inv) continue;
    const resellable = condition !== "damaged";
    // Orders shipped before stock tracking never left stock in the system — don't add them back twice
    const tracked = Boolean(sold);
    const restock = resellable && tracked;
    await move(tx, inv, {
      quantity: restock ? inv.quantity + returnItem.quantity : inv.quantity,
      reserved: inv.reserved,
      change: restock ? returnItem.quantity : 0,
      reason: resellable ? "return" : "damage",
      refType: "return_item",
      refId: returnItem.id,
      note: !resellable
        ? `Return ${ret.return_number}: ${returnItem.quantity} damaged — not restocked`
        : restock
          ? `Return ${ret.return_number}: ${returnItem.quantity} back in stock`
          : `Return ${ret.return_number}: ${returnItem.quantity} received — order shipped before stock tracking, adjust stock manually if needed`,
      adminId,
    });
  }
}

/** Replacement shipped: the new units leave stock. */
export async function shipReplacementStock(tx, ret, items, { adminId = null } = {}) {
  for (const { returnItem, orderItem } of items) {
    const moves = await movementsFor(tx, "return_item", returnItem.id);
    if (moves.some((m) => m.reason === "sale")) continue;
    const inv = await inventoryRow(tx, orderItem.variant_id);
    if (!inv) continue;
    await move(tx, inv, {
      quantity: inv.quantity - returnItem.quantity,
      reserved: inv.reserved,
      change: -returnItem.quantity,
      reason: "sale",
      refType: "return_item",
      refId: returnItem.id,
      note: `Replacement for ${ret.return_number} shipped`,
      adminId,
    });
  }
}
