import { ok } from "../../lib/http.js";
import { setAuthCookies, clearAuthCookies, readRefreshToken, verifyRefreshToken } from "../../lib/tokens.js";
import { issueTokens, rotateRefreshToken, revokeByRefreshToken } from "../../services/session.service.js";
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

/** PUT /admin/auth/me */
export async function updateMe(req, res) {
  const admin = await service.updateMe(req.admin, req.body);
  return ok(res, await service.toAdminDto(admin));
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
