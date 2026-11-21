import { Router } from "express";
import { requireAdmin } from "./middlewares/auth.js";
import customerAuthRoutes from "./modules/auth/routes.js";
import accountRoutes from "./modules/account/routes.js";
import adminAuthRoutes from "./modules/admin-auth/routes.js";
import staffRoutes from "./modules/staff/routes.js";
import uploadRoutes from "./modules/uploads/routes.js";
import { adminCatalogRoutes, storefrontCatalogRoutes } from "./modules/catalog/index.js";
import inventoryRoutes from "./modules/inventory/routes.js";
import productRoutes from "./modules/products/routes.js";
import rentalUnitRoutes from "./modules/rental-units/routes.js";
import bannerRoutes from "./modules/banners/routes.js";
import { publicEnquiryRoutes, adminEnquiryRoutes } from "./modules/enquiries/routes.js";

/**
 * All API routes live under /api/v1 (document §12).
 *   /api/v1/...        public + storefront customer routes
 *   /api/v1/admin/...  staff routes — every one needs a staff JWT + a permission
 */
const api = Router();

// ---- Storefront ----
api.use("/auth", customerAuthRoutes); // email + password sign-up / sign-in, forgot password, profile, signed-in devices
api.use("/account", accountRoutes); // addresses, GST details, profile photo
api.use("/banners", bannerRoutes); // public hero banners for storefront
api.use("/enquiries", publicEnquiryRoutes); // sleep-test callback form (+ risk quiz answers)
api.use(storefrontCatalogRoutes); // /categories, /brands, /products, /search (public, read-only)

// ---- Admin ----
const admin = Router();
admin.use("/auth", adminAuthRoutes); // login / refresh / reset are reachable without a session
admin.use(requireAdmin); // everything below needs a signed-in, active staff member
admin.use(staffRoutes); // /permissions, /roles, /staff, /activity-logs
admin.use("/uploads", uploadRoutes); // images → WebP on local disk
// Catalog used by the admin Products / Categories / Brands pages and the storefront:
//   /categories, /brands, /products (+ /products/bulk, /:id/duplicate, /sku-check)
admin.use(adminCatalogRoutes);
// Basic product CRUD (modules/products). Kept on its own path so it never shadows — or is
// shadowed by — the catalog /products routes above. Same tables, so both stay in sync.
admin.use("/products-basic", productRoutes);
admin.use("/inventory", inventoryRoutes); // stock, warehouses, movements
admin.use("/rental-units", rentalUnitRoutes); // serialized rental equipment units
admin.use("/banners", bannerRoutes); // hero banners & marketing management
admin.use("/enquiries", adminEnquiryRoutes); // leads from public forms (enquiries.view)
api.use("/admin", admin);

export default api;
