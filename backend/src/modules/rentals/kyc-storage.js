import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import env from "../../../config/env.js";
import { ApiError } from "../../lib/http.js";

/**
 * Rental KYC documents (Aadhaar, PAN, prescriptions…) are personal data, so they are kept
 * OUTSIDE the public /uploads folder and only streamed back through signed-in routes:
 *   customer → GET /api/v1/rentals/kyc-documents/:id/file   (own documents)
 *   staff    → GET /api/v1/admin/rentals/:id/kyc/:docId/file (rentals.view)
 * Originals are stored as uploaded (no WebP conversion — PDFs must stay PDFs).
 */

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const PRIVATE_ROOT = path.isAbsolute(env.uploads.privateDir)
  ? env.uploads.privateDir
  : path.join(BACKEND_ROOT, env.uploads.privateDir);

export const KYC_MAX_MB = 8;

// Detected from the file's first bytes — the browser-supplied mimetype is not trusted.
const FORMATS = [
  { mime: "application/pdf", ext: "pdf", test: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", ext: "webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
];

/** multipart parser: one file in the "file" field (+ a few text fields such as docType). */
export const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: KYC_MAX_MB * 1024 * 1024, files: 1, fields: 5 },
}).single("file");

function resolveInside(relPath) {
  const resolved = path.resolve(PRIVATE_ROOT, relPath);
  if (!resolved.startsWith(PRIVATE_ROOT + path.sep)) throw new Error("Path escapes the private uploads folder");
  return resolved;
}

export async function saveKycFile(file) {
  if (!file?.buffer?.length) throw ApiError.badRequest('Attach the document in the "file" field', "NO_FILE");
  const format = FORMATS.find((f) => f.test(file.buffer));
  if (!format) throw ApiError.badRequest("Upload a PDF, JPG, PNG or WebP file", "UNSUPPORTED_FILE");
  const now = new Date();
  const rel = `kyc/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomBytes(16).toString("hex")}.${format.ext}`;
  const disk = resolveInside(rel);
  await fs.mkdir(path.dirname(disk), { recursive: true });
  await fs.writeFile(disk, file.buffer, { flag: "wx", mode: 0o600 });
  const name = String(file.originalname || `document.${format.ext}`).replace(/[^\w.\- ()]/g, "_").slice(0, 200);
  return { path: rel, mime: format.mime, size: file.buffer.length, name };
}

export async function readKycFile(relPath) {
  try {
    return await fs.readFile(resolveInside(relPath));
  } catch {
    throw ApiError.notFound("The document file is missing");
  }
}

export async function deleteKycFile(relPath) {
  await fs.unlink(resolveInside(relPath)).catch(() => undefined);
}

/** Streams a document inline (never cached by proxies). */
export async function sendKycFile(res, doc) {
  const buffer = await readKycFile(doc.file_path);
  res.setHeader("Content-Type", doc.mime_type);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `inline; filename="${doc.file_name.replace(/"/g, "")}"`);
  res.end(buffer);
}
