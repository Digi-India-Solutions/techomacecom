import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import { imageUpload } from "../../middlewares/upload.js";
import { ApiError } from "../../lib/http.js";
import { listQuery } from "../../lib/list.js";
import { SETTING_GROUPS } from "./definitions.js";
import { saveTemplatesSchema, testSchema } from "./notifications.service.js";
import * as c from "./controller.js";

/**
 * Settings — admin routes are mounted at /api/v1/admin/settings (behind requireAdmin),
 * public ones at /api/v1 (storefront).
 */

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter(req, file, cb) {
    if (!/\.csv$/i.test(file.originalname) && !/csv|text\/plain|excel/.test(file.mimetype)) {
      return cb(ApiError.badRequest("Upload a .csv file", "UNSUPPORTED_FILE"));
    }
    cb(null, true);
  },
}).single("file");

const view = requirePermission("settings.view");
const edit = requirePermission("settings.edit");
const groupParam = validate({ params: z.object({ group: z.enum(SETTING_GROUPS, { error: `Use one of: ${SETTING_GROUPS.join(", ")}` }) }) });

export const adminSettingsRoutes = Router();
adminSettingsRoutes.get("/", view, c.getAll);

adminSettingsRoutes.put("/images/:name", edit, imageUpload({ single: true }), c.uploadImage);
adminSettingsRoutes.delete("/images/:name", edit, c.deleteImage);

adminSettingsRoutes.get("/pincodes/summary", view, c.pincodeSummary);
adminSettingsRoutes.get("/pincodes/export", view, c.exportPincodes);
adminSettingsRoutes.get("/pincodes", view, validate({ query: listQuery({}) }), c.listPincodes);
adminSettingsRoutes.post("/pincodes/import", edit, csvUpload, c.importPincodes);
adminSettingsRoutes.delete("/pincodes", edit, c.clearPincodes);

adminSettingsRoutes.get("/notifications", view, c.listTemplates);
adminSettingsRoutes.put("/notifications", edit, validate({ body: saveTemplatesSchema }), c.saveTemplates);
adminSettingsRoutes.get("/notifications/logs", view, c.notificationLogs);
adminSettingsRoutes.post("/notifications/:event/test", edit, validate({ body: testSchema }), c.testTemplate);

adminSettingsRoutes.put("/:group", edit, groupParam, c.saveGroup);

export const publicSettingsRoutes = Router();
publicSettingsRoutes.get("/settings/public", c.publicSettings);
publicSettingsRoutes.get("/pincodes/:pincode", c.checkPincode);
