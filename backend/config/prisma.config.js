import "dotenv/config";
import { defineConfig } from "prisma/config";
import { buildDatabaseUrl } from "../db/config.js";

// The Prisma CLI (migrate, studio, db push) needs a connection string.
// We build it here from the individual DB_* variables so you never have to
// put a DATABASE_URL in .env yourself.
process.env.DATABASE_URL = buildDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
