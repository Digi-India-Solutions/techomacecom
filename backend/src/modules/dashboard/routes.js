import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import * as controller from "./controller.js";

export const adminDashboardRoutes = Router();

const view = requirePermission("dashboard.view");

adminDashboardRoutes.get("/overview", view, controller.getOverview);
adminDashboardRoutes.get("/search", view, controller.globalSearch);

