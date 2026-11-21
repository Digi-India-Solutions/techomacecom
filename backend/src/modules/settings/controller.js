import { ok, ApiError } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";
import * as pincodes from "./pincodes.service.js";
import * as notifications from "./notifications.service.js";

const GROUP_LABEL = { store: "Store", shipping: "Shipping", tax: "Tax & Invoice", rental: "Rental" };

// ---- Admin ----

/** GET /admin/settings — every tab (rupees, image URLs, dropdown options) */
export async function getAll(req, res) {
  return ok(res, await service.adminView());
}

/** PUT /admin/settings/:group — save one tab */
export async function saveGroup(req, res) {
  const { group } = req.params;
  const { changed } = await service.saveGroup(group, req.body);
  if (changed.length) {
    await logActivity(req, {
      module: "settings",
      action: "update",
      entityType: "settings",
      entityLabel: GROUP_LABEL[group] || group,
      summary: `Updated ${GROUP_LABEL[group] || group} settings: ${changed.join(", ")}`,
    });
  }
  const all = await service.adminView();
  return ok(res, { ...all, changed, message: changed.length ? `${GROUP_LABEL[group]} settings saved` : "No changes to save" });
}

/** PUT /admin/settings/images/:name (multipart "file") — logo, footerLogo, favicon, signatory */
export async function uploadImage(req, res) {
  const image = await service.setImage(req.params.name, req.file);
  await logActivity(req, { module: "settings", action: "update", entityType: "settings", entityLabel: "Images", summary: `Uploaded ${req.params.name}` });
  return ok(res, image);
}

/** DELETE /admin/settings/images/:name */
export async function deleteImage(req, res) {
  await service.removeImage(req.params.name);
  await logActivity(req, { module: "settings", action: "update", entityType: "settings", entityLabel: "Images", summary: `Removed ${req.params.name}` });
  return ok(res, { message: "Image removed" });
}

// Pincodes
export async function pincodeSummary(req, res) {
  return ok(res, await pincodes.summary());
}
export async function listPincodes(req, res) {
  const { rows, meta } = await pincodes.list(req.validatedQuery);
  return ok(res, rows, { meta });
}
export async function importPincodes(req, res) {
  if (!req.file) throw ApiError.badRequest('Attach a CSV file in the "file" field', "NO_FILE");
  const mode = req.body?.mode === "replace" ? "replace" : "merge";
  const result = await pincodes.importPincodes(req.file.buffer.toString("utf8"), mode);
  await logActivity(req, {
    module: "settings",
    action: "update",
    entityType: "settings",
    entityLabel: "Serviceable PIN codes",
    summary: `${mode === "replace" ? "Replaced" : "Merged"} PIN codes from ${req.file.originalname}: ${result.imported} imported, ${result.before} → ${result.after}`,
  });
  return ok(res, { ...result, summary: await pincodes.summary() });
}
export async function exportPincodes(req, res) {
  const csv = await pincodes.exportCsv();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="serviceable-pincodes.csv"');
  return res.send(csv);
}
export async function clearPincodes(req, res) {
  const count = await pincodes.clearAll();
  await logActivity(req, { module: "settings", action: "delete", entityType: "settings", entityLabel: "Serviceable PIN codes", summary: `Cleared ${count} PIN codes (delivery open to all of India)` });
  return ok(res, { removed: count, summary: await pincodes.summary() });
}

// Notifications
export async function listTemplates(req, res) {
  return ok(res, await notifications.listTemplates());
}
export async function saveTemplates(req, res) {
  const changed = await notifications.saveTemplates(req.body.events);
  if (changed.length) {
    await logActivity(req, { module: "settings", action: "update", entityType: "settings", entityLabel: "Notifications", summary: `Updated templates: ${changed.join(", ")}` });
  }
  return ok(res, { ...(await notifications.listTemplates()), changed, message: changed.length ? "Notification templates saved" : "No changes to save" });
}
export async function testTemplate(req, res) {
  const result = await notifications.sendTest(req.params.event, req.body.channel, req.admin);
  return ok(res, result);
}
export async function notificationLogs(req, res) {
  return ok(res, await notifications.recentLogs());
}

// ---- Storefront (public) ----

/** GET /settings/public — store details, fees, tax display rules, rental rules */
export async function publicSettings(req, res) {
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
  return ok(res, await service.publicView());
}

/** GET /pincodes/:pincode — delivery / COD check */
export async function checkPincode(req, res) {
  return ok(res, await pincodes.check(String(req.params.pincode || "").trim()));
}
