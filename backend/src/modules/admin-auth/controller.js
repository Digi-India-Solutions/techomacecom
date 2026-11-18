import { ok } from "../../lib/http.js";
import { setAuthCookies, clearAuthCookies, readRefreshToken, verifyRefreshToken } from "../../lib/tokens.js";
import {
  issueTokens,
  rotateRefreshToken,
  revokeByRefreshToken,
  currentSessionJti,
  listActiveSessions,
  revokeSessionById,
  revokeOtherSessions,
} from "../../services/session.service.js";
import { ApiError } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

const roleClaims = (admin) => ({ role: admin.role.slug });

/** POST /admin/auth/login */
export async function login(req, res) {
  const admin = await service.login(req.body);
  const tokens = await issueTokens(req, "admin", admin.id, {
    remember: req.body.rememberMe,
    accessClaims: roleClaims(admin),
  });
  setAuthCookies(res, "admin", tokens);
  await logActivity(req, {
    adminUserId: admin.id,
    module: "auth",
    action: "login",
    entityType: "admin_user",
    entityId: admin.id,
    entityLabel: admin.name,
    summary: "Signed in",
  });
  return ok(res, await service.toAdminDto(admin));
}

/** POST /admin/auth/refresh */
export async function refresh(req, res) {
  const { subject, tokens } = await rotateRefreshToken(req, "admin", readRefreshToken(req, "admin"), {
    loadSubject: service.loadActiveAdmin,
    accessClaims: roleClaims,
  });
  setAuthCookies(res, "admin", tokens);
  return ok(res, await service.toAdminDto(subject));
}

/** POST /admin/auth/logout */
export async function logout(req, res) {
  await revokeByRefreshToken("admin", readRefreshToken(req, "admin"));
  clearAuthCookies(res, "admin");
  return ok(res, { message: "Signed out" });
}

/** GET /admin/auth/me — user + current permission codes */
export async function me(req, res) {
  return ok(res, await service.toAdminDto(req.admin));
}

/** PUT /admin/auth/me — name, mobile, department (email and role are changed by a Super Admin in Staff & Roles) */
export async function updateMe(req, res) {
  const { admin, changes } = await service.updateMe(req.admin, req.body);
  if (changes.length) {
    await logActivity(req, {
      module: "auth",
      action: "update",
      entityType: "admin_user",
      entityId: admin.id,
      entityLabel: admin.name,
      summary: `Updated own profile: ${changes.map((c) => c.field).join(", ")}`,
      oldValues: Object.fromEntries(changes.map((c) => [c.field, c.from])),
      newValues: Object.fromEntries(changes.map((c) => [c.field, c.to])),
    });
  }
  return ok(res, await service.toAdminDto(admin));
}

/** PUT /admin/auth/me/avatar (multipart field "file") */
export async function uploadAvatar(req, res) {
  const admin = await service.setAvatar(req.admin, req.file);
  await logActivity(req, {
    module: "auth",
    action: "update",
    entityType: "admin_user",
    entityId: admin.id,
    entityLabel: admin.name,
    summary: "Changed profile photo",
  });
  return ok(res, await service.toAdminDto(admin));
}

/** DELETE /admin/auth/me/avatar */
export async function deleteAvatar(req, res) {
  const admin = await service.removeAvatar(req.admin);
  return ok(res, await service.toAdminDto(admin));
}

/** GET /admin/auth/me/activity — own audit trail */
export async function myActivity(req, res) {
  const { rows, meta } = await service.listMyActivity(req.admin, req.validatedQuery);
  return ok(res, rows, { meta });
}

/** GET /admin/auth/sessions — signed-in devices */
export async function sessions(req, res) {
  return ok(res, await listActiveSessions("admin", req.admin.id, currentSessionJti(req, "admin")));
}

/** DELETE /admin/auth/sessions/:id */
export async function revokeSession(req, res) {
  const device = await revokeSessionById("admin", req.admin.id, req.validatedParams.id, currentSessionJti(req, "admin"));
  await logActivity(req, {
    module: "auth",
    action: "update",
    entityType: "admin_user",
    entityId: req.admin.id,
    entityLabel: req.admin.name,
    summary: `Signed out ${device.label}`,
  });
  return ok(res, { message: `${device.label} has been signed out.` });
}

/** POST /admin/auth/sessions/revoke-others */
export async function revokeOthers(req, res) {
  const jti = currentSessionJti(req, "admin");
  if (!jti) throw ApiError.unauthorized("Please sign in again to manage your devices.", "NO_REFRESH_TOKEN");
  const count = await revokeOtherSessions("admin", req.admin.id, jti);
  if (count) {
    await logActivity(req, {
      module: "auth",
      action: "update",
      entityType: "admin_user",
      entityId: req.admin.id,
      entityLabel: req.admin.name,
      summary: `Signed out ${count} other device${count === 1 ? "" : "s"}`,
    });
  }
  return ok(res, {
    count,
    message: count ? `Signed out of ${count} other device${count === 1 ? "" : "s"}.` : "No other devices were signed in.",
  });
}

/** PUT /admin/auth/me/password */
export async function changePassword(req, res) {
  let currentJti;
  try {
    currentJti = verifyRefreshToken(readRefreshToken(req, "admin"), "admin").jti;
  } catch {
    currentJti = undefined;
  }
  await service.changePassword(req.admin, req.body, currentJti);
  await logActivity(req, {
    module: "auth",
    action: "update",
    entityType: "admin_user",
    entityId: req.admin.id,
    entityLabel: req.admin.name,
    summary: "Changed own password",
  });
  return ok(res, { message: "Password updated. Other devices have been signed out." });
}

/** POST /admin/auth/forgot-password */
export async function forgotPassword(req, res) {
  await service.forgotPassword(req.body.email);
  return ok(res, {
    message: `If ${req.body.email} belongs to an active staff account, a reset link has been sent to it.`,
  });
}

/** POST /admin/auth/reset-password */
export async function resetPassword(req, res) {
  const admin = await service.resetPassword(req.body);
  await logActivity(req, {
    adminUserId: admin.id,
    module: "auth",
    action: "update",
    entityType: "admin_user",
    entityId: admin.id,
    entityLabel: admin.name,
    summary: "Password set via email link",
  });
  return ok(res, { message: "Password updated. You can sign in now." });
}
