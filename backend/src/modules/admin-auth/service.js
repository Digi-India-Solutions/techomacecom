import prisma from "../../../db/db.js";
import env from "../../../config/env.js";
import { ApiError } from "../../lib/http.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { randomToken, sha256 } from "../../lib/tokens.js";
import { sendMail, actionEmail } from "../../lib/mailer.js";
import { getRolePermissions } from "../../rbac/permission.service.js";
import { revokeAllSessions } from "../../services/session.service.js";
import { storeAvatar, discardAvatar } from "../../services/avatar.service.js";
import { publicUrl } from "../../lib/storage.js";
import { paginate } from "../../lib/list.js";
import { SUPER_ADMIN_SLUG } from "../../rbac/catalog.js";

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Shape the admin UI expects (types/admin AdminUser) plus the permission list. */
export async function toAdminDto(admin) {
  const permissions = await getRolePermissions(admin.role);
  return {
    user: {
      id: String(admin.id),
      name: admin.name,
      email: admin.email,
      phone: admin.mobile || "",
      department: admin.department || "",
      role: admin.role.slug,
      roleId: String(admin.role.id),
      roleLabel: admin.role.name,
      avatarInitials: initials(admin.name),
      avatarUrl: publicUrl(admin.avatar_url),
      status: admin.status,
      isSuperAdmin: admin.role.slug === SUPER_ADMIN_SLUG,
      lastLoginAt: admin.last_login_at,
      passwordChangedAt: admin.password_changed_at,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    },
    permissions: [...permissions].sort(),
  };
}

const INVALID = () => ApiError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS");

/** Document §13.1: email + password (argon2); lock after 5 failed logins. */
export async function login({ email, password }) {
  const admin = await prisma.adminUser.findUnique({ where: { email }, include: { role: true } });

  if (!admin) {
    await verifyPassword(null, password); // same timing as a real check
    throw INVALID();
  }

  if (admin.locked_until && admin.locked_until > new Date()) {
    const minutes = Math.ceil((admin.locked_until.getTime() - Date.now()) / 60000);
    throw new ApiError(423, "ACCOUNT_LOCKED", `Too many failed attempts. Account locked for ${minutes} more minute${minutes === 1 ? "" : "s"}.`);
  }

  const valid = await verifyPassword(admin.password_hash, password);
  if (!valid) {
    const attempts = admin.failed_login_attempts + 1;
    const lock = attempts >= env.admin.lockAfterFailedLogins;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: lock
        ? { failed_login_attempts: 0, locked_until: new Date(Date.now() + env.admin.lockMinutes * 60000) }
        : { failed_login_attempts: attempts },
    });
    if (lock) {
      throw new ApiError(423, "ACCOUNT_LOCKED", `Too many failed attempts. Account locked for ${env.admin.lockMinutes} minutes.`);
    }
    throw INVALID();
  }

  if (admin.status !== "active") {
    throw ApiError.forbidden("Your account is deactivated. Contact a Super Admin.", "ACCOUNT_INACTIVE");
  }

  return prisma.adminUser.update({
    where: { id: admin.id },
    data: { failed_login_attempts: 0, locked_until: null, last_login_at: new Date() },
    include: { role: true },
  });
}

export async function loadActiveAdmin(id) {
  const admin = await prisma.adminUser.findUnique({ where: { id }, include: { role: true } });
  return admin && admin.status === "active" ? admin : null;
}

const PROFILE_FIELDS = { name: "Name", mobile: "Mobile", department: "Department" };

/** Updates own name / mobile / department. Returns the admin and what changed (for the audit log). */
export async function updateMe(admin, input) {
  const data = {};
  for (const key of Object.keys(PROFILE_FIELDS)) {
    if (input[key] === undefined) continue;
    const next = input[key] === "" ? null : input[key];
    if (next !== (admin[key] ?? null)) data[key] = next;
  }
  if (!Object.keys(data).length) return { admin, changes: [] };

  const updated = await prisma.adminUser.update({ where: { id: admin.id }, data, include: { role: true } });
  const changes = Object.keys(data).map((key) => ({ field: PROFILE_FIELDS[key], from: admin[key] ?? null, to: data[key] }));
  return { admin: updated, changes };
}

/** Replaces the profile photo (old file deleted). */
export async function setAvatar(admin, file) {
  const path = await storeAvatar(file);
  const updated = await prisma.adminUser.update({ where: { id: admin.id }, data: { avatar_url: path }, include: { role: true } });
  await discardAvatar(admin.avatar_url);
  return updated;
}

