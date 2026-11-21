import prisma from "../../db/db.js";
import env from "../../config/env.js";
import { sendMail } from "../lib/mailer.js";
import { sendTextSms, smsStatus } from "../lib/sms.js";
import { normalizeMobile } from "../lib/mobile.js";
import { NOTIFICATION_EVENTS } from "../modules/settings/notification-events.js";

/**
 * notify("order_placed", { email, mobile, vars: { customer_name, order_number, total }, entityType, entityId })
 *
 * Uses the templates from Settings → Notifications (defaults until saved), sends on every
 * channel that is switched on and has a recipient, and writes one notification_logs row per
 * attempt. Never throws — a failed SMS must not fail the order that triggered it.
 */

const EVENTS = Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.event, e]));

export function render(template, vars = {}) {
  return String(template || "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, k) => (vars[k] ?? "").toString());
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The effective template for each channel of an event (saved row, else default). */
export async function templatesFor(event) {
  const def = EVENTS[event];
  if (!def) throw new Error(`Unknown notification event "${event}"`);
  const rows = await prisma.notificationTemplate.findMany({ where: { event } });
  const byChannel = Object.fromEntries(rows.map((r) => [r.channel, r]));
  return Object.fromEntries(
    ["sms", "whatsapp", "email"].map((channel) => {
      const row = byChannel[channel];
      return [
        channel,
        {
          id: row?.id ?? null,
          active: row ? row.is_active : def.channels[channel],
          subject: row?.subject ?? def.subject,
          body: row?.body ?? def.body,
          providerTemplateId: row?.provider_template_id ?? "",
        },
      ];
    })
  );
}

export function channelStatus() {
  return {
    email: env.mail.user && env.mail.pass ? "gmail" : "not configured",
    sms: smsStatus(),
    whatsapp: "not connected",
  };
}

async function log({ templateId, channel, recipient, status, error, messageId, entityType, entityId }) {
  try {
    await prisma.notificationLog.create({
      data: {
        template_id: templateId,
        channel,
        recipient: String(recipient).slice(0, 200),
        status,
        error: error ? String(error).slice(0, 1000) : null,
        provider_message_id: messageId || null,
        entity_type: entityType || null,
        entity_id: entityId ?? null,
      },
    });
  } catch (e) {
    console.error("[notify] could not write log:", e.message);
  }
}

/** @returns {Promise<{ channel, status, error? }[]>} */
export async function notify(event, { email, mobile, vars = {}, entityType, entityId, only } = {}) {
  const results = [];
  let templates;
  try {
    templates = await templatesFor(event);
  } catch (error) {
    console.error("[notify]", error.message);
    return results;
  }

  for (const channel of ["email", "sms", "whatsapp"]) {
    if (only && only !== channel) continue;
    const t = templates[channel];
    if (!t.active) continue;
    const recipient = channel === "email" ? email : normalizeMobile(mobile);
    if (!recipient) continue;

    const text = render(t.body, vars);
    let status = "sent";
    let error = null;
    let messageId = null;
    try {
      if (channel === "email") {
        const subject = render(t.subject, vars) || EVENTS[event].label;
        const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#12263F">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`;
        const r = await sendMail({ to: recipient, subject, text, html });
        if (!r.sent) throw new Error(r.error || "Email not sent");
      } else if (channel === "sms") {
        const r = await sendTextSms(recipient, text, { templateId: t.providerTemplateId, variables: vars });
        messageId = r.messageId;
      } else {
        throw new Error("WhatsApp Business API is not connected yet");
      }
    } catch (e) {
      status = "failed";
      error = e.message;
    }
    await log({ templateId: t.id, channel, recipient, status, error, messageId, entityType, entityId });
    results.push({ channel, recipient, status, ...(error ? { error } : {}) });
  }
  return results;
}
