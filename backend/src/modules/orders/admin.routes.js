import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { orderRefundSchema } from "../returns/validator.js";
import * as adminController from "./admin.controller.js";

const router = Router();

router.get("/", requirePermission("orders.view"), adminController.listOrders);
router.post("/bulk-packed", requirePermission("orders.edit"), adminController.bulkPacked);
router.get("/:id", requirePermission("orders.view"), adminController.getOrder);
router.patch("/:id/status", requirePermission("orders.edit"), adminController.updateStatus);
router.post("/:id/shipment", requirePermission("orders.edit"), adminController.createShipment);
router.post("/:id/notes", requirePermission("orders.edit"), adminController.addNote);
// Money out → Returns & Refunds permission
router.post("/:id/refunds", requirePermission("returns.edit"), validate({ body: orderRefundSchema }), adminController.issueRefund);
router.post("/:id/refunds/:refundId/sync", requirePermission("returns.edit"), adminController.syncRefund);

export default router;
