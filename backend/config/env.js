import "dotenv/config";

/**
 * Every environment variable the API reads, in one place.
 * Required values throw at startup so a missing secret never fails silently later.
 */

const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable ${name} (see backend/.env.example)`);
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

const jwtSecret = required("JWT_SECRET_KEY");
const refreshSecret = required("REFRESH_TOKEN_SECRET");
if (isProduction && (jwtSecret.length < 32 || refreshSecret.length < 32 || jwtSecret === refreshSecret)) {
  throw new Error("JWT_SECRET_KEY and REFRESH_TOKEN_SECRET must be different and at least 32 characters in production");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port: int("PORT", 5001),

  frontendUrl: optional("FRONTEND_URL", "http://localhost:3000").replace(/\/+$/, ""),
  adminUrl: optional("ADMIN_URL", "http://localhost:3001").replace(/\/+$/, ""),

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
    publicBaseUrl: (optional("ASSET_BASE_URL") || `http://localhost:${int("PORT", 5001)}`).replace(/\/+$/, ""),
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
};

export default env;
