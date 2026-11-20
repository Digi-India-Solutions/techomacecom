import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requireCustomer } from "../../middlewares/auth.js";
import { customerAuthLimiter, customerPasswordResetLimiter } from "../../middlewares/rate-limit.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Storefront customer auth — mounted at /api/v1/auth
 *
 * Sign-up (3 steps)
 *   POST /signup/email/send-otp     { email }                 6-digit code emailed (10 min)
 *   POST /signup/email/verify-otp   { email, otp }            → { verificationToken } (30 min, one use)
 *   POST /signup                    { name, email, emailVerificationToken, mobile,
 *                                     password, confirmPassword }   → account + signed in (cookies)
 * Sign-in
 *   POST /login                     { email, password }       5 wrong → locked 15 min
 * Forgot password (emailed link → storefront /reset-password?token=…)
 *   POST /forgot-password           { email }                 same reply for every email; link valid 30 min
 *   GET  /reset-password/check      ?token=                   → { email (masked), expiresAt } or 400
 *   POST /reset-password            { token, password, confirmPassword }
 *                                                             one use; other sessions signed out; signs in here
 * Session
 *   POST /refresh · POST /logout · GET/PUT /me
 *
 * Every write here is IP rate limited (customerAuthLimiter); codes are also limited per email.
 */
const router = Router();

router.get("/config", c.config);

// ---- Email + password ----
router.post("/signup/email/send-otp", customerAuthLimiter, validate({ body: v.emailOtpSendSchema }), c.sendSignupEmailOtp);
router.post("/signup/email/verify-otp", customerAuthLimiter, validate({ body: v.emailOtpVerifySchema }), c.verifySignupEmailOtp);
router.post("/signup", customerAuthLimiter, validate({ body: v.signupSchema }), c.signup);
router.post("/login", customerAuthLimiter, validate({ body: v.loginSchema }), c.login);

// ---- Forgot / reset password ----
router.post("/forgot-password", customerPasswordResetLimiter, validate({ body: v.forgotPasswordSchema }), c.forgotPassword);
router.get("/reset-password/check", customerAuthLimiter, validate({ query: v.resetTokenQuerySchema }), c.checkResetLink);
router.post("/reset-password", customerAuthLimiter, validate({ body: v.resetPasswordSchema }), c.resetPassword);

// ---- Mobile OTP sign-in / sign-up — DISABLED (storefront now uses email + password) ----
// The controller + service code is kept; uncomment these two lines to switch it back on.
// router.post("/otp/send", customerAuthLimiter, validate({ body: v.sendOtpSchema }), c.sendOtp);
// router.post("/otp/verify", customerAuthLimiter, validate({ body: v.verifyOtpSchema }), c.verifyOtp);

// Google sign-in stays available on the API (the storefront form does not show it now)
router.post("/google", customerAuthLimiter, validate({ body: v.googleSchema }), c.google);

router.post("/refresh", c.refresh);
router.post("/logout", c.logout);

router.get("/me", requireCustomer, c.me);
router.put("/me", requireCustomer, validate({ body: v.updateProfileSchema }), c.updateMe);
// Signed-in customers can still verify / change their mobile with an SMS OTP (not a sign-in)
router.post("/me/mobile/send", requireCustomer, customerAuthLimiter, validate({ body: v.addMobileSchema }), c.sendMobileOtp);
router.post("/me/mobile/verify", requireCustomer, customerAuthLimiter, validate({ body: v.verifyMobileSchema }), c.verifyMobile);

// Signed-in devices. Under /auth so the path-scoped refresh cookie identifies "this device".
router.get("/sessions", requireCustomer, c.sessions);
router.post("/sessions/revoke-others", requireCustomer, c.revokeOthers);
router.delete("/sessions/:id", requireCustomer, validate({ params: v.sessionIdParams }), c.revokeSession);

export default router;
