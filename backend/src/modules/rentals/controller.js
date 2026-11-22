import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as svc from "./service.js";
import * as admin from "./admin.service.js";
import { sendKycFile } from "./kyc-storage.js";
import * as manual from "./manual.service.js";

const p = (req) => req.validatedParams;

// ---- Storefront ----

export const quote = async (req, res) => ok(res, await svc.quote(req.body));
export const listMine = async (req, res) => ok(res, await svc.listCustomerRentals(req.customer.id));
export const getMine = async (req, res) => ok(res, await svc.getCustomerRental(req.customer.id, p(req).id));
export const create = async (req, res) => ok(res, await svc.createRental(req.customer.id, req.body), { status: 201 });
export const pay = async (req, res) => ok(res, await svc.startPayment(req.customer.id, p(req).id, req.body));
export const verify = async (req, res) => ok(res, await svc.verifyPayment(req.customer.id, p(req).id, req.body));
export const extend = async (req, res) => ok(res, await svc.requestExtension(req.customer.id, p(req).id, req.body));
export const requestReturn = async (req, res) => ok(res, await svc.requestReturn(req.customer.id, p(req).id, req.body));
export const cancel = async (req, res) => ok(res, await svc.cancelRental(req.customer.id, p(req).id, req.body));

export async function uploadKyc(req, res) {
  return ok(res, await svc.uploadKycDocument(req.customer.id, req.file, String(req.body?.docType || "")), { status: 201 });
}
export async function uploadRentalKyc(req, res) {
  return ok(res, await svc.uploadRentalKycDocument(req.customer.id, p(req).id, req.file, String(req.body?.docType || "")));
}
export async function deleteKyc(req, res) {
  await svc.deleteKycDocument(req.customer.id, p(req).docId);
  return ok(res, { deleted: true });
}
export async function kycFile(req, res) {
  await sendKycFile(res, await svc.getOwnKycDocument(req.customer.id, p(req).docId));
}

// ---- Admin ----

async function audit(req, rental, summary, action = "update") {
  await logActivity(req, {
    module: "rentals",
    action,
    entityType: "rental",
    entityId: BigInt(rental.id),
    entityLabel: rental.rentalNumber,
    summary,
  });
  return rental;
}

export const adminList = async (req, res) => ok(res, await admin.listAdminRentals(req.validatedQuery));
export const adminGet = async (req, res) => ok(res, await admin.getAdminRental(p(req).id));

export async function adminKyc(req, res) {
  const r = await admin.reviewKyc(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `KYC review for ${r.rentalNumber}: ${r.kyc.statusLabel}`));
}
export async function adminApprove(req, res) {
  const r = await admin.approveRental(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Approved rental ${r.rentalNumber}`, "status_change"));
}
export async function adminAssign(req, res) {
  const r = await admin.assignUnit(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Assigned unit ${r.unit?.unitCode} to ${r.rentalNumber}`));
}
export async function adminDispatch(req, res) {
  const r = await admin.dispatchRental(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Dispatched ${r.rentalNumber} via ${req.body.courier}`, "status_change"));
}
export async function adminDelivered(req, res) {
  const r = await admin.markDelivered(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Marked ${r.rentalNumber} delivered (runs ${r.startDate} → ${r.endDate})`, "status_change"));
}
export async function adminPayment(req, res) {
  const r = await admin.recordPayment(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Recorded ₹${Number(req.body.amount) / 100} ${req.body.method} payment on ${r.rentalNumber}`, "create"));
}
export async function adminExtend(req, res) {
  const r = await admin.extendRental(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Extended ${r.rentalNumber} by ${req.body.extraPeriods} ${r.plan.unit}(s) till ${r.endDate}`));
}
export async function adminReturn(req, res) {
  const r = await admin.scheduleReturn(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Scheduled pickup for ${r.rentalNumber} on ${req.body.pickupDate}`, "status_change"));
}
export async function adminReceive(req, res) {
  const r = await admin.receiveReturn(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Received ${r.rentalNumber} (${req.body.condition}); deposit refund ₹${r.amounts.depositRefund}`, "status_change"));
}
export async function adminRefundDeposit(req, res) {
  const r = await admin.refundDeposit(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Deposit refund ₹${Number(req.body.amount) / 100} on ${r.rentalNumber}`, "create"));
}
export async function adminRefund(req, res) {
  const r = await admin.issueRentalRefund(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Refund ₹${Number(req.body.amount) / 100} on ${r.rentalNumber}`, "create"));
}
export const adminSyncRefund = async (req, res) => ok(res, await admin.syncRentalRefund(p(req).id, p(req).refundId));
export async function adminCancel(req, res) {
  const r = await admin.cancelRental(p(req).id, req.body, req.admin);
  return ok(res, await audit(req, r, `Cancelled ${r.rentalNumber}: ${req.body.reason}`, "status_change"));
}
export const adminRemind = async (req, res) => ok(res, await admin.sendReminder(p(req).id, req.admin));
export const adminNote = async (req, res) => ok(res, await admin.addNote(p(req).id, req.body.note, req.admin));
export const adminKycFile = async (req, res) => admin.streamKycDocument(p(req).id, p(req).docId, res);

// ---- Admin: manual entry ----
export const adminFormOptions = async (req, res) => ok(res, await manual.formOptions());
export const adminLookupCustomer = async (req, res) => ok(res, await manual.lookupCustomer(req.validatedQuery.email));
export async function adminCreateManual(req, res) {
  const created = await manual.createManualRental(req.body, req.admin);
  await logActivity(req, {
    module: "rentals",
    action: "create",
    entityType: "rental",
    entityId: BigInt(created.id),
    entityLabel: created.rentalNumber,
    summary: `Entered rental ${created.rentalNumber} manually${created.customerCreated ? " (new customer account created)" : ""}`,
  });
  return ok(res, created, { status: 201 });
}
