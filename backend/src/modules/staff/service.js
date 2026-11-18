import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { ACTIONS, MODULES, SUPER_ADMIN_SLUG, ALL_PERMISSION_CODES } from "../../rbac/catalog.js";
import { codesToMatrix, matrixToCodes, invalidateRolePermissions } from "../../rbac/permission.service.js";
import { revokeAllSessions } from "../../services/session.service.js";
import { createPasswordLink, emailPasswordLink } from "../admin-auth/service.js";
import { listMeta } from "../../lib/list.js";

// ---------------------------------------------------------------------------
// Roles & permissions
// ---------------------------------------------------------------------------

function toRoleDto(role) {
  const codes =
    role.slug === SUPER_ADMIN_SLUG
      ? new Set(ALL_PERMISSION_CODES)
      : new Set(role.role_permissions.map((rp) => rp.permission.code));
  return {
    id: String(role.id),
    key: role.slug,
    name: role.name,
    description: role.description || "",
    isDefault: role.is_system,
    isLocked: role.slug === SUPER_ADMIN_SLUG, // matrix cannot be changed
    staffCount: role._count?.admin_users ?? 0,
    matrix: codesToMatrix(codes, MODULES, ACTIONS),
  };
}

const roleInclude = {
  role_permissions: { include: { permission: { select: { code: true } } } },
  _count: { select: { admin_users: true } },
};

export function listPermissionCatalog() {
  return { modules: MODULES, actions: ACTIONS };
}

export async function listRoles() {
  const roles = await prisma.role.findMany({
    include: roleInclude,
    orderBy: [{ is_system: "desc" }, { id: "asc" }],
  });
  return roles.map(toRoleDto);
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

async function uniqueSlug(name) {
  const base = slugify(name) || "role";
  let slug = base;
  for (let i = 2; await prisma.role.findUnique({ where: { slug } }); i++) slug = `${base}_${i}`;
  return slug;
}

async function permissionIdsFor(codes) {
  if (!codes.length) return [];
  const rows = await prisma.permission.findMany({ where: { code: { in: codes } }, select: { id: true } });
  return rows.map((r) => r.id);
}

export async function createRole({ name, description, matrix }) {
  const codes = matrixToCodes(matrix, MODULES, ACTIONS);
  const ids = await permissionIdsFor(codes);
  const role = await prisma.role.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      description,
      is_system: false,
      role_permissions: { create: ids.map((permission_id) => ({ permission_id })) },
    },
    include: roleInclude,
  });
  return { role: toRoleDto(role), granted: codes.length };
}

export async function updateRole(id, { name, description, matrix }, actor) {
  const role = await prisma.role.findUnique({ where: { id }, include: roleInclude });
  if (!role) throw ApiError.notFound("Role not found");

  const before = new Set(role.role_permissions.map((rp) => rp.permission.code));

  if (role.slug === SUPER_ADMIN_SLUG) {
    // Name / description only — Super Admin always keeps every permission.
    const updated = await prisma.role.update({ where: { id }, data: { name, description }, include: roleInclude });
    return { role: toRoleDto(updated), added: [], removed: [] };
  }

  // Nobody can lock themselves out of Staff & Roles by editing their own role.
  const codes = matrixToCodes(matrix, MODULES, ACTIONS);
  if (actor.role_id === role.id && !codes.includes("staff.edit")) {
    throw ApiError.badRequest("You cannot remove Staff & Roles → Edit from your own role.", "SELF_LOCKOUT");
  }

  const ids = await permissionIdsFor(codes);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { role_id: id } });
    if (ids.length) {
      await tx.rolePermission.createMany({ data: ids.map((permission_id) => ({ role_id: id, permission_id })) });
    }
    return tx.role.update({ where: { id }, data: { name, description }, include: roleInclude });
  });
  invalidateRolePermissions(id);

  const after = new Set(codes);
  return {
    role: toRoleDto(updated),
    added: codes.filter((c) => !before.has(c)),
    removed: [...before].filter((c) => !after.has(c)),
  };
}

export async function deleteRole(id) {
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { admin_users: true } } } });
  if (!role) throw ApiError.notFound("Role not found");
  if (role.is_system) throw ApiError.badRequest("Default roles cannot be deleted.", "SYSTEM_ROLE");
  if (role._count.admin_users > 0) {
    throw ApiError.conflict(
      `${role._count.admin_users} staff member${role._count.admin_users === 1 ? " has" : "s have"} this role. Move them to another role first.`,
      "ROLE_IN_USE"
    );
  }
  await prisma.role.delete({ where: { id } });
  invalidateRolePermissions(id);
  return role;
}

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------

function toStaffDto(a) {
  return {
    id: String(a.id),
    name: a.name,
    email: a.email,
    mobile: a.mobile || "",
    roleId: String(a.role_id),
    roleKey: a.role.slug,
    roleName: a.role.name,
    department: a.department || "",
    status: a.status,
    lastLoginAt: a.last_login_at,
    passwordSet: Boolean(a.password_hash),
    lockedUntil: a.locked_until && a.locked_until > new Date() ? a.locked_until : null,
    createdAt: a.created_at,
  };
}

export async function listStaff() {
  const rows = await prisma.adminUser.findMany({ include: { role: true }, orderBy: { created_at: "asc" } });
  return rows.map(toStaffDto);
}

