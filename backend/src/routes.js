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
import { adminSettingsRoutes, publicSettingsRoutes } from "./modules/settings/routes.js";
import { adminOrdersRoutes, adminReturnsRoutes, storefrontOrdersRoutes } from "./modules/orders/index.js";
import couponRoutes from "./modules/coupons/routes.js";
import dealRoutes from "./modules/deals/routes.js";
import { publicPageRoutes, adminPageRoutes } from "./modules/pages/routes.js";
import { publicFaqRoutes, adminFaqRoutes } from "./modules/faqs/routes.js";
import { publicBlogRoutes, adminBlogRoutes } from "./modules/blog/routes.js";

/**
 * All API routes live under /api/v1 (document §12).
 *   /api/v1/...        public + storefront customer routes
 *   /api/v1/admin/...  staff routes — every one needs a staff JWT + a permission
 */
const api = Router();

// ---- Storefront ----
api.use("/auth", customerAuthRoutes); // email + password sign-up / sign-in, forgot password, profile, signed-in devices
api.use("/account", accountRoutes); // addresses, GST details, profile photo
api.use("/orders", storefrontOrdersRoutes); // customer orders (create, list, detail)
api.use("/banners", bannerRoutes); // public hero banners for storefront
api.use("/enquiries", publicEnquiryRoutes); // sleep-test callback form (+ risk quiz answers)
api.use(publicSettingsRoutes); // /settings/public (store details, fees, rules) · /pincodes/:pincode
api.use("/coupons", couponRoutes); // storefront coupon apply / validate
api.use("/deals", dealRoutes); // storefront deals of the day
api.use("/pages", publicPageRoutes); // storefront public CMS pages
api.use("/faqs", publicFaqRoutes); // storefront public FAQs
api.use("/blog", publicBlogRoutes); // storefront public blog posts
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
admin.use("/orders", adminOrdersRoutes); // sales orders & fulfilment
admin.use("/returns", adminReturnsRoutes); // RMA returns & refund processing
admin.use("/banners", bannerRoutes); // hero banners & marketing management
admin.use("/enquiries", adminEnquiryRoutes); // leads from public forms (enquiries.view)
admin.use("/settings", adminSettingsRoutes); // store, shipping, tax & invoice, notifications, rental
admin.use("/coupons", couponRoutes); // coupons & discount management
admin.use("/deals", dealRoutes); // deals of the day flash sales
admin.use("/pages", adminPageRoutes); // CMS pages (About, Policies, Terms, etc.)
admin.use("/faqs", adminFaqRoutes); // CMS FAQs management
admin.use("/blog", adminBlogRoutes); // CMS Blog posts management
api.use("/admin", admin);

export default api;
