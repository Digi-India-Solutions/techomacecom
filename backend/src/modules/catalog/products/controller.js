import { ok } from "../../../lib/http.js";
import { logActivity } from "../../../services/activity.service.js";
import * as service from "./service.js";

/** Admin product endpoints. Every write is recorded in the activity log. */

const id = (req) => BigInt(req.validatedParams.id);

export async function list(req, res) {
  const { rows, meta } = await service.list(req.validatedQuery);
  return ok(res, rows, { meta });
}

export async function getOne(req, res) {
  return ok(res, await service.getById(id(req)));
}

export async function skuCheck(req, res) {
  const { sku, excludeProductId } = req.validatedQuery;
  return ok(res, await service.skuAvailable(sku, excludeProductId));
}

export async function create(req, res) {
  const { product } = await service.save(null, req.body, req.admin);
  await logActivity(req, {
    module: "products",
    action: "create",
    entityType: "product",
    entityId: BigInt(product.id),
    entityLabel: product.name,
    summary: `Created as ${product.status} · SKU ${product.sku}`,
  });
  return ok(res, product, { status: 201 });
}

export async function update(req, res) {
  const { before, product } = await service.save(id(req), req.body, req.admin);
  const changes = [];
  if (before.status !== product.status) changes.push(`Status: ${before.status} → ${product.status}`);
  if (before.name !== product.name) changes.push(`Renamed from "${before.name}"`);
  await logActivity(req, {
    module: "products",
    action: before.status !== product.status ? "status_change" : "update",
    entityType: "product",
    entityId: BigInt(product.id),
    entityLabel: product.name,
    summary: changes.join(" · ") || "Updated product",
  });
  return ok(res, product);
}

export async function duplicate(req, res) {
  const { source, product } = await service.duplicate(id(req), req.admin);
  await logActivity(req, {
    module: "products",
    action: "create",
    entityType: "product",
    entityId: BigInt(product.id),
    entityLabel: product.name,
    summary: `Duplicated from "${source.name}" (draft)`,
  });
  return ok(res, product, { status: 201 });
}

export async function remove(req, res) {
  const product = await service.remove(id(req));
  await logActivity(req, {
    module: "products",
    action: "delete",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    summary: `Deleted product (SKU ${product.sku})`,
  });
  return ok(res, { message: `"${product.name}" deleted` });
}

export async function bulk(req, res) {
  const count = await service.bulk(req.body);
  const labels = { activate: "Activated", deactivate: "Deactivated", delete: "Deleted", change_category: "Moved" };
  await logActivity(req, {
    module: "products",
    action: req.body.action === "delete" ? "delete" : "update",
    entityType: "product",
    summary: `${labels[req.body.action]} ${count} product${count === 1 ? "" : "s"} (bulk)`,
    newValues: { ids: req.body.ids, ...(req.body.categoryId && { categoryId: req.body.categoryId }) },
  });
  return ok(res, { count, message: `${labels[req.body.action]} ${count} product${count === 1 ? "" : "s"}` });
}