async function activeSuperAdminCount(excludeId) {
  return prisma.adminUser.count({
    where: { status: "active", role: { slug: SUPER_ADMIN_SLUG }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
}

/** Only a Super Admin may create, promote to, or edit a Super Admin. */
function assertCanTouchSuperAdmin(actor, { targetRole, currentRole }) {
  const actorIsSuper = actor.role.slug === SUPER_ADMIN_SLUG;
  if (!actorIsSuper && (targetRole?.slug === SUPER_ADMIN_SLUG || currentRole?.slug === SUPER_ADMIN_SLUG)) {
    throw ApiError.forbidden("Only a Super Admin can manage Super Admin accounts.", "SUPER_ADMIN_ONLY");
  }
}

export async function createStaff(data, actor) {
  const role = await prisma.role.findUnique({ where: { id: BigInt(data.roleId) } });
  if (!role) throw ApiError.badRequest("Choose a valid role", "INVALID_ROLE", { roleId: "Role not found" });
  assertCanTouchSuperAdmin(actor, { targetRole: role });

  const admin = await prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email,
      mobile: data.mobile || null,
      department: data.department || null,
      status: data.status,
      role_id: role.id,
      password_hash: null, // set by the invite link
    },
    include: { role: true },
  });

  const url = await createPasswordLink(admin.id, { invite: true });
  const mail = await emailPasswordLink(admin, url, { invite: true });
  return { staff: toStaffDto(admin), inviteSent: mail.sent, inviteUrl: url };
}

export async function updateStaff(id, data, actor) {
  const current = await prisma.adminUser.findUnique({ where: { id }, include: { role: true } });
  if (!current) throw ApiError.notFound("Staff member not found");

  const role = await prisma.role.findUnique({ where: { id: BigInt(data.roleId) } });
  if (!role) throw ApiError.badRequest("Choose a valid role", "INVALID_ROLE", { roleId: "Role not found" });
  assertCanTouchSuperAdmin(actor, { targetRole: role, currentRole: current.role });

  const isSelf = current.id === actor.id;
  if (isSelf && role.id !== current.role_id) throw ApiError.badRequest("You cannot change your own role.", "SELF_ROLE_CHANGE");
  if (isSelf && data.status === "inactive") throw ApiError.badRequest("You cannot deactivate your own account.", "SELF_DEACTIVATE");

  const losingSuper =
    current.role.slug === SUPER_ADMIN_SLUG && (role.slug !== SUPER_ADMIN_SLUG || data.status === "inactive");
  if (losingSuper && (await activeSuperAdminCount(current.id)) === 0) {
    throw ApiError.badRequest("There must always be at least one active Super Admin.", "LAST_SUPER_ADMIN");
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      mobile: data.mobile || null,
      department: data.department || null,
      status: data.status,
      role_id: role.id,
    },
    include: { role: true },
  });
  if (data.status === "inactive" && current.status === "active") await revokeAllSessions("admin", id);

  return { before: toStaffDto(current), after: toStaffDto(updated) };
}

export async function toggleStaffStatus(id, actor) {
  const current = await prisma.adminUser.findUnique({ where: { id }, include: { role: true } });
  if (!current) throw ApiError.notFound("Staff member not found");
  assertCanTouchSuperAdmin(actor, { currentRole: current.role });
  if (current.id === actor.id) throw ApiError.badRequest("You cannot deactivate your own account.", "SELF_DEACTIVATE");

  const next = current.status === "active" ? "inactive" : "active";
  if (next === "inactive" && current.role.slug === SUPER_ADMIN_SLUG && (await activeSuperAdminCount(current.id)) === 0) {
    throw ApiError.badRequest("There must always be at least one active Super Admin.", "LAST_SUPER_ADMIN");
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: { status: next, ...(next === "active" ? { failed_login_attempts: 0, locked_until: null } : {}) },
    include: { role: true },
  });
  if (next === "inactive") await revokeAllSessions("admin", id);
  return toStaffDto(updated);
}

export async function sendStaffPasswordReset(id, actor) {
  const admin = await prisma.adminUser.findUnique({ where: { id }, include: { role: true } });
  if (!admin) throw ApiError.notFound("Staff member not found");
  assertCanTouchSuperAdmin(actor, { currentRole: admin.role });
  if (admin.status !== "active") throw ApiError.badRequest("Activate this account before sending a reset link.", "ACCOUNT_INACTIVE");

  const invite = !admin.password_hash;
  const url = await createPasswordLink(admin.id, { invite });
  const mail = await emailPasswordLink(admin, url, { invite });
  return { admin, sent: mail.sent, url, invite };
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export async function listActivity({ staffId, module, dateFrom, dateTo, page, limit }) {
  const where = {};
  if (staffId && staffId !== "all" && /^\d+$/.test(staffId)) where.admin_user_id = BigInt(staffId);
  if (module && module !== "all") where.module = { equals: module, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.created_at = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00+05:30`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999+05:30`) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { admin_user: { select: { id: true, name: true } } },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: String(r.id),
      timestamp: r.created_at,
      staffId: r.admin_user ? String(r.admin_user.id) : "",
      staffName: r.admin_user?.name || "System",
      module: r.module,
      action: r.action,
      recordLabel: r.entity_label || (r.entity_type ? `${r.entity_type} #${r.entity_id}` : ""),
      recordHref: "",
      changesSummary: r.summary || "",
    })),
    meta: listMeta(page, limit, total),
  };
}
