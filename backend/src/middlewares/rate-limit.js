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

/**
 * Customer sign-up / sign-in / email codes from one IP: 20 per 10 min
 * (CUSTOMER_AUTH_RATE_LIMIT overrides it — the integration tests raise it).
 */
export const customerAuthLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  limit: Number(process.env.CUSTOMER_AUTH_RATE_LIMIT) || 20,
  message: "Too many attempts from this network. Please wait a few minutes and try again.",
});

/** Forgot / reset password: 5 per 15 min per IP */
export const passwordResetLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password reset requests. Try again in 15 minutes.",
});

/**
 * Storefront "forgot password" emails: 5 per 15 min per IP — separate from the staff
 * limiter above so the two never share a counter. (Per account there is also a 60 s
 * resend cooldown in the service.) CUSTOMER_RESET_RATE_LIMIT overrides it for tests.
 */
export const customerPasswordResetLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.CUSTOMER_RESET_RATE_LIMIT) || 5,
  message: "Too many password reset requests. Try again in 15 minutes.",
});

/** Public catalog search / autocomplete: 120 per minute per IP (typing fires one call per keystroke pause) */
export const catalogSearchLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: "Too many searches. Please slow down for a moment.",
});
