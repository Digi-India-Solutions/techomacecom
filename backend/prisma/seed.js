/**
 * Seed — document §14 step 1: roles, permissions, settings, warehouse.
 * Safe to run again: it only adds what is missing and never overwrites
 * permissions an admin has edited or passwords that have been set.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import crypto from "node:crypto";
import prisma from "../db/db.js";
import { MODULES, ACTIONS, SYSTEM_ROLES, SUPER_ADMIN_SLUG } from "../src/rbac/catalog.js";
import { hashPassword, PASSWORD_RULE } from "../src/lib/password.js";

async function seedPermissions() {
  let created = 0;
  for (const m of MODULES) {
    for (const action of ACTIONS) {
      const code = `${m.key}.${action}`;
      const existing = await prisma.permission.findUnique({ where: { code } });
      if (!existing) {
        await prisma.permission.create({ data: { module: m.key, action, code } });
        created++;
      }
    }
  }
  console.log(`✔ permissions: ${MODULES.length * ACTIONS.length} total (${created} new)`);
}

async function seedRoles() {
  const permissions = await prisma.permission.findMany({ select: { id: true, code: true } });
  const idByCode = new Map(permissions.map((p) => [p.code, p.id]));

  for (const def of SYSTEM_ROLES) {
    let role = await prisma.role.findUnique({ where: { slug: def.slug } });
    const codes = def.permissions();

    if (!role) {
      role = await prisma.role.create({
        data: {
          slug: def.slug,
          name: def.name,
          description: def.description,
          is_system: true,
          role_permissions: { create: codes.map((c) => ({ permission_id: idByCode.get(c) })) },
        },
      });
      console.log(`✔ role created: ${def.name} (${codes.length} permissions)`);
    } else if (def.slug === SUPER_ADMIN_SLUG) {
      // Super Admin always gets new permissions added (e.g. after a new module is added).
      const have = new Set(
        (await prisma.rolePermission.findMany({ where: { role_id: role.id }, select: { permission_id: true } })).map(
          (r) => r.permission_id.toString()
        )
      );
      const missing = codes.map((c) => idByCode.get(c)).filter((id) => !have.has(id.toString()));
      if (missing.length) {
        await prisma.rolePermission.createMany({ data: missing.map((permission_id) => ({ role_id: role.id, permission_id })) });
      }
      console.log(`✔ role exists: ${role.name}${missing.length ? ` (+${missing.length} new permissions)` : ""}`);
    } else {
      console.log(`✔ role exists: ${role.name} (permissions left as edited in admin)`);
    }
  }
}

async function seedSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!email) {
    console.log("• SUPER_ADMIN_EMAIL not set — skipping the first Super Admin account");
    return;
  }
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`✔ super admin exists: ${email}`);
    return;
  }

  let password = process.env.SUPER_ADMIN_PASSWORD || "";
  let generated = false;
  if (!password) {
    password = `Bd-${crypto.randomBytes(9).toString("base64url")}9`;
    generated = true;
  } else if (!PASSWORD_RULE.regex.test(password)) {
    throw new Error(`SUPER_ADMIN_PASSWORD: ${PASSWORD_RULE.message}`);
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { slug: SUPER_ADMIN_SLUG } });
  await prisma.adminUser.create({
    data: {
      name: process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin",
      email,
      role_id: role.id,
      status: "active",
      password_hash: await hashPassword(password),
      password_changed_at: new Date(),
    },
  });
  console.log(`✔ super admin created: ${email}`);
  if (generated) {
    console.log(`  Temporary password (shown once): ${password}`);
    console.log("  Sign in and change it from Staff & Roles → My Profile.");
  }
}

async function seedWarehouse() {
  await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {},
    create: { name: "Main Warehouse", code: "MAIN", is_active: true },
  });
  console.log("✔ warehouse: Main Warehouse (MAIN)");
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedSuperAdmin();
  await seedWarehouse();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
