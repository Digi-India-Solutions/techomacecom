import { Router } from "express";
import { requireCustomer } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createReturnHandler } from "../returns/routes.js";
import { cancelOrderSchema } from "./validator.js";
import * as controller from "./controller.js";

const router = Router();
router.use(requireCustomer);

router.post("/", controller.createOrder);
router.get("/", controller.listOrders);
router.get("/:id", controller.getOrder);
router.post("/:id/cancel", validate({ body: cancelOrderSchema }), controller.cancelOrder);
router.post("/:id/returns", ...createReturnHandler); // return / replacement request (modules/returns)
router.post("/:id/verify-payment", controller.verifyPayment);

export default router;
