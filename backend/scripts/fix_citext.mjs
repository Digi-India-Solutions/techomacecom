import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new pg.Client({
  host: process.env.DB_HOST_LOCAL || 'localhost',
  port: Number(process.env.DB_PORT_LOCAL) || 5432,
  user: process.env.DB_USER_LOCAL || 'postgres',
  password: process.env.DB_PASSWORD_LOCAL || '1234',
  database: process.env.DB_NAME_LOCAL || 'TECHOMACECOM',
});

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

