import { ok } from "../../../lib/http.js";
import { logActivity } from "../../../services/activity.service.js";
import * as service from "./service.js";

/** Admin category endpoints. Every write is recorded in the activity log (document §9). */

const id = (req) => BigInt(req.validatedParams.id);

export async function list(req, res) {
  return ok(res, await service.listTree());
}

export async function getOne(req, res) {
  return ok(res, await service.getById(id(req)));
}

export async function create(req, res) {
  const category = await service.create(req.body);
  await logActivity(req, {
    module: "categories",
    action: "create",
    entityType: "category",
    entityId: BigInt(category.id),
    entityLabel: category.name,
    summary: `Created Level ${category.level} category${category.pathLabel.includes(">") ? ` under ${category.pathLabel.split(" > ").slice(0, -1).join(" > ")}` : ""}`,
  });
  return ok(res, category, { status: 201 });
}

export async function update(req, res) {
  const category = await service.update(id(req), req.body);
  await logActivity(req, {
    module: "categories",
    action: "update",
    entityType: "category",
    entityId: BigInt(category.id),
    entityLabel: category.name,
    summary: `Updated category (${category.status})`,
  });
  return ok(res, category);
}

export async function reorder(req, res) {
  const { changed, tree } = await service.reorder(req.body.tree);
  if (changed) {
    await logActivity(req, {
      module: "categories",
      action: "update",
      entityType: "category",
      summary: `Re-ordered the category tree (${changed} categor${changed === 1 ? "y" : "ies"} moved)`,
    });
  }
  return ok(res, tree);
}

export async function remove(req, res) {
  const { row, removedCount } = await service.remove(id(req));
  await logActivity(req, {
    module: "categories",
    action: "delete",
    entityType: "category",
    entityId: row.id,
    entityLabel: row.name,
    summary: removedCount > 1 ? `Deleted with ${removedCount - 1} empty subcategories` : "Deleted category",
  });
  return ok(res, { message: `Category "${row.name}" deleted`, tree: await service.listTree() });
}