export async function removeAvatar(admin) {
  if (!admin.avatar_url) return admin;
  const updated = await prisma.adminUser.update({ where: { id: admin.id }, data: { avatar_url: null }, include: { role: true } });
  await discardAvatar(admin.avatar_url);
  return updated;
}

/** The signed-in staff member's own audit trail (no activity.view permission needed). */
export async function listMyActivity(admin, { page, limit }) {
  const { rows, meta } = await paginate(prisma.activityLog, {
    where: { admin_user_id: admin.id },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    page,
    limit,
  });
  return {
    rows: rows.map((r) => ({
      id: String(r.id),
      timestamp: r.created_at,
      module: r.module,
      action: r.action,
      recordLabel: r.entity_label || (r.entity_type ? `${r.entity_type} #${r.entity_id}` : ""),
      summary: r.summary || "",
      ipAddress: r.ip_address || null,
    })),
    meta,
  };
}

export async function changePassword(admin, { currentPassword, newPassword }, currentJti) {
  if (!(await verifyPassword(admin.password_hash, currentPassword))) {
    throw ApiError.badRequest("Your current password is incorrect", "WRONG_PASSWORD", { currentPassword: "Incorrect password" });
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest("Choose a password different from your current one", "SAME_PASSWORD");
  }
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { password_hash: await hashPassword(newPassword), password_changed_at: new Date() },
  });
  // Sign out every other device
  await revokeAllSessions("admin", admin.id, { exceptJti: currentJti });
}

/**
 * Creates a one-time link for "set your password" (new staff) or "reset password".
 * Returns the URL; only its SHA-256 is stored.
 */
export async function createPasswordLink(adminId, { invite = false } = {}) {
  const token = randomToken(32);
  const minutes = invite ? env.admin.inviteExpiryHours * 60 : env.admin.resetExpiryMinutes;
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { password_reset_token_hash: sha256(token), password_reset_expires_at: new Date(Date.now() + minutes * 60000) },
  });
  return `${env.adminUrl}/admin/reset-password?token=${token}${invite ? "&invite=1" : ""}`;
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

export async function emailPasswordLink(admin, url, { invite = false } = {}) {
  const mail = invite
    ? actionEmail({
        heading: "You have been added to Buy Denmed Admin",
        intro: `Hi ${escapeHtml(admin.name)}, an account was created for you (${escapeHtml(admin.email)}). Set your password to sign in.`,
        buttonLabel: "Set my password",
        url,
        footer: `This link expires in ${env.admin.inviteExpiryHours} hours.`,
      })
    : actionEmail({
        heading: "Reset your Buy Denmed Admin password",
        intro: `Hi ${escapeHtml(admin.name)}, we received a request to reset your password.`,
        buttonLabel: "Reset password",
        url,
        footer: `This link expires in ${env.admin.resetExpiryMinutes} minutes. If you did not ask for this, ignore this email.`,
      });
  const result = await sendMail({
    to: admin.email,
    subject: invite ? "Set your Buy Denmed Admin password" : "Reset your Buy Denmed Admin password",
    ...mail,
  });
  if (!result.sent && !env.isProduction) {
    console.log(`\n🔑  ${invite ? "Invite" : "Reset"} link for ${admin.email}:\n    ${url}\n`);
  }
  return result;
}

/** Always succeeds from the caller's view, so it cannot be used to find staff emails. */
export async function forgotPassword(email) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || admin.status !== "active") return;
  const url = await createPasswordLink(admin.id);
  await emailPasswordLink(admin, url);
}

export async function resetPassword({ token, password }) {
  const admin = await prisma.adminUser.findFirst({
    where: { password_reset_token_hash: sha256(token), password_reset_expires_at: { gt: new Date() } },
  });
  if (!admin) throw ApiError.badRequest("This link has expired or was already used. Request a new one.", "RESET_LINK_INVALID");
  if (admin.status !== "active") throw ApiError.forbidden("Your account is deactivated. Contact a Super Admin.", "ACCOUNT_INACTIVE");

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      password_hash: await hashPassword(password),
      password_changed_at: new Date(),
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      failed_login_attempts: 0,
      locked_until: null,
    },
  });
  await revokeAllSessions("admin", admin.id);
  return admin;
}
