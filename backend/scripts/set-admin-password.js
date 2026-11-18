/**
 * Sets SUPER_ADMIN_PASSWORD from .env on the SUPER_ADMIN_EMAIL account and unlocks it.
 * (db:seed never overwrites an existing password, so use this after changing .env.)
 *
 *   npm run admin:set-password
 */
import "../config/load-env.js";
import prisma from "../db/db.js";
import { hashPassword, PASSWORD_RULE } from "../src/lib/password.js";
import { revokeAllSessions } from "../src/services/session.service.js";

const email = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD || "";

try {
  if (!email || !password) throw new Error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env");
  if (!PASSWORD_RULE.regex.test(password)) throw new Error(`SUPER_ADMIN_PASSWORD: ${PASSWORD_RULE.message}`);
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) throw new Error(`No admin with email ${email}. Run: npm run db:seed`);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      password_hash: await hashPassword(password),
      password_changed_at: new Date(),
      status: "active",
      failed_login_attempts: 0,
      locked_until: null,
    },
  });
  await revokeAllSessions("admin", admin.id);
  console.log(`✔ Password updated and account unlocked for ${email}`);
} catch (error) {
  console.error("✖", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
