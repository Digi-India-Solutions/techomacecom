import { rateLimit } from "express-rate-limit";

/**
 * IP-based limits (document §13.1). In-memory store — fine for one API process.
 * When Redis is added, swap in rate-limit-redis so limits survive restarts
 * and apply across PM2 instances.
 * The per-mobile OTP limit (3 per 10 min) lives in the OTP service and uses the DB.
 */
function limiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message } }),
  });
}

/** Staff login: 10 per 15 min per IP */
export const adminLoginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many sign-in attempts from this network. Try again in 15 minutes.",
});

/** OTP send / verify and Google sign-in from one IP: 20 per 10 min */
export const customerAuthLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: "Too many attempts from this network. Please wait a few minutes and try again.",
});

/** Forgot / reset password: 5 per 15 min per IP */
export const passwordResetLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password reset requests. Try again in 15 minutes.",
});
