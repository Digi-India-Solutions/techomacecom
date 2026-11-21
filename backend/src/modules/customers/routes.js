import { Router } from "express";
import { requirePermission } from "../../middlewares/auth.js";
import * as controller from "./controller.js";

const router = Router();

router.get("/", requirePermission("customers.view"), controller.listCustomers);
router.get("/:id", requirePermission("customers.view"), controller.getCustomer);
router.patch("/:id/status", requirePermission("customers.edit"), controller.toggleStatus);
router.post("/:id/notes", requirePermission("customers.edit"), controller.addNote);

export default router;

