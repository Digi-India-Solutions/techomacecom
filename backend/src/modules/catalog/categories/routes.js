import { Router } from "express";
import { validate } from "../../../middlewares/validate.js";
import { requireAnyPermission, requirePermission } from "../../../middlewares/auth.js";
import { idParamSchema } from "../shared.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Admin categories — mounted at /api/v1/admin/categories (behind requireAdmin).
 *
 *   GET    /             tree with product counts   categories.view OR products.view*
 *   GET    /:id          one category                categories.view OR products.view
 *   POST   /             create                      categories.create
 *   PUT    /tree         save drag-and-drop order    categories.edit
 *   PUT    /:id          update                      categories.edit
 *   DELETE /:id          soft delete (if empty)      categories.delete
 *
 * * The product editor needs the category picker, so product editors can read the tree too.
 */
const router = Router();
const canRead = requireAnyPermission("categories.view", "products.view");
const byId = validate({ params: idParamSchema });

router.get("/", canRead, c.list);
router.post("/", requirePermission("categories.create"), validate({ body: v.categorySchema }), c.create);
router.put("/tree", requirePermission("categories.edit"), validate({ body: v.treeSchema }), c.reorder); // before /:id
router.get("/:id", canRead, byId, c.getOne);
router.put("/:id", requirePermission("categories.edit"), byId, validate({ body: v.categorySchema }), c.update);
router.delete("/:id", requirePermission("categories.delete"), byId, c.remove);

export default router;
