import { ok, ApiError } from "../../lib/http.js";
import { UPLOAD_FOLDERS } from "../../lib/storage.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

function foldersAllowedFor(req) {
  return Object.entries(UPLOAD_FOLDERS)
    .filter(([, perms]) => perms.some((p) => req.permissions.has(p)))
    .map(([folder]) => folder);
}

function assertFolder(req, folder) {
  if (!Object.hasOwn(UPLOAD_FOLDERS, folder)) {
    throw ApiError.badRequest(`Unknown folder "${folder}". Use one of: ${Object.keys(UPLOAD_FOLDERS).join(", ")}`, "INVALID_FOLDER");
  }
  if (!foldersAllowedFor(req).includes(folder)) {
    throw ApiError.forbidden(`Your role cannot upload to "${folder}" (needs ${UPLOAD_FOLDERS[folder].join(" or ")})`, "PERMISSION_DENIED");
  }
}

/** POST /admin/uploads?folder=products — multipart field "file" or "files" (up to 10) */
export async function upload(req, res) {
  const folder = String(req.query.folder || req.body?.folder || "").trim();
  assertFolder(req, folder);

  const files = [...(req.files?.file || []), ...(req.files?.files || [])];
  if (!files.length) throw ApiError.badRequest('Attach an image in the "file" field', "NO_FILE");

  // One at a time keeps memory and CPU predictable on a small VPS.
  const images = [];
  for (const file of files) images.push(await service.saveImage(file, folder));

  const savedBytes = images.reduce((s, i) => s + (i.originalBytes - i.bytes), 0);
  await logActivity(req, {
    module: "uploads",
    action: "create",
    entityType: "upload",
    entityLabel: images.map((i) => i.originalName).join(", ").slice(0, 200),
    summary: `${images.length} image${images.length === 1 ? "" : "s"} → WebP in ${folder} (saved ${Math.round(savedBytes / 1024)} KB)`,
  });

  return ok(res, files.length === 1 && req.files?.file ? images[0] : images, { status: 201 });
}

/** DELETE /admin/uploads  { path: "/uploads/products/2026/11/….webp" } */
export async function remove(req, res) {
  const result = await service.removeImage(req.body?.path, foldersAllowedFor(req));
  await logActivity(req, { module: "uploads", action: "delete", entityType: "upload", entityLabel: result.path, summary: "Deleted image" });
  return ok(res, result);
}

/** GET /admin/uploads/folders — where this user may upload */
export function folders(req, res) {
  return ok(res, foldersAllowedFor(req));
}
