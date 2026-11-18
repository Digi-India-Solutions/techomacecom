import { ok } from "../../lib/http.js";
import env from "../../../config/env.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

const id = (req) => BigInt(req.validatedParams.id);

// ----- Permissions & roles -----

export function listPermissions(req, res) {
  return ok(res, service.listPermissionCatalog());
}

export async function listRoles(req, res) {
  return ok(res, await service.listRoles());
}

export async function createRole(req, res) {
  const { role, granted } = await service.createRole(req.body);
  await logActivity(req, {
    module: "staff",
    action: "create",
    entityType: "role",
    entityId: BigInt(role.id),
    entityLabel: role.name,
    summary: `Created role with ${granted} permission${granted === 1 ? "" : "s"}`,
  });
  return ok(res, role, { status: 201 });
}

export async function updateRole(req, res) {
  const { role, added, removed } = await service.updateRole(id(req), req.body, req.admin);
  const parts = [];
  if (added.length) parts.push(`+${added.length} (${added.slice(0, 4).join(", ")}${added.length > 4 ? "…" : ""})`);
  if (removed.length) parts.push(`−${removed.length} (${removed.slice(0, 4).join(", ")}${removed.length > 4 ? "…" : ""})`);
  await logActivity(req, {
    module: "staff",
    action: "update",
    entityType: "role",
    entityId: BigInt(role.id),
    entityLabel: role.name,
    summary: parts.length ? `Permissions ${parts.join(" ")}` : "Updated role details",
    newValues: { added, removed },
  });
  return ok(res, role);
}

export async function deleteRole(req, res) {
  const role = await service.deleteRole(id(req));
  await logActivity(req, {
    module: "staff",
    action: "delete",
    entityType: "role",
    entityId: role.id,
    entityLabel: role.name,
    summary: "Deleted custom role",
  });
  return ok(res, { message: `Role "${role.name}" deleted` });
}

// ----- Staff -----

export async function listStaff(req, res) {
  return ok(res, await service.listStaff());
}

export async function createStaff(req, res) {
  const { staff, inviteSent, inviteUrl } = await service.createStaff(req.body, req.admin);
  await logActivity(req, {
    module: "staff",
    action: "create",
    entityType: "admin_user",
    entityId: BigInt(staff.id),
    entityLabel: staff.name,
    summary: `Added as ${staff.roleName}`,
  });
  return ok(
    res,
    {
      staff,
      inviteSent,
      message: inviteSent
        ? `Invite sent to ${staff.email} to set a password`
        : `Account created, but the invite email could not be sent`,
      // Development convenience only: lets you open the invite without email.
      ...(!env.isProduction && !inviteSent ? { inviteUrl } : {}),
    },
    { status: 201 }
  );
}

export async function updateStaff(req, res) {
  const { before, after } = await service.updateStaff(id(req), req.body, req.admin);
  const changes = [];
  if (before.roleName !== after.roleName) changes.push(`Role: ${before.roleName} → ${after.roleName}`);
  if (before.status !== after.status) changes.push(`Status: ${before.status} → ${after.status}`);
  if (before.email !== after.email) changes.push(`Email: ${before.email} → ${after.email}`);
  await logActivity(req, {
    module: "staff",
    action: before.roleName !== after.roleName || before.status !== after.status ? "status_change" : "update",
    entityType: "admin_user",
    entityId: BigInt(after.id),
    entityLabel: after.name,
    summary: changes.join(" · ") || "Updated staff details",
  });
  return ok(res, after);
}

export async function toggleStaffStatus(req, res) {
  const staff = await service.toggleStaffStatus(id(req), req.admin);
  await logActivity(req, {
    module: "staff",
    action: "status_change",
    entityType: "admin_user",
    entityId: BigInt(staff.id),
    entityLabel: staff.name,
    summary: staff.status === "active" ? "Account activated" : "Account deactivated (signed out everywhere)",
  });
  return ok(res, staff);
}

export async function resetStaffPassword(req, res) {
  const { admin, sent, url, invite } = await service.sendStaffPasswordReset(id(req), req.admin);
  await logActivity(req, {
    module: "staff",
    action: "update",
    entityType: "admin_user",
    entityId: admin.id,
    entityLabel: admin.name,
    summary: invite ? "Re-sent invite link" : "Sent password reset link",
  });
  return ok(res, {
    sent,
    message: sent
      ? `${invite ? "Invite" : "Password reset"} link sent to ${admin.email}`
      : `Could not send the email to ${admin.email}`,
    ...(!env.isProduction && !sent ? { resetUrl: url } : {}),
  });
}

// ----- Activity log -----

export async function listActivity(req, res) {
  const { rows, meta } = await service.listActivity(req.validatedQuery);
  return ok(res, rows, { meta });
}
