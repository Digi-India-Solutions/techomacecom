import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

const router = Router();

router.get("/warehouses", requirePermission("inventory.view"), c.listWarehouses);

router.get(
  "/stock",
  requirePermission("inventory.view"),
  validate({ query: v.stockQuerySchema }),
  c.listStock
);

router.post(
  "/stock/:id/adjust",
  requirePermission("inventory.edit"),
  validate({ body: v.adjustStockSchema }),
  c.adjustStock
);

router.get(
  "/stock/:id/movements",
  requirePermission("inventory.view"),
  c.getStockMovements
);

export default router;

