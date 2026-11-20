import { Router } from "express";
import { UPLOAD_FOLDERS } from "../../lib/storage.js";
import { requireAnyPermission } from "../../middlewares/auth.js";
import { imageUpload } from "../../middlewares/upload.js";
import * as c from "./controller.js";

/**
 * Admin image uploads — mounted at /api/v1/admin/uploads (behind requireAdmin).
 * Document §12.2: POST /admin/uploads (image) → { url } · "any edit permission".
 * Each folder is checked against its own module permissions in the controller.
 */
const router = Router();

const upload = imageUpload(); // field "file" or "files"

const anyUploadPermission = requireAnyPermission(...new Set(Object.values(UPLOAD_FOLDERS).flat()));

router.get("/folders", anyUploadPermission, c.folders);
router.post("/", anyUploadPermission, upload, c.upload);
router.delete("/", anyUploadPermission, c.remove);

export default router;
