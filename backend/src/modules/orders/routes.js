import { Router } from "express";
import { requireCustomer } from "../../middlewares/auth.js";
import * as controller from "./controller.js";

const router = Router();
router.use(requireCustomer);

router.post("/", controller.createOrder);
router.get("/", controller.listOrders);
router.get("/:id", controller.getOrder);
router.post("/:id/cancel", controller.cancelOrder);
router.post("/:id/returns", controller.requestReturn);
router.post("/:id/verify-payment", controller.verifyPayment);

export default router;
