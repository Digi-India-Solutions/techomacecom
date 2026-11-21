import { envKeyHint } from "./load-env.js";

/**
 * Every environment variable the API reads, in one place.
 * Required values throw at startup so a missing secret never fails silently later.
 */

const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable ${envKeyHint(name)} in backend/.env (see .env.example)`);
  }
  return value.trim();
}

function optional(name, fallback = "") {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value.trim();
}

function int(name, fallback) {
  const raw = process.env[name];
  const n = Number(raw);
  return raw === undefined || raw === "" || Number.isNaN(n) ? fallback : n;
}

function bool(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

const trimSlash = (url) => url.replace(/\/+$/, "");

/**
 * URLs for this environment. config/load-env.js has already copied
 * FRONTEND_URL_LOCAL or FRONTEND_URL_PRODUCTION into FRONTEND_URL (same for every key).
 * In production a missing URL stops startup instead of silently using localhost.
 */
function urlFor(name, localDefault) {
  const value = optional(name);
  if (!value && isProduction) throw new Error(`Missing ${envKeyHint(name)} in backend/.env (needed when NODE_ENV=production)`);
  return trimSlash(value || localDefault);
}

const port = int("PORT", 5001);
const frontendUrl = urlFor("FRONTEND_URL", "http://localhost:3000");
const adminUrl = urlFor("ADMIN_URL", "http://localhost:3001");
const apiUrl = urlFor("API_URL", `http://localhost:${port}`); // public origin of this API (no /api/v1)

/** Browser origins allowed by CORS: the storefront + admin above, their www / 127.0.0.1 twins, plus extras. */
function corsOrigins() {
  const list = [frontendUrl, adminUrl];
  for (const url of [frontendUrl, adminUrl]) {
    const u = new URL(url);
    if (u.hostname === "localhost") list.push(url.replace("localhost", "127.0.0.1"));
    else if (!u.hostname.startsWith("www.") && u.hostname.split(".").length === 2) list.push(url.replace("://", "://www."));
  }
  const extra = optional(isProduction ? "PRODUCTION_URL" : "LOCAL_URL"); // optional extra origins, comma-separated
  list.push(...extra.split(",").map((o) => trimSlash(o.trim())).filter(Boolean));
  return [...new Set(list)];
}

const jwtSecret = required("JWT_SECRET_KEY");
const refreshSecret = required("REFRESH_TOKEN_SECRET");
if (isProduction && (jwtSecret.length < 32 || refreshSecret.length < 32 || jwtSecret === refreshSecret)) {
  throw new Error("JWT_SECRET_KEY and REFRESH_TOKEN_SECRET must be different and at least 32 characters in production");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port,

  frontendUrl,
  adminUrl,
  apiUrl,
  corsOrigins: corsOrigins(),

  jwt: {
    accessSecret: jwtSecret,
    refreshSecret,
    accessExpiry: optional("ACCESS_TOKEN_EXPIRY", "15m"),
    refreshExpiry: optional("REFRESH_TOKEN_EXPIRY", "30d"),
    // Cookie lifetimes in milliseconds
    accessCookieMs: int("ACCESS_TOKEN_COOKIE", 15 * 60 * 1000),
    refreshCookieMs: int("REFRESH_TOKEN_COOKIE", 30 * 24 * 60 * 60 * 1000),
    issuer: "buydenmed-api",
  },

  cookie: {
    domain: optional("COOKIE_DOMAIN") || undefined, // e.g. .buydenmed.com in production
    secure: bool("COOKIE_SECURE", isProduction),
  },

  otp: {
    secret: optional("OTP_HASH_SECRET") || jwtSecret,
    expiryMinutes: int("OTP_EXPIRY_MINUTES", 5),
    // Email codes (sign-up) live longer than SMS codes — inboxes can be slow
    emailExpiryMinutes: int("EMAIL_OTP_EXPIRY_MINUTES", 10),
    maxAttempts: 5, // document §7.2
    sendLimit: 3, // document §13.1: 3 per mobile per 10 min
    sendWindowMinutes: 10,
    resendCooldownSeconds: int("OTP_RESEND_COOLDOWN_SECONDS", 30),
    // In development the OTP is returned in the API response so you can log in without SMS.
    devEcho: bool("OTP_DEV_ECHO", !isProduction),
  },

  sms: {
    provider: optional("SMS_PROVIDER", "console"), // console | msg91
    msg91AuthKey: optional("MSG91_AUTH_KEY"),
    msg91TemplateId: optional("MSG91_OTP_TEMPLATE_ID"),
  },

  google: {
    clientId: optional("GOOGLE_CLIENT_ID"),
  },

  mail: {
    user: optional("EMAIL_USER"),
    pass: optional("EMAIL_PASS"),
    from: optional("EMAIL_FROM") || optional("EMAIL_USER"),
  },

  uploads: {
    // Images are stored on this server's disk (no Cloudinary / S3) and served at /uploads/…
    dir: optional("UPLOADS_DIR", "uploads"), // relative to backend/ or absolute
    // Public origin that serves /uploads (this API in dev; api.buydenmed.com or a CDN in production)
    publicBaseUrl: trimSlash(optional("ASSET_BASE_URL") || apiUrl),
    maxFileMb: int("UPLOAD_MAX_FILE_MB", 10),
    maxFiles: 10,
    // WebP encoding. Lossy at quality 85 looks identical to the original and is ~3–5× smaller than lossless.
    webpQuality: int("IMAGE_WEBP_QUALITY", 85),
    webpLossless: bool("IMAGE_WEBP_LOSSLESS", false),
    webpEffort: int("IMAGE_WEBP_EFFORT", 5), // 0 (fast) – 6 (smallest)
    maxDimension: int("IMAGE_MAX_DIMENSION", 2560), // longest side of the stored original
    // Extra sizes for srcset so phones never download the desktop image
    variantWidths: (optional("IMAGE_VARIANT_WIDTHS", "320,640,1024,1600"))
      .split(",")
      .map((w) => Number(w.trim()))
      .filter((w) => Number.isInteger(w) && w > 0)
      .sort((a, b) => a - b),
  },

  admin: {
    lockAfterFailedLogins: 5, // document §13.1
    lockMinutes: int("ADMIN_LOCK_MINUTES", 15),
    inviteExpiryHours: int("ADMIN_INVITE_EXPIRY_HOURS", 72),
    resetExpiryMinutes: int("ADMIN_RESET_EXPIRY_MINUTES", 60),
  },

  // Storefront email + password sign-in
  customer: {
    lockAfterFailedLogins: 5,
    lockMinutes: int("CUSTOMER_LOCK_MINUTES", 15),
    // "Forgot password" link lifetime, and the minimum gap between two reset emails
    resetExpiryMinutes: int("CUSTOMER_RESET_EXPIRY_MINUTES", 30),
    resetCooldownSeconds: int("CUSTOMER_RESET_COOLDOWN_SECONDS", 60),
  },

  // Razorpay Payment Gateway
  razorpay: {
    keyId: optional("RAZORPAY_KEY_ID", "rzp_test_TmsfO3hloFEA31"),
    keySecret: optional("RAZORPAY_KEY_SECRET", "1xt3UXSTLfyVhQa3G9SSVIKY"),
  },
};

export default env;
