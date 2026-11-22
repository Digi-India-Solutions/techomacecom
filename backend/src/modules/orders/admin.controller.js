import { ok } from "../../lib/http.js";
import * as service from "./service.js";
import { logActivity } from "../../services/activity.service.js";

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
    adminId: req.admin?.id ?? null,
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

export async function issueRefund(req, res) {
  const order = await service.issueAdminOrderRefund(req.params.id, req.body, req.admin);
  const last = order.refunds[order.refunds.length - 1];
  await logActivity(req, {
    module: "returns",
    action: "create",
    entityType: "order",
    entityId: BigInt(order.id),
    entityLabel: order.orderNumber,
    summary: `Refunded ₹${last?.amount ?? ""} on ${order.orderNumber} via ${last?.methodLabel ?? req.body.mode}`,
  });
  return ok(res, order);
}

export async function syncRefund(req, res) {
  return ok(res, await service.syncAdminOrderRefund(req.params.id, req.params.refundId));
}
