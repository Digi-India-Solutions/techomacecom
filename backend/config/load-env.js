import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Loads backend/.env — ONE file for local and production — and resolves
 * environment-specific values automatically.
 *
 * Any variable can have two versions:
 *   KEY_LOCAL=…        used when running in development (npm run dev, db:migrate, …)
 *   KEY_PRODUCTION=…   used when running in production  (npm start, db:deploy, …:prod)
 * The matching one is copied to the plain name (e.g. process.env.KEY).
 * If a production key is empty or missing, it automatically falls back to the local key.
 *
 * Environment can be switched via:
 * 1. NODE_ENV in .env: NODE_ENV=development or NODE_ENV=production
 * 2. APP_ENV in .env: APP_ENV=local or APP_ENV=production
 * 3. Process environment variable from command line or PM2
 */

const preset = new Set(Object.keys(process.env)); // set outside .env → never overridden

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

// Check environment switch
const detectedEnv = (process.env.NODE_ENV || process.env.APP_ENV || process.env.ENVIRONMENT || "development")
  .trim()
  .toLowerCase();
export const isProduction = detectedEnv === "production" || detectedEnv === "prod";
export const APP_ENV = isProduction ? "production" : "development";
process.env.NODE_ENV = APP_ENV;

const SUFFIX = isProduction ? "_PRODUCTION" : "_LOCAL";
const FALLBACK_SUFFIX = isProduction ? "_LOCAL" : "_PRODUCTION";

// 1. Copy exact matching environment suffix (e.g. KEY_PRODUCTION or KEY_LOCAL)
for (const [key, value] of Object.entries(process.env)) {
  if (!key.endsWith(SUFFIX) || value === undefined) continue;
  const trimmed = typeof value === "string" ? value.trim() : value;
  if (trimmed === "") continue;
  const base = key.slice(0, -SUFFIX.length);
  if (!preset.has(base)) {
    process.env[base] = trimmed;
  }
}

// 2. Fallback: If a variable was NOT set by the primary suffix, check the opposite suffix
for (const [key, value] of Object.entries(process.env)) {
  if (!key.endsWith(FALLBACK_SUFFIX) || value === undefined) continue;
  const trimmed = typeof value === "string" ? value.trim() : value;
  if (trimmed === "") continue;
  const base = key.slice(0, -FALLBACK_SUFFIX.length);
  if (!preset.has(base) && (process.env[base] === undefined || process.env[base] === "")) {
    process.env[base] = trimmed;
  }
}

/** For error messages: "DB_PASSWORD_PRODUCTION (or DB_PASSWORD)" */
export const envKeyHint = (name) => `${name}${SUFFIX} (or ${name})`;
