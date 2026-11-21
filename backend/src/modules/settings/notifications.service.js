import { z } from "zod";
import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { channelStatus, notify, render, templatesFor } from "../../services/notification.service.js";
import { NOTIFICATION_EVENTS, SAMPLE_VARIABLES } from "./notification-events.js";

/**
 * Settings → Notifications. The admin edits one message per event (shared by SMS,
 * WhatsApp and email), an email subject, which channels are on, and the provider
 * template ids (MSG91 DLT id for SMS, approved template name for WhatsApp).
 */

export async function listTemplates() {
  const events = [];
  for (const def of NOTIFICATION_EVENTS) {
    const t = await templatesFor(def.event);
    events.push({
      event: def.event,
      label: def.label,
      group: def.group,
      variables: def.variables,
      body: t.sms.body, // shared text
      subject: t.email.subject,
      sms: { active: t.sms.active, templateId: t.sms.providerTemplateId },
      whatsapp: { active: t.whatsapp.active, templateId: t.whatsapp.providerTemplateId },
      email: { active: t.email.active },
      preview: render(t.sms.body, SAMPLE_VARIABLES),
    });
  }
  return { events, channels: channelStatus() };
}

const EVENT_KEYS = NOTIFICATION_EVENTS.map((e) => e.event);

const templateSchema = z
  .object({
    event: z.enum(EVENT_KEYS),
    body: z.string().trim().min(5, "Message is too short").max(1000, "Message must be at most 1000 characters"),
    subject: z.string().trim().max(200).default(""),
    sms: z.object({ active: z.boolean(), templateId: z.string().trim().max(100).default("") }),
    whatsapp: z.object({ active: z.boolean(), templateId: z.string().trim().max(100).default("") }),
    email: z.object({ active: z.boolean() }),
  })
  .superRefine((t, ctx) => {
    const allowed = new Set(NOTIFICATION_EVENTS.find((e) => e.event === t.event).variables);
    for (const [, name] of `${t.body} ${t.subject}`.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)) {
      if (!allowed.has(name)) {
        ctx.addIssue({ code: "custom", path: ["body"], message: `{{${name}}} is not available for this event` });
        return;
      }
    }
    if (t.email.active && !t.subject) ctx.addIssue({ code: "custom", path: ["subject"], message: "Email needs a subject" });
  });

export const saveTemplatesSchema = z.object({ events: z.array(templateSchema).min(1).max(EVENT_KEYS.length) });

export async function saveTemplates(events) {
  const changed = [];
  await prisma.$transaction(async (tx) => {
    for (const t of events) {
      const rows = {
        sms: { is_active: t.sms.active, body: t.body, subject: null, provider_template_id: t.sms.templateId || null },
        whatsapp: { is_active: t.whatsapp.active, body: t.body, subject: null, provider_template_id: t.whatsapp.templateId || null },
        email: { is_active: t.email.active, body: t.body, subject: t.subject || null, provider_template_id: null },
      };
      const current = await tx.notificationTemplate.findMany({ where: { event: t.event } });
      const differs = ["sms", "whatsapp", "email"].some((ch) => {
        const c = current.find((r) => r.channel === ch);
        const n = rows[ch];
        return !c || c.is_active !== n.is_active || c.body !== n.body || (c.subject || null) !== n.subject || (c.provider_template_id || null) !== n.provider_template_id;
      });
      if (!differs) continue;
      changed.push(t.event);
      for (const [channel, data] of Object.entries(rows)) {
        await tx.notificationTemplate.upsert({
          where: { event_channel: { event: t.event, channel } },
          create: { event: t.event, channel, ...data },
          update: data,
        });
      }
    }
  });
  return changed;
}

export const testSchema = z.object({ channel: z.enum(["email", "sms", "whatsapp"]) });

/** Sends the saved template with sample values to the signed-in admin. */
export async function sendTest(event, channel, admin) {
  if (!EVENT_KEYS.includes(event)) throw ApiError.notFound("Unknown notification event");
  const to = channel === "email" ? admin.email : admin.mobile;
  if (!to) {
    throw ApiError.badRequest(
      channel === "email" ? "Your account has no email." : "Add your mobile number in My Profile to receive test SMS / WhatsApp messages.",
      "NO_RECIPIENT"
    );
  }
  const [result] = await notify(event, {
    email: admin.email,
    mobile: admin.mobile,
    vars: SAMPLE_VARIABLES,
    entityType: "test",
    only: channel,
  });
  if (!result) throw ApiError.badRequest(`The ${channel} channel is switched off for this event. Turn it on and save first.`, "CHANNEL_OFF");
  return result;
}

export async function recentLogs(limit = 30) {
  const rows = await prisma.notificationLog.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    include: { template: { select: { event: true } } },
  });
  return rows.map((r) => ({
    id: String(r.id),
    event: r.template?.event || r.entity_type || "",
    channel: r.channel,
    recipient: r.recipient,
    status: r.status,
    error: r.error,
    at: r.created_at,
  }));
}
