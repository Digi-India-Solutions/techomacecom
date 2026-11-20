import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listWarehouses(req, res) {
  const warehouses = await service.listWarehouses();
  return ok(res, warehouses);
}

export async function listStock(req, res) {
  const items = await service.listStockItems(req.query);
  return ok(res, items);
}

export async function adjustStock(req, res) {
  const { stockItem, movement } = await service.adjustStockItem(
    req.params.id,
    req.body,
    req.admin
  );

  const deltaStr =
    movement.delta > 0
      ? `+${movement.delta}`
      : movement.delta < 0
        ? `${movement.delta}`
        : "0";

  await logActivity(req, {
    module: "inventory",
    action: "update",
    entityType: "inventory",
    entityId: BigInt(req.params.id),
    entityLabel: stockItem.sku,
    summary: `Stock adjusted (Δ ${deltaStr}, Available: ${stockItem.availableStock}, Reserved: ${stockItem.reservedStock}, Low: ${stockItem.lowStockThreshold}) [${req.body.reason || "correction"}]`,
  });

  return ok(res, stockItem);
}

export async function getStockMovements(req, res) {
  const movements = await service.getStockMovements(req.params.id);
  return ok(res, movements);
}

