import { Router } from "express";
import { requireAdmin } from "./middlewares/auth.js";
import customerAuthRoutes from "./modules/auth/routes.js";
import accountRoutes from "./modules/account/routes.js";
import adminAuthRoutes from "./modules/admin-auth/routes.js";
import staffRoutes from "./modules/staff/routes.js";
import uploadRoutes from "./modules/uploads/routes.js";
import inventoryRoutes from "./modules/inventory/routes.js";
import productRoutes from "./modules/products/routes.js";
import rentalUnitRoutes from "./modules/rental-units/routes.js";
import bannerRoutes from "./modules/banners/routes.js";

/**
 * All API routes live under /api/v1 (document §12).
 *   /api/v1/...        public + storefront customer routes
 *   /api/v1/admin/...  staff routes — every one needs a staff JWT + a permission
 */
const api = Router();

// ---- Storefront ----
api.use("/auth", customerAuthRoutes); // OTP / Google sign-in, profile, signed-in devices
api.use("/account", accountRoutes); // addresses, GST details, profile photo
api.use("/banners", bannerRoutes); // public hero banners for storefront

// ---- Admin ----
const admin = Router();
admin.use("/auth", adminAuthRoutes); // login / refresh / reset are reachable without a session
admin.use(requireAdmin); // everything below needs a signed-in, active staff member
admin.use(staffRoutes); // /permissions, /roles, /staff, /activity-logs
admin.use("/uploads", uploadRoutes); // images → WebP on local disk
admin.use("/inventory", inventoryRoutes); // stock, warehouses, movements
admin.use("/products", productRoutes); // full product catalog CRUD
admin.use("/rental-units", rentalUnitRoutes); // serialized rental equipment units
admin.use("/banners", bannerRoutes); // hero banners & marketing management
api.use("/admin", admin);

export default api;
