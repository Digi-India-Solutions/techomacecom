import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireCustomer, requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { kycUpload } from "./kyc-storage.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Storefront: /api/v1/rentals   (quote is public; everything else needs a signed-in customer)
 * Admin:      /api/v1/admin/rentals  (rentals.view / rentals.edit)
 */

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many uploads. Please wait a few minutes." } }),
});

const byId = validate({ params: v.idParams });

export const storefrontRentalRoutes = Router();
storefrontRentalRoutes.post("/quote", validate({ body: v.quoteSchema }), c.quote);
storefrontRentalRoutes.use(requireCustomer);
storefrontRentalRoutes.get("/", c.listMine);
storefrontRentalRoutes.post("/", validate({ body: v.createRentalSchema }), c.create);
storefrontRentalRoutes.post("/kyc-documents", uploadLimiter, kycUpload, c.uploadKyc);
storefrontRentalRoutes.get("/kyc-documents/:docId/file", validate({ params: v.docIdParams }), c.kycFile);
storefrontRentalRoutes.delete("/kyc-documents/:docId", validate({ params: v.docIdParams }), c.deleteKyc);
storefrontRentalRoutes.get("/:id", byId, c.getMine);
storefrontRentalRoutes.post("/:id/pay", byId, validate({ body: v.payStartSchema }), c.pay);
storefrontRentalRoutes.post("/:id/verify-payment", byId, validate({ body: v.verifySchema }), c.verify);
storefrontRentalRoutes.post("/:id/kyc-documents", byId, uploadLimiter, kycUpload, c.uploadRentalKyc);
storefrontRentalRoutes.post("/:id/extend", byId, validate({ body: v.extendSchema }), c.extend);
storefrontRentalRoutes.post("/:id/return-request", byId, validate({ body: v.returnRequestSchema }), c.requestReturn);
storefrontRentalRoutes.post("/:id/cancel", byId, validate({ body: v.cancelSchema }), c.cancel);

const view = requirePermission("rentals.view");
const edit = requirePermission("rentals.edit");

export const adminRentalRoutes = Router();
adminRentalRoutes.get("/", view, validate({ query: v.listQuery }), c.adminList);
// Manual entry (registered before "/:id")
const create = requirePermission("rentals.create");
adminRentalRoutes.get("/new/options", create, c.adminFormOptions);
adminRentalRoutes.get("/customer-lookup", create, validate({ query: v.lookupQuery }), c.adminLookupCustomer);
adminRentalRoutes.post("/", create, validate({ body: v.manualRentalSchema }), c.adminCreateManual);
adminRentalRoutes.get("/:id", view, byId, c.adminGet);
adminRentalRoutes.get("/:id/kyc/:docId/file", view, validate({ params: v.docParams }), c.adminKycFile);
adminRentalRoutes.post("/:id/kyc-review", edit, byId, validate({ body: v.kycReviewSchema }), c.adminKyc);
adminRentalRoutes.post("/:id/approve", edit, byId, validate({ body: v.approveSchema }), c.adminApprove);
adminRentalRoutes.post("/:id/assign-unit", edit, byId, validate({ body: v.assignSchema }), c.adminAssign);
adminRentalRoutes.post("/:id/dispatch", edit, byId, validate({ body: v.dispatchSchema }), c.adminDispatch);
adminRentalRoutes.post("/:id/delivered", edit, byId, validate({ body: v.deliveredSchema }), c.adminDelivered);
adminRentalRoutes.post("/:id/payments", edit, byId, validate({ body: v.paymentSchema }), c.adminPayment);
adminRentalRoutes.post("/:id/deposit-cheque", edit, byId, validate({ body: v.depositChequeSchema }), c.adminDepositCheque);
adminRentalRoutes.post("/:id/extend", edit, byId, validate({ body: v.adminExtendSchema }), c.adminExtend);
adminRentalRoutes.post("/:id/schedule-return", edit, byId, validate({ body: v.scheduleReturnSchema }), c.adminReturn);
adminRentalRoutes.post("/:id/receive", edit, byId, validate({ body: v.receiveSchema }), c.adminReceive);
adminRentalRoutes.post("/:id/refund-deposit", edit, byId, validate({ body: v.refundSchema }), c.adminRefundDeposit);
adminRentalRoutes.post("/:id/refunds", edit, byId, validate({ body: v.otherRefundSchema }), c.adminRefund);
adminRentalRoutes.post("/:id/refunds/:refundId/sync", edit, validate({ params: v.refundParams }), c.adminSyncRefund);
adminRentalRoutes.post("/:id/cancel", edit, byId, validate({ body: v.cancelSchema }), c.adminCancel);
adminRentalRoutes.post("/:id/remind", edit, byId, c.adminRemind);
adminRentalRoutes.post("/:id/notes", edit, byId, validate({ body: v.noteSchema }), c.adminNote);
