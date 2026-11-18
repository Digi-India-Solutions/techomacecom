import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/auth.js";
import { adminLoginLimiter, passwordResetLimiter } from "../../middlewares/rate-limit.js";
import { imageUpload } from "../../middlewares/upload.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Admin staff auth — mounted at /api/v1/admin/auth
 * Document §12.2: login, logout, forgot-password, reset-password, me
 * + profile: photo, own activity, signed-in devices
 */
const router = Router();

router.post("/login", adminLoginLimiter, validate({ body: v.loginSchema }), c.login);
router.post("/refresh", c.refresh);
router.post("/logout", c.logout);
router.post("/forgot-password", passwordResetLimiter, validate({ body: v.forgotSchema }), c.forgotPassword);
router.post("/reset-password", passwordResetLimiter, validate({ body: v.resetSchema }), c.resetPassword);

router.get("/me", requireAdmin, c.me);
router.put("/me", requireAdmin, validate({ body: v.updateMeSchema }), c.updateMe);
router.put("/me/password", requireAdmin, validate({ body: v.changePasswordSchema }), c.changePassword);
router.put("/me/avatar", requireAdmin, imageUpload({ single: true }), c.uploadAvatar);
router.delete("/me/avatar", requireAdmin, c.deleteAvatar);
router.get("/me/activity", requireAdmin, validate({ query: v.myActivityQuery }), c.myActivity);

// Signed-in devices. Lives under /admin/auth so the refresh cookie (path-scoped) identifies "this device".
router.get("/sessions", requireAdmin, c.sessions);
router.post("/sessions/revoke-others", requireAdmin, c.revokeOthers);
router.delete("/sessions/:id", requireAdmin, validate({ params: v.sessionIdParams }), c.revokeSession);

export default router;
