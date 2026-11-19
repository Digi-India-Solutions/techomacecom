import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listRentalUnits(req, res) {
  const units = await service.listRentalUnits(req.query);
  return ok(res, units);
}

export async function getRentalUnit(req, res) {
  const unit = await service.getRentalUnitById(req.params.id);
  if (!unit) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Rental unit not found" },
    });
  }
  return ok(res, unit);
}

export async function createRentalUnit(req, res) {
  const unit = await service.createRentalUnit(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "rental_units",
      action: "create",
      entityType: "rental_unit",
      entityId: BigInt(unit.id),
      entityLabel: `${unit.unitCode} (${unit.serialNumber})`,
      summary: `Created rental unit ${unit.unitCode} (SN: ${unit.serialNumber})`,
    });
  } catch (err) {
    console.warn("Could not log rental unit creation activity:", err);
  }

  return ok(res, unit, { status: 201 });
}

export async function bulkCreateRentalUnits(req, res) {
  const result = await service.bulkCreateRentalUnits(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "rental_units",
      action: "create",
      entityType: "rental_unit",
      entityId: null,
      entityLabel: `${result.added.length} units`,
      summary: `Bulk added ${result.added.length} rental unit(s), skipped ${result.skipped.length}`,
    });
  } catch (err) {
    console.warn("Could not log bulk rental units activity:", err);
  }

  return ok(res, result, { status: 201 });
}

export async function updateRentalUnit(req, res) {
  const unit = await service.updateRentalUnit(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "rental_units",
      action: "update",
      entityType: "rental_unit",
      entityId: BigInt(unit.id),
      entityLabel: unit.unitCode,
      summary: `Updated rental unit ${unit.unitCode} (Status: ${unit.status}, Condition: ${unit.condition})`,
    });
  } catch (err) {
    console.warn("Could not log rental unit update activity:", err);
  }

  return ok(res, unit);
}

export async function addServiceLog(req, res) {
  const unit = await service.addServiceLog(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "rental_units",
      action: "update",
      entityType: "rental_unit",
      entityId: BigInt(unit.id),
      entityLabel: unit.unitCode,
      summary: `Logged service event for ${unit.unitCode}: ${req.body.issue}`,
    });
  } catch (err) {
    console.warn("Could not log rental unit service activity:", err);
  }

  return ok(res, unit);
}

export async function addSanitisationLog(req, res) {
  const unit = await service.addSanitisationLog(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "rental_units",
      action: "update",
      entityType: "rental_unit",
      entityId: BigInt(unit.id),
      entityLabel: unit.unitCode,
      summary: `Logged sanitisation event for ${unit.unitCode}: ${req.body.method}`,
    });
  } catch (err) {
    console.warn("Could not log rental unit sanitisation activity:", err);
  }

  return ok(res, unit);
}

