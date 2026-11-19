import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

const router = Router();

router.get(
  "/",
  requirePermission("products.view"),
  validate({ query: v.productQuerySchema }),
  c.listProducts
);

router.get("/:id", requirePermission("products.view"), c.getProduct);

router.post(
  "/",
  requirePermission("products.create"),
  validate({ body: v.createProductSchema }),
  c.createProduct
);

router.put(
  "/:id",
  requirePermission("products.edit"),
  validate({ body: v.updateProductSchema }),
  c.updateProduct
);

router.delete("/:id", requirePermission("products.delete"), c.deleteProduct);

export default router;

