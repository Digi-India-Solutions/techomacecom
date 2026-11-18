import prisma from "../../db/db.js";
import { clientIp } from "../lib/http.js";

/**
 * Writes one activity_logs row (document §9: "every admin write logged").
 * Never throws — an audit failure must not undo the action the user just did.
 */
export async function logActivity(req, { module, action, entityType, entityId, entityLabel, summary, oldValues, newValues, adminUserId }) {
  try {
    await prisma.activityLog.create({
      data: {
        admin_user_id: adminUserId ?? req.admin?.id ?? null,
        module,
        action,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        entity_label: entityLabel ?? null,
        summary: summary ?? null,
        old_values: oldValues ?? undefined,
        new_values: newValues ?? undefined,
        ip_address: clientIp(req),
      },
    });
  } catch (error) {
    console.error("[activity] failed to write log:", error.message);
  }
}
