import multer from "multer";
import env from "../../config/env.js";
import { ApiError } from "../lib/http.js";

/**
 * multipart/form-data image parsing. Files stay in memory only long enough to be
 * converted to WebP (lib/image.js) — originals are never written to disk.
 *
 *   imageUpload()                    → field "file" (1) or "files" (up to UPLOAD_MAX_FILES)
 *   imageUpload({ single: true })    → field "file" only (profile photos)
 */
export function imageUpload({ single = false } = {}) {
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.uploads.maxFileMb * 1024 * 1024, files: single ? 1 : env.uploads.maxFiles, fields: 5 },
    fileFilter(req, file, cb) {
      if (!file.mimetype?.startsWith("image/") || file.mimetype === "image/svg+xml") {
        return cb(ApiError.badRequest(`"${file.originalname}" is not a supported image`, "UNSUPPORTED_IMAGE"));
      }
      cb(null, true);
    },
  });
  return single
    ? parser.single("file")
    : parser.fields([
        { name: "file", maxCount: 1 },
        { name: "files", maxCount: env.uploads.maxFiles },
      ]);
}
