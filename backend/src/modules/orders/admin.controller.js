import { ok } from "../../lib/http.js";
import * as service from "./service.js";
import * as returnsService from "./returns.service.js";

/**
 * Admin Panel Orders Controller
 */

export async function listOrders(req, res) {
  const orders = await service.listAdminOrders(req.query);
  return ok(res, orders);
}

export async function getOrder(req, res) {
  const order = await service.getAdminOrder(req.params.id);
  return ok(res, order);
}

export async function updateStatus(req, res) {
  const actor = req.admin?.name || "Admin";
  const { status, note } = req.body;
  const order = await service.updateAdminOrderStatus(req.params.id, {
    status,
    actor,
    note,
  });
  return ok(res, order);
}

export async function createShipment(req, res) {
  const actor = req.admin?.name || "Admin";
  const { courier, weightKg, lengthCm, widthCm, heightCm } = req.body;
  const order = await service.createAdminOrderShipment(req.params.id, {
    courier,
    weightKg: Number(weightKg) || 1,
    lengthCm: Number(lengthCm) || 10,
    widthCm: Number(widthCm) || 10,
    heightCm: Number(heightCm) || 10,
    actor,
  });
  return ok(res, order);
}

export async function addNote(req, res) {
  const { note } = req.body;
  const order = await service.addAdminOrderNote(req.params.id, note);
  return ok(res, order);
}

export async function bulkPacked(req, res) {
  const actor = req.admin?.name || "Admin";
  const { ids } = req.body;
  if (Array.isArray(ids)) {
    await service.bulkMarkAdminOrdersPacked(ids, actor);
  }
  return ok(res, { success: true });
}

export async function listReturns(req, res) {
  const returns = await returnsService.listAdminReturns();
  return ok(res, returns);
}

export async function updateReturnStatus(req, res) {
  const updated = await returnsService.updateAdminReturnStatus(req.params.id, req.body);
  return ok(res, updated);
}

export async function processReturnRefund(req, res) {
  const processedBy = req.admin?.name || "Admin";
  const updated = await returnsService.processAdminReturnRefund(req.params.id, {
    ...req.body,
    processedBy,
  });
  return ok(res, updated);
}
