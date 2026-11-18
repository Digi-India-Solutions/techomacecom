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
