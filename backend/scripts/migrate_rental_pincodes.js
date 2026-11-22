import prisma from "../db/db.js";

async function main() {
  console.log("Creating rental_serviceable_pincodes table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS rental_serviceable_pincodes (
      pincode CHAR(6) PRIMARY KEY,
      city VARCHAR(80),
      state VARCHAR(80),
      cod_available BOOLEAN DEFAULT false,
      delivery_days VARCHAR(30),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_rental_serviceable_pincodes_state ON rental_serviceable_pincodes(state);
  `);

  const res = await prisma.$queryRawUnsafe("SELECT to_regclass('public.rental_serviceable_pincodes')::text as exists;");
  console.log("rental_serviceable_pincodes created:", res);
}

main().catch(console.error).finally(() => prisma.$disconnect());

