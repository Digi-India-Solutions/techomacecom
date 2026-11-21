import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";

export const publicFaqRoutes = Router();
publicFaqRoutes.get("/", c.listPublicFaqs);

export const adminFaqRoutes = Router();
adminFaqRoutes.get("/", requirePermission("content.view"), c.listAdminFaqs);
adminFaqRoutes.post("/", requirePermission("content.create"), c.createFaq);
adminFaqRoutes.put("/reorder", requirePermission("content.edit"), c.reorderFaqs);
adminFaqRoutes.put("/:id", requirePermission("content.edit"), c.updateFaq);
adminFaqRoutes.delete("/:id", requirePermission("content.delete"), c.deleteFaq);

export default {
  public: publicFaqRoutes,
  admin: adminFaqRoutes,
};

