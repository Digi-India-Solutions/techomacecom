import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Staff, roles and permissions — mounted at /api/v1/admin (behind requireAdmin, see src/routes.js)
 * Document §12.2: CRUD /admin/staff · CRUD /admin/roles · GET /admin/permissions (staff.*)
 *                 GET /admin/activity-logs (activity.view)
 */
const router = Router();

const byId = validate({ params: v.idParamSchema });

router.get("/permissions", requirePermission("staff.view"), c.listPermissions);

router.get("/roles", requirePermission("staff.view"), c.listRoles);
router.post("/roles", requirePermission("staff.create"), validate({ body: v.roleSchema }), c.createRole);
router.put("/roles/:id", requirePermission("staff.edit"), byId, validate({ body: v.roleSchema }), c.updateRole);
router.delete("/roles/:id", requirePermission("staff.delete"), byId, c.deleteRole);

router.get("/staff", requirePermission("staff.view"), c.listStaff);
router.post("/staff", requirePermission("staff.create"), validate({ body: v.staffSchema }), c.createStaff);
router.put("/staff/:id", requirePermission("staff.edit"), byId, validate({ body: v.staffSchema }), c.updateStaff);
router.patch("/staff/:id/status", requirePermission("staff.edit"), byId, c.toggleStaffStatus);
router.post("/staff/:id/reset-password", requirePermission("staff.edit"), byId, c.resetStaffPassword);

router.get("/activity-logs", requirePermission("activity.view"), validate({ query: v.activityQuerySchema }), c.listActivity);

export default router;
