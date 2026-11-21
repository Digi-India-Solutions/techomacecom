import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requireCustomer } from "../../middlewares/auth.js";
import { imageUpload } from "../../middlewares/upload.js";
import * as c from "./controller.js";
import * as v from "./validator.js";
import * as ordersController from "./orders.controller.js";

/**
 * Storefront "My account" data — mounted at /api/v1/account (signed-in customers only).
 * Profile fields, mobile change and signed-in devices are under /api/v1/auth (me, sessions).
 */
const router = Router();
router.use(requireCustomer);

const byId = validate({ params: v.idParams });

router.get("/addresses", c.listAddresses);
router.post("/addresses", validate({ body: v.addressSchema }), c.createAddress);
router.put("/addresses/:id", byId, validate({ body: v.addressSchema }), c.updateAddress);
router.post("/addresses/:id/default", byId, c.setDefaultAddress);
router.delete("/addresses/:id", byId, c.deleteAddress);

router.get("/gst", c.listGst);
router.post("/gst", validate({ body: v.gstSchema }), c.createGst);
router.put("/gst/:id", byId, validate({ body: v.gstSchema }), c.updateGst);
router.post("/gst/:id/default", byId, c.setDefaultGst);
router.delete("/gst/:id", byId, c.deleteGst);

router.put("/avatar", imageUpload({ single: true }), c.uploadAvatar);
router.delete("/avatar", c.deleteAvatar);

// ---- Orders ----
router.get("/orders", ordersController.listOrders);
router.post("/orders", ordersController.createOrder);
router.get("/orders/:id", ordersController.getOrder);

export default router;
