import { Router } from "express";
import { validate } from "../../../middlewares/validate.js";
import { requirePermission } from "../../../middlewares/auth.js";
import { idParamSchema } from "../shared.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Admin products — mounted at /api/v1/admin/products (behind requireAdmin).
 *
 *   GET    /                 paginated list + filters   products.view
 *   GET    /sku-check        is a SKU free?             products.view
 *   GET    /:id              full product for editor    products.view
 *   POST   /                 create                     products.create
 *   POST   /bulk             activate/deactivate/delete/change_category
 *                                                       products.edit (+ products.delete for delete)
 *   POST   /:id/duplicate    copy as draft              products.create
 *   PUT    /:id              update                     products.edit
 *   DELETE /:id              soft delete                products.delete
 */
const router = Router();
const byId = validate({ params: idParamSchema });

router.get("/", requirePermission("products.view"), validate({ query: v.adminListQuery }), c.list);
router.get("/sku-check", requirePermission("products.view"), validate({ query: v.skuCheckQuery }), c.skuCheck);
router.post("/", requirePermission("products.create"), validate({ body: v.productSchema }), c.create);
router.post(
  "/bulk",
  requirePermission("products.edit"),
  validate({ body: v.bulkSchema }),
  (req, res, next) =>
    req.body.action === "delete" ? requirePermission("products.delete")(req, res, next) : next(),
  c.bulk
);
router.get("/:id", requirePermission("products.view"), byId, c.getOne);
router.post("/:id/duplicate", requirePermission("products.create"), byId, c.duplicate);
router.put("/:id", requirePermission("products.edit"), byId, validate({ body: v.productSchema }), c.update);
router.delete("/:id", requirePermission("products.delete"), byId, c.remove);

export default router;
