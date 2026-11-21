import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

const router = Router();

// Storefront public active deals
router.get("/public", c.listPublicDeals);

// Admin Deal of the Day Management
router.get("/", requirePermission("marketing.view"), c.listDeals);
router.get("/:id", requirePermission("marketing.view"), c.getDeal);
router.post(
  "/",
  requirePermission("marketing.create"),
  validate({ body: v.dealSchema }),
  c.createDeal
);
router.put(
  "/:id",
  requirePermission("marketing.edit"),
  validate({ body: v.updateDealSchema }),
  c.updateDeal
);
router.delete("/:id", requirePermission("marketing.delete"), c.deleteDeal);

export default router;

