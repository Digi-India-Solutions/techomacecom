import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma, { connectDB, disconnectDB } from "./db/db.js";
import { corsOptions, allowedOrigins } from "./config/cors.js";

const app = express();
const PORT = Number(process.env.PORT);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

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
      console.log(`Server running on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`);
      console.log(`CORS allowed origins: ${allowedOrigins.join(", ") || "none"}`);
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
