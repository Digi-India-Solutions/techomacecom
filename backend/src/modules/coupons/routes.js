import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

const router = Router();

// Storefront / checkout coupon validation & calculation
router.post("/apply", validate({ body: v.applyCouponSchema }), c.applyCoupon);

// Admin Coupon Management
router.get("/", requirePermission("marketing.view"), c.listCoupons);
router.get("/:id", requirePermission("marketing.view"), c.getCoupon);
router.post(
  "/",
  requirePermission("marketing.create"),
  validate({ body: v.couponSchema }),
  c.createCoupon
);
router.put(
  "/:id",
  requirePermission("marketing.edit"),
  validate({ body: v.updateCouponSchema }),
  c.updateCoupon
);
router.delete("/:id", requirePermission("marketing.delete"), c.deleteCoupon);

export default router;

