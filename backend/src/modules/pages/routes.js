import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";

// =============================================================================
// Storefront Public Routes
// =============================================================================
export const publicPageRoutes = Router();
publicPageRoutes.get("/", c.listPublicPages);
publicPageRoutes.get("/:slug", c.getPublicPage);

// =============================================================================
// Admin CMS Pages Routes
// =============================================================================
export const adminPageRoutes = Router();
adminPageRoutes.get("/", requirePermission("content.view"), c.listAdminPages);
adminPageRoutes.get("/:idOrSlug", requirePermission("content.view"), c.getAdminPage);
adminPageRoutes.post("/", requirePermission("content.create"), c.createAdminPage);
adminPageRoutes.put("/:idOrSlug", requirePermission("content.edit"), c.updateAdminPage);
adminPageRoutes.delete("/:idOrSlug", requirePermission("content.delete"), c.deleteAdminPage);

export default {
  public: publicPageRoutes,
  admin: adminPageRoutes,
};

