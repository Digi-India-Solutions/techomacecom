import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";
import { getCustomerOrder } from "../orders/service.js";

// ---- Storefront (signed-in customer) ----

export async function uploadPhotos(req, res) {
  const files = [...(req.files?.files || []), ...(req.files?.file || [])];
  return ok(res, await service.saveReturnPhotos(files), { status: 201 });
}

export async function createReturn(req, res) {
  const created = await service.createCustomerReturn(req.customer.id, req.params.id, req.body);
  const [returnRequest, order] = await Promise.all([
    service.getCustomerReturn(req.customer.id, created.id),
    getCustomerOrder(req.customer.id, String(created.order_id)),
  ]);
  return ok(res, { returnRequest, order }, { status: 201 });
}

export async function listMine(req, res) {
  return ok(res, await service.listCustomerReturns(req.customer.id));
}

export async function cancelMine(req, res) {
  return ok(res, await service.cancelCustomerReturn(req.customer.id, req.validatedParams.id));
}

// ---- Admin ----

function audit(req, ret, summary) {
  return logActivity(req, {
    module: "returns",
    action: "update",
    entityType: "return",
    entityId: BigInt(ret.id),
    entityLabel: ret.returnNumber,
    summary,
  });
}

export async function list(req, res) {
  return ok(res, await service.listAdminReturns(req.validatedQuery));
}

export async function detail(req, res) {
  return ok(res, await service.getAdminReturn(req.validatedParams.id));
}

export async function approve(req, res) {
  const ret = await service.approveReturn(req.validatedParams.id, req.body, req.admin);
  await audit(req, ret, `Approved ${ret.typeLabel.toLowerCase()} request ${ret.returnNumber}`);
  return ok(res, ret);
}

export async function reject(req, res) {
  const ret = await service.rejectReturn(req.validatedParams.id, req.body, req.admin);
  await audit(req, ret, `Rejected ${ret.returnNumber}: ${req.body.reason}`);
  return ok(res, ret);
}

export async function pickup(req, res) {
  const ret = await service.schedulePickup(req.validatedParams.id, req.body, req.admin);
  await audit(req, ret, `Scheduled pickup for ${ret.returnNumber} on ${req.body.pickupDate} via ${req.body.courier}`);
  return ok(res, ret);
}

export async function receive(req, res) {
  const ret = await service.markReceived(req.validatedParams.id, req.body, req.admin);
  await audit(req, ret, `Marked ${ret.returnNumber} as received`);
  return ok(res, ret);
}

export async function refund(req, res) {
  const ret = await service.refundReturn(req.validatedParams.id, req.body, req.admin);
  const last = ret.refunds[ret.refunds.length - 1];
  await audit(req, ret, `Refunded ₹${last?.amount ?? ""} for ${ret.returnNumber} via ${last?.methodLabel ?? req.body.mode}`);
  return ok(res, ret);
}

export async function replacement(req, res) {
  const ret = await service.shipReplacement(req.validatedParams.id, req.body, req.admin);
  await audit(req, ret, `Shipped replacement for ${ret.returnNumber} via ${req.body.courier}`);
  return ok(res, ret);
}

export async function complete(req, res) {
  const ret = await service.completeReturn(req.validatedParams.id, req.body, req.admin);
  await audit(req, ret, `Closed ${ret.returnNumber} — replacement delivered`);
  return ok(res, ret);
}

export async function note(req, res) {
  return ok(res, await service.updateAdminNote(req.validatedParams.id, req.body));
}
