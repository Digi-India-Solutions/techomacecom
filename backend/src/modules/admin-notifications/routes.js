import { Router } from "express";
import { ok } from "../../lib/http.js";
import { validate } from "../../middlewares/validate.js";
import { queryId } from "../../lib/list.js";
import { z } from "zod";
import { listForAdmin, markAllRead, markRead, prune } from "../../services/admin-alerts.service.js";

/**
 * /api/v1/admin/notifications — the signed-in staff member's own alerts (no extra permission:
 * every row is already addressed to them, and "needs attention" only counts modules they can view).
 */
const router = Router();

let lastPrune = 0;
router.get("/", async (req, res) => {
  if (Date.now() - lastPrune > 6 * 3600 * 1000) {
    lastPrune = Date.now();
    prune();
  }
  return ok(res, await listForAdmin(req.admin, req.permissions));
});

router.post("/read-all", async (req, res) => {
  await markAllRead(req.admin);
  return ok(res, await listForAdmin(req.admin, req.permissions));
});

router.post("/:id/read", validate({ params: z.object({ id: queryId }) }), async (req, res) => {
  await markRead(req.admin, req.validatedParams.id);
  return ok(res, await listForAdmin(req.admin, req.permissions));
});

export default router;
