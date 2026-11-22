import prisma from "../db/db.js";

async function main() {
  console.log("Applying missing tables and columns migration...");

  // 1. rental_kyc_documents table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS rental_kyc_documents (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      rental_id BIGINT REFERENCES rentals(id) ON DELETE CASCADE,
      doc_type VARCHAR(40) NOT NULL,
      file_path TEXT NOT NULL,
      file_name VARCHAR(200) NOT NULL,
      mime_type VARCHAR(60) NOT NULL,
      size_bytes INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'uploaded',
      reject_reason TEXT,
      reviewed_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_rental_kyc_documents_rental_id ON rental_kyc_documents(rental_id);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_rental_kyc_documents_customer_id ON rental_kyc_documents(customer_id);
  `);
  console.log("✓ rental_kyc_documents table created/verified.");

  // 2. return_status_history table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS return_status_history (
      id BIGSERIAL PRIMARY KEY,
      return_id BIGINT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id BIGINT,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_return_status_history_return_id ON return_status_history(return_id);
  `);
  console.log("✓ return_status_history table created/verified.");

  // 3. rentals table missing columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS advance_percent SMALLINT NOT NULL DEFAULT 100;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS advance_paise BIGINT NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS balance_due TEXT NOT NULL DEFAULT 'before_dispatch';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS kyc_required_docs TEXT[] NOT NULL DEFAULT '{}';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS kyc_status TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS kyc_note TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS kyc_reviewed_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS return_requested_on DATE;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS notes_internal TEXT;
  `);
  console.log("✓ rentals columns added/verified.");

  // 4. returns table missing columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'refund';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS customer_note TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS requested_amount_paise BIGINT NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_account TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
  `);
  console.log("✓ returns columns added/verified.");

  // 5. return_items table missing columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE return_items ADD COLUMN IF NOT EXISTS refund_amount_paise BIGINT NOT NULL DEFAULT 0;
  `);
  console.log("✓ return_items columns added/verified.");

  // 6. admin_notifications table missing columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS message TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS severity VARCHAR(10) NOT NULL DEFAULT 'info';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS link VARCHAR(300);
  `);
  console.log("✓ admin_notifications columns added/verified.");

  console.log("All missing tables and columns successfully applied!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

