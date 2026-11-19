import "./config/load-env.js";
import { defineConfig } from "prisma/config";
import { buildDatabaseUrl } from "./db/config.js";

// The Prisma CLI (migrate, studio, db push) needs a connection string.
// We build it here from the individual DB_* variables so you never have to
// put a DATABASE_URL in .env yourself.
try {
  process.env.DATABASE_URL = buildDatabaseUrl();
} catch (e) {
  // Silently ignore if DB variables are not yet provided so commands
  // that don't need a live DB (like `prisma generate` during npm install) still work.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
});
