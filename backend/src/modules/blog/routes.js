import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";

export const publicBlogRoutes = Router();
publicBlogRoutes.get("/", c.listPublicBlogPosts);
publicBlogRoutes.get("/:slug", c.getPublicBlogPost);

export const adminBlogRoutes = Router();
adminBlogRoutes.get("/", requirePermission("content.view"), c.listAdminBlogPosts);
adminBlogRoutes.get("/:idOrSlug", requirePermission("content.view"), c.getAdminBlogPost);
adminBlogRoutes.post("/", requirePermission("content.create"), c.createBlogPost);
adminBlogRoutes.put("/:idOrSlug", requirePermission("content.edit"), c.updateBlogPost);
adminBlogRoutes.delete("/:idOrSlug", requirePermission("content.delete"), c.deleteBlogPost);

export default {
  public: publicBlogRoutes,
  admin: adminBlogRoutes,
};

