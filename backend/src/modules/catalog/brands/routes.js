import { Router } from "express";
import { validate } from "../../../middlewares/validate.js";
import { requireAnyPermission, requirePermission } from "../../../middlewares/auth.js";
import { idParamSchema } from "../shared.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Admin brands — mounted at /api/v1/admin/brands (behind requireAdmin).
 *
 *   GET    /       all brands (+ ?q= &status=)   brands.view OR products.view (brand picker)
 *   GET    /:id    one brand                     brands.view OR products.view
 *   POST   /       create                        brands.create
 *   PUT    /:id    update                        brands.edit
 *   DELETE /:id    soft delete (if no products)  brands.delete
 */
const router = Router();
const canRead = requireAnyPermission("brands.view", "products.view");
const byId = validate({ params: idParamSchema });

router.get("/", canRead, validate({ query: v.brandListQuery }), c.list);
router.post("/", requirePermission("brands.create"), validate({ body: v.brandSchema }), c.create);
router.get("/:id", canRead, byId, c.getOne);
router.put("/:id", requirePermission("brands.edit"), byId, validate({ body: v.brandSchema }), c.update);
router.delete("/:id", requirePermission("brands.delete"), byId, c.remove);

export default router;
