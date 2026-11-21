import env from "../../config/env.js";
import { maskMobile } from "./mobile.js";

/**
 * OTP delivery. SMS_PROVIDER in .env:
 *   console (default) — prints the OTP in the API terminal. Development only.
 *   msg91             — MSG91 OTP API (needs MSG91_AUTH_KEY + a DLT-approved MSG91_OTP_TEMPLATE_ID)
 */
export async function sendOtpSms(mobile, otp) {
  if (env.sms.provider === "msg91") {
    if (!env.sms.msg91AuthKey || !env.sms.msg91TemplateId) {
      throw new Error("SMS_PROVIDER=msg91 needs MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID");
    }
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", env.sms.msg91TemplateId);
    url.searchParams.set("mobile", `91${mobile}`);
    url.searchParams.set("otp", otp);
    const response = await fetch(url, {
      method: "POST",
      headers: { authkey: env.sms.msg91AuthKey, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.type === "error") {
      throw new Error(`MSG91 rejected the OTP request: ${body.message || response.status}`);
    }
    return { provider: "msg91" };
  }

  if (env.isProduction) {
    throw new Error("No SMS provider configured. Set SMS_PROVIDER=msg91 in production.");
  }

  console.log(`\n📱  OTP for ${maskMobile(mobile)} (+91 ${mobile}): ${otp}\n`);
  return { provider: "console" };
}

/**
 * Transactional SMS (order / rental updates). In India each message must match a
 * DLT-registered template, so MSG91 needs that template's id (stored per event in
 * Settings → Notifications) and the variables; the text itself is used for console mode.
 */
export async function sendTextSms(mobile, text, { templateId, variables = {} } = {}) {
  if (env.sms.provider === "msg91") {
    if (!env.sms.msg91AuthKey) throw new Error("MSG91_AUTH_KEY is not set");
    if (!templateId) throw new Error("No MSG91 / DLT template id saved for this event");
    const response = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers: { authkey: env.sms.msg91AuthKey, "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: templateId, short_url: "0", recipients: [{ mobiles: `91${mobile}`, ...variables }] }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.type === "error") throw new Error(`MSG91: ${body.message || response.status}`);
    return { provider: "msg91", messageId: body.message || null };
  }
  if (env.isProduction) throw new Error("No SMS provider configured (SMS_PROVIDER=msg91)");
  console.log(`\n✉️  SMS to ${maskMobile(mobile)}: ${text}\n`);
  return { provider: "console", messageId: null };
}

export function smsStatus() {
  if (env.sms.provider === "msg91") return env.sms.msg91AuthKey ? "msg91" : "msg91 (missing MSG91_AUTH_KEY)";
  return env.isProduction ? "not configured" : "console (development)";
}
