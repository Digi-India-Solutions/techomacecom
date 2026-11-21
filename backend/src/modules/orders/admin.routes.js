import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import * as adminController from "./admin.controller.js";

const router = Router();

router.get("/returns", requirePermission("orders.view"), adminController.listReturns);
router.patch("/returns/:id/status", requirePermission("orders.edit"), adminController.updateReturnStatus);
router.post("/returns/:id/refund", requirePermission("orders.edit"), adminController.processReturnRefund);

router.get("/", requirePermission("orders.view"), adminController.listOrders);
router.get("/:id", requirePermission("orders.view"), adminController.getOrder);
router.patch("/:id/status", requirePermission("orders.edit"), adminController.updateStatus);
router.post("/:id/shipment", requirePermission("orders.edit"), adminController.createShipment);
router.post("/:id/notes", requirePermission("orders.edit"), adminController.addNote);
router.post("/bulk-packed", requirePermission("orders.edit"), adminController.bulkPacked);

export const adminReturnsRoutes = Router();
adminReturnsRoutes.get("/", requirePermission("orders.view"), adminController.listReturns);
adminReturnsRoutes.patch("/:id/status", requirePermission("orders.edit"), adminController.updateReturnStatus);
adminReturnsRoutes.post("/:id/refund", requirePermission("orders.edit"), adminController.processReturnRefund);

export default router;
