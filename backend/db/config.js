import { envKeyHint } from "../config/load-env.js";

const REQUIRED = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

/**
 * Reads the individual PostgreSQL settings from environment variables.
 * Throws a clear error if any are missing.
 */
export function getDbConfig() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing database environment variables: ${missing.map(envKeyHint).join(", ")}. ` +
        "Set them in backend/.env (see .env.example)."
    );
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX) || 10,
  };
}

/**
 * Builds a connection string for the Prisma CLI only (migrations / studio).
 * The running app does not use this — it connects with getDbConfig().
 */
export function buildDatabaseUrl() {
  const { host, port, user, password, database, ssl } = getDbConfig();
  const params = new URLSearchParams({ schema: process.env.DB_SCHEMA || "public" });
  if (ssl) params.set("sslmode", "require");

  return (
    `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}` +
    `@${host}:${port}/${encodeURIComponent(database)}?${params}`
  );
}
