import "./config/load-env.js"; // one .env, *_LOCAL / *_PRODUCTION picked automatically
import "./src/lib/serialize.js"; // BigInt → JSON (must load before any response is sent)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import prisma, { connectDB, disconnectDB } from "./db/db.js";
import { corsOptions, allowedOrigins } from "./config/cors.js";
import { UPLOADS_ROOT, UPLOADS_URL_PREFIX } from "./src/lib/storage.js";
import apiRoutes from "./src/routes.js";
import { notFoundHandler, errorHandler } from "./src/middlewares/error.js";

const app = express();
const PORT = env.port;

// Behind Nginx in production (document §13.3): trust X-Forwarded-For for req.ip
if (env.isProduction) app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check — reports server uptime and database reachability
app.get("/health", async (req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: "up",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      ...health,
      status: "error",
      database: "down",
      error: describeError(error),
    });
  }
});

// Uploaded images (WebP). File names are random and never reused, so browsers and
// CDNs may cache them forever. In production Nginx should serve this folder directly.
app.use(
  UPLOADS_URL_PREFIX,
  express.static(UPLOADS_ROOT, {
    immutable: true,
    maxAge: "365d",
    index: false,
    dotfiles: "deny",
    setHeaders(res) {
      // helmet defaults to same-origin; the storefront (another origin) must be able to load these
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// API — document §12: everything under /api/v1
app.use("/api/v1", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Prisma adapter errors often have an empty message but a useful code (e.g. ECONNREFUSED)
function describeError(error) {
  const message = error.message
    ?.split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("Invalid `prisma"))
    .pop();
  return [error.code, message].filter(Boolean).join(": ") || "Unknown error";
}

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} (${env.nodeEnv})`);
      console.log(`API base: http://localhost:${PORT}/api/v1`);
      console.log(`CORS allowed origins: ${allowedOrigins.join(", ") || "none"}`);
      if (!env.google.clientId) console.log("Google sign-in: off (set GOOGLE_CLIENT_ID to enable)");
      if (env.sms.provider === "console") console.log("OTP SMS: printed to this console (SMS_PROVIDER=console)");
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", describeError(error));
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

start();

export default app;
