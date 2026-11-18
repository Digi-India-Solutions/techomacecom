import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Loads backend/.env — ONE file for local and production — and resolves
 * environment-specific values automatically.
 *
 * Any variable can have two versions:
 *   DB_PASSWORD_LOCAL=…        used when NODE_ENV is not "production" (npm run dev, db:migrate, …)
 *   DB_PASSWORD_PRODUCTION=…   used when NODE_ENV=production        (npm start, db:deploy, …:prod)
 * The matching one is copied to the plain name (DB_PASSWORD), so the rest of the
 * code only ever reads process.env.DB_PASSWORD. Variables without a suffix are shared.
 *
 * A plain variable set by the server itself (shell, PM2, systemd) always wins.
 *
 * Import this first, instead of "dotenv/config":  import "./config/load-env.js";
 */

const preset = new Set(Object.keys(process.env)); // set outside .env → never overridden

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

export const APP_ENV = process.env.NODE_ENV === "production" ? "production" : "development";
const SUFFIX = APP_ENV === "production" ? "_PRODUCTION" : "_LOCAL";

for (const [key, value] of Object.entries(process.env)) {
  if (!key.endsWith(SUFFIX) || value === undefined || value === "") continue;
  const base = key.slice(0, -SUFFIX.length);
  if (!preset.has(base)) process.env[base] = value;
}

/** For error messages: "DB_PASSWORD_PRODUCTION (or DB_PASSWORD)" */
export const envKeyHint = (name) => `${name}${SUFFIX} (or ${name})`;
