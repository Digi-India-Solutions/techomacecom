import "../config/load-env.js";
import pg from 'pg';
import { getDbConfig } from '../db/config.js';

const client = new pg.Client(getDbConfig());

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  const queries = [
    `ALTER TABLE "email_otps" ALTER COLUMN "email" TYPE VARCHAR(255) USING "email"::text;`,
    `ALTER TABLE "customers" ALTER COLUMN "email" TYPE VARCHAR(255) USING "email"::text;`,
    `ALTER TABLE "admin_users" ALTER COLUMN "email" TYPE VARCHAR(255) USING "email"::text;`,
    `ALTER TABLE "enquiries" ALTER COLUMN "email" TYPE VARCHAR(255) USING "email"::text;`,
    `DROP EXTENSION IF EXISTS citext CASCADE;`,
  ];

  for (const q of queries) {
    try {
      console.log('Executing:', q);
      await client.query(q);
      console.log('SUCCESS');
    } catch (err) {
      console.warn('Query warning/error:', err.message);
    }
  }

  // Verify column data types in information_schema
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE column_name = 'email' AND table_name IN ('email_otps', 'customers', 'admin_users', 'enquiries');
  `);
  console.log('Updated columns:');
  console.table(res.rows);

  await client.end();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

