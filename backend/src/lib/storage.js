import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import env from "../../config/env.js";

/**
 * Local file storage (document §2 "File storage", kept on this server's disk).
 *
 *   backend/uploads/<folder>/<yyyy>/<mm>/<id>.webp        ← public, served at /uploads/…
 *   backend/uploads/<folder>/<yyyy>/<mm>/<id>-w640.webp   ← responsive sizes
 *
 * The DB stores the relative path ("/uploads/products/2026/11/ab12….webp");
 * publicUrl() turns it into a full URL using ASSET_BASE_URL, so moving to a CDN
 * or a new domain later needs no data migration.
 *
 * Never store private documents here — everything under uploads/ is publicly served.
 */

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const UPLOADS_ROOT = path.isAbsolute(env.uploads.dir) ? env.uploads.dir : path.join(BACKEND_ROOT, env.uploads.dir);
export const UPLOADS_URL_PREFIX = "/uploads";

/** Folders an admin can upload into → the permissions that allow it. */
export const UPLOAD_FOLDERS = {
  products: ["products.create", "products.edit"],
  categories: ["categories.create", "categories.edit"],
  brands: ["brands.create", "brands.edit"],
  banners: ["marketing.create", "marketing.edit"],
  content: ["content.create", "content.edit"], // blog covers, CMS pages
  misc: ["settings.edit"], // logos, favicons
};

const STORED_FILE = /^\/uploads\/([a-z_]+)\/(\d{4})\/(\d{2})\/([a-f0-9]{20})\.webp$/;

export function newFileId() {
  return crypto.randomBytes(10).toString("hex"); // 20 hex chars, unguessable and unique
}

/** "/uploads/products/2026/11" for today (IST-agnostic: UTC year/month is fine for folders). */
export function datedDir(folder) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${UPLOADS_URL_PREFIX}/${folder}/${yyyy}/${mm}`;
}

/** Maps "/uploads/…" to an absolute path inside UPLOADS_ROOT (throws on traversal). */
export function toDiskPath(relativeUrlPath) {
  const inner = relativeUrlPath.replace(/^\/uploads\//, "");
  const resolved = path.resolve(UPLOADS_ROOT, inner);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) throw new Error("Path escapes the uploads folder");
  return resolved;
}

export async function writeFile(relativeUrlPath, buffer) {
  const diskPath = toDiskPath(relativeUrlPath);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  // wx: never overwrite an existing file (ids are random, so this only guards against bugs)
  await fs.writeFile(diskPath, buffer, { flag: "wx" });
}

/** Absolute URL for a stored path (or pass-through for an already absolute URL). */
export function publicUrl(relativeUrlPath) {
  if (!relativeUrlPath) return null;
  if (/^https?:\/\//i.test(relativeUrlPath)) return relativeUrlPath;
  return `${env.uploads.publicBaseUrl}${relativeUrlPath}`;
}

/** Parses a stored image path; null if it is not one of ours. */
export function parseStoredPath(value) {
  const relative = String(value || "").replace(env.uploads.publicBaseUrl, "");
  const m = STORED_FILE.exec(relative);
  return m ? { path: relative, folder: m[1], dir: `/uploads/${m[1]}/${m[2]}/${m[3]}`, id: m[4] } : null;
}

/** Deletes an image and all of its responsive sizes. Returns how many files were removed. */
export async function deleteImage(stored) {
  const dirOnDisk = path.dirname(toDiskPath(stored.path));
  let names = [];
  try {
    names = await fs.readdir(dirOnDisk);
  } catch {
    return 0;
  }
  const mine = names.filter((n) => n === `${stored.id}.webp` || (n.startsWith(`${stored.id}-w`) && n.endsWith(".webp")));
  await Promise.all(mine.map((n) => fs.unlink(path.join(dirOnDisk, n)).catch(() => undefined)));
  return mine.length;
}
