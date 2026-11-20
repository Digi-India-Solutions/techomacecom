import { ok } from "../../../lib/http.js";
import { logActivity } from "../../../services/activity.service.js";
import * as service from "./service.js";

/** Admin brand endpoints. Every write is recorded in the activity log. */

const id = (req) => BigInt(req.validatedParams.id);

export async function list(req, res) {
  return ok(res, await service.list(req.validatedQuery));
}

export async function getOne(req, res) {
  return ok(res, await service.getById(id(req)));
}

export async function create(req, res) {
  const brand = await service.create(req.body);
  await logActivity(req, {
    module: "brands",
    action: "create",
    entityType: "brand",
    entityId: BigInt(brand.id),
    entityLabel: brand.name,
    summary: "Created brand",
  });
  return ok(res, brand, { status: 201 });
}

export async function update(req, res) {
  const { before, brand } = await service.update(id(req), req.body);
  const changes = [];
  if (before.name !== brand.name) changes.push(`Renamed from "${before.name}"`);
  if (before.status !== brand.status) changes.push(`Status: ${before.status} → ${brand.status}`);
  await logActivity(req, {
    module: "brands",
    action: before.status !== brand.status ? "status_change" : "update",
    entityType: "brand",
    entityId: BigInt(brand.id),
    entityLabel: brand.name,
    summary: changes.join(" · ") || "Updated brand details",
  });
  return ok(res, brand);
}

export async function remove(req, res) {
  const row = await service.remove(id(req));
  await logActivity(req, {
    module: "brands",
    action: "delete",
    entityType: "brand",
    entityId: row.id,
    entityLabel: row.name,
    summary: "Deleted brand",
  });
  return ok(res, { message: `Brand "${row.name}" deleted` });
}
