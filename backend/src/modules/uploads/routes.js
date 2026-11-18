import { Router } from "express";
import multer from "multer";
import env from "../../../config/env.js";
import { ApiError } from "../../lib/http.js";
import { UPLOAD_FOLDERS } from "../../lib/storage.js";
import { requireAnyPermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";

/**
 * Admin image uploads — mounted at /api/v1/admin/uploads (behind requireAdmin).
 * Document §12.2: POST /admin/uploads (image) → { url } · "any edit permission".
 * Each folder is checked against its own module permissions in the controller.
 */
const router = Router();

// Files stay in memory only long enough to be converted to WebP; originals are never written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.uploads.maxFileMb * 1024 * 1024, files: env.uploads.maxFiles, fields: 5 },
  fileFilter(req, file, cb) {
    if (!file.mimetype?.startsWith("image/") || file.mimetype === "image/svg+xml") {
      return cb(ApiError.badRequest(`"${file.originalname}" is not a supported image`, "UNSUPPORTED_IMAGE"));
    }
    cb(null, true);
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "files", maxCount: env.uploads.maxFiles },
]);

const anyUploadPermission = requireAnyPermission(...new Set(Object.values(UPLOAD_FOLDERS).flat()));

router.get("/folders", anyUploadPermission, c.folders);
router.post("/", anyUploadPermission, upload, c.upload);
router.delete("/", anyUploadPermission, c.remove);

export default router;
