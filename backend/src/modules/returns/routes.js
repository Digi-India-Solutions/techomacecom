import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireCustomer, requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { imageUpload } from "../../middlewares/upload.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Storefront: /api/v1/returns            (signed-in customer)
 *   GET  /              my return / replacement requests
 *   POST /photos        upload photos before submitting a request
 *   POST /:id/cancel    withdraw a request (before pickup)
 *   (create: POST /api/v1/orders/:id/returns — see modules/orders/routes.js)
 *
 * Admin: /api/v1/admin/returns           (returns.view / returns.edit)
 */

const photoLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many uploads. Please wait a few minutes." } }),
});

const byId = validate({ params: v.idParams });

export const customerReturnRoutes = Router();
customerReturnRoutes.use(requireCustomer);
customerReturnRoutes.get("/", c.listMine);
customerReturnRoutes.post("/photos", photoLimiter, imageUpload(), c.uploadPhotos);
customerReturnRoutes.post("/:id/cancel", byId, c.cancelMine);

/** Mounted on the storefront orders router: POST /orders/:id/returns */
export const createReturnHandler = [validate({ body: v.createReturnSchema }), c.createReturn];

const view = requirePermission("returns.view");
const edit = requirePermission("returns.edit");

export const adminReturnRoutes = Router();
adminReturnRoutes.get("/", view, validate({ query: v.listQuery }), c.list);
adminReturnRoutes.get("/:id", view, byId, c.detail);
adminReturnRoutes.post("/:id/approve", edit, byId, validate({ body: v.noteSchema }), c.approve);
adminReturnRoutes.post("/:id/reject", edit, byId, validate({ body: v.rejectSchema }), c.reject);
adminReturnRoutes.post("/:id/pickup", edit, byId, validate({ body: v.pickupSchema }), c.pickup);
adminReturnRoutes.post("/:id/receive", edit, byId, validate({ body: v.receiveSchema }), c.receive);
adminReturnRoutes.post("/:id/refund", edit, byId, validate({ body: v.refundSchema }), c.refund);
adminReturnRoutes.post("/:id/replacement", edit, byId, validate({ body: v.shipReplacementSchema }), c.replacement);
adminReturnRoutes.post("/:id/complete", edit, byId, validate({ body: v.noteSchema }), c.complete);
adminReturnRoutes.patch("/:id/note", edit, byId, validate({ body: v.adminNoteSchema }), c.note);
