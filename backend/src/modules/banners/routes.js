import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

const router = Router();

// Storefront public active banners & layout route
router.get("/public/hero", c.listPublicHeroBanners);
router.get("/public/page", c.listPublicPageBanners);
router.get("/public/homepage-config", c.getHomepageConfig);

// =============================================================================
// Admin Hero Banners
// =============================================================================
router.get("/hero", requirePermission("marketing.view"), c.listHeroBanners);
router.get("/hero/:id", requirePermission("marketing.view"), c.getHeroBanner);
router.post(
  "/hero",
  requirePermission("marketing.create"),
  validate({ body: v.heroBannerSchema }),
  c.createHeroBanner
);
router.put(
  "/hero/reorder",
  requirePermission("marketing.edit"),
  validate({ body: v.reorderHeroBannersSchema }),
  c.reorderHeroBanners
);
router.put(
  "/hero/:id",
  requirePermission("marketing.edit"),
  validate({ body: v.updateHeroBannerSchema }),
  c.updateHeroBanner
);
router.delete("/hero/:id", requirePermission("marketing.delete"), c.deleteHeroBanner);

// =============================================================================
// Admin Page Banners (Category, Brand, Best Sellers, Offers, Deals, etc.)
// =============================================================================
router.get("/page", requirePermission("marketing.view"), c.listPageBanners);
router.get("/page/:id", requirePermission("marketing.view"), c.getPageBanner);
router.post(
  "/page",
  requirePermission("marketing.create"),
  validate({ body: v.pageBannerSchema }),
  c.createPageBanner
);
router.put(
  "/page/:id",
  requirePermission("marketing.edit"),
  validate({ body: v.updatePageBannerSchema }),
  c.updatePageBanner
);
router.delete("/page/:id", requirePermission("marketing.delete"), c.deletePageBanner);

// =============================================================================
// Admin Homepage Sections & Announcement Config
// =============================================================================
router.get("/homepage-config", requirePermission("marketing.view"), c.getHomepageConfig);
router.put(
  "/homepage-config",
  requirePermission("marketing.edit"),
  validate({ body: v.saveHomepageConfigSchema }),
  c.saveHomepageConfig
);

export default router;
