import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDbConfig } from "./config.js";

// Connect with individual host / port / user / password / database values
// (no connection URL) through the node-postgres driver adapter.
const adapter = new PrismaPg(getDbConfig(), {
  schema: process.env.DB_SCHEMA || "public",
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function connectDB() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log(
    `Database connected: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  );
}

export async function disconnectDB() {
  await prisma.$disconnect();
}

export default prisma;
