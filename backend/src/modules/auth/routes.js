import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requireCustomer } from "../../middlewares/auth.js";
import { customerAuthLimiter } from "../../middlewares/rate-limit.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Storefront customer auth — mounted at /api/v1/auth
 * Document §12.1: /auth/otp/send, /auth/otp/verify, /auth/refresh
 */
const router = Router();

router.get("/config", c.config);

router.post("/otp/send", customerAuthLimiter, validate({ body: v.sendOtpSchema }), c.sendOtp);
router.post("/otp/verify", customerAuthLimiter, validate({ body: v.verifyOtpSchema }), c.verifyOtp);
router.post("/google", customerAuthLimiter, validate({ body: v.googleSchema }), c.google);

router.post("/refresh", c.refresh);
router.post("/logout", c.logout);

router.get("/me", requireCustomer, c.me);
router.put("/me", requireCustomer, validate({ body: v.updateProfileSchema }), c.updateMe);
router.post("/me/mobile/send", requireCustomer, customerAuthLimiter, validate({ body: v.addMobileSchema }), c.sendMobileOtp);
router.post("/me/mobile/verify", requireCustomer, customerAuthLimiter, validate({ body: v.verifyMobileSchema }), c.verifyMobile);

// Signed-in devices. Under /auth so the path-scoped refresh cookie identifies "this device".
router.get("/sessions", requireCustomer, c.sessions);
router.post("/sessions/revoke-others", requireCustomer, c.revokeOthers);
router.delete("/sessions/:id", requireCustomer, validate({ params: v.sessionIdParams }), c.revokeSession);

export default router;
