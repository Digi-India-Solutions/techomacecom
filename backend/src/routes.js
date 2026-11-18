import { Router } from "express";
import { requireAdmin } from "./middlewares/auth.js";
import customerAuthRoutes from "./modules/auth/routes.js";
import adminAuthRoutes from "./modules/admin-auth/routes.js";
import staffRoutes from "./modules/staff/routes.js";
import uploadRoutes from "./modules/uploads/routes.js";

/**
 * All API routes live under /api/v1 (document §12).
 *   /api/v1/...        public + storefront customer routes
 *   /api/v1/admin/...  staff routes — every one needs a staff JWT + a permission
 */
const api = Router();

// ---- Storefront ----
api.use("/auth", customerAuthRoutes);

// ---- Admin ----
const admin = Router();
admin.use("/auth", adminAuthRoutes); // login / refresh / reset are reachable without a session
admin.use(requireAdmin); // everything below needs a signed-in, active staff member
admin.use(staffRoutes); // /permissions, /roles, /staff, /activity-logs
admin.use("/uploads", uploadRoutes); // images → WebP on local disk
// admin.use("/products", productRoutes) … add new admin modules here
api.use("/admin", admin);

export default api;
