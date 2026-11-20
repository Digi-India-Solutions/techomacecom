import nodemailer from "nodemailer";
import env from "../../config/env.js";

let transporter;

function getTransporter() {
  if (!env.mail.user || !env.mail.pass) return null;
  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.mail.user, pass: env.mail.pass },
  });
  return transporter;
}

// Network hiccups worth another try (the SMTP server dropped / never answered the connection).
// Auth or "recipient rejected" errors are NOT retried — they would fail the same way again.
const TRANSIENT = new Set(["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ESOCKET", "ECONNECTION", "EPIPE", "EAI_AGAIN"]);
const RETRY_DELAYS_MS = [1500, 4000];

const isTransient = (error) =>
  TRANSIENT.has(error?.code) || /ECONNRESET|ETIMEDOUT|socket hang up|Greeting never received/i.test(error?.message || "");

/**
 * Sends an email. Returns { sent: true } or { sent: false, error }.
 * Never throws — callers decide whether a failed email should fail the request.
 * Transient network errors are retried twice (1.5 s, then 4 s later).
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] EMAIL_USER / EMAIL_PASS not set — not sending "${subject}" to ${to}`);
    return { sent: false, error: "Email is not configured" };
  }
  for (let attempt = 0; ; attempt++) {
    try {
      await t.sendMail({ from: `"Buy Denmed" <${env.mail.from}>`, to, subject, text, html });
      if (attempt > 0) console.log(`[mail] "${subject}" to ${to} sent on retry ${attempt}`);
      return { sent: true };
    } catch (error) {
      if (attempt < RETRY_DELAYS_MS.length && isTransient(error)) {
        console.warn(`[mail] "${subject}" to ${to}: ${error.code || error.message} — retrying`);
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      console.error(`[mail] failed to send "${subject}" to ${to}:`, error.message);
      return { sent: false, error: error.message };
    }
  }
}

/** One-time code email (sign-up verification). `otp` is digits only — safe to put in HTML. */
export function otpEmail({ otp, minutes, purposeLine }) {
  const text = `Your Buy Denmed verification code is ${otp}\n\n${purposeLine}\nThe code expires in ${minutes} minutes.\n\nNever share this code with anyone — Buy Denmed staff will never ask for it.\nIf you did not request it, you can ignore this email.`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#12263F">
    <h2 style="color:#0B2545">Verify your email</h2>
    <p style="font-size:14px;line-height:1.6">${purposeLine}</p>
    <p style="margin:24px 0;font-size:32px;font-weight:bold;letter-spacing:10px;color:#1D5FAF">${otp}</p>
    <p style="font-size:13px;line-height:1.6">This code expires in <strong>${minutes} minutes</strong>.</p>
    <p style="font-size:12px;color:#5B6B82;line-height:1.6">
      Never share this code with anyone — Buy Denmed staff will never ask for it.<br/>
      If you did not request it, you can ignore this email.
    </p>
  </div>`;
  return { text, html };
}

export function actionEmail({ heading, intro, buttonLabel, url, footer }) {
  const text = `${heading}\n\n${intro}\n\n${buttonLabel}: ${url}\n\n${footer}`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#12263F">
    <h2 style="color:#0B2545">${heading}</h2>
    <p style="font-size:14px;line-height:1.6">${intro}</p>
    <p style="margin:28px 0">
      <a href="${url}" style="background:#1D5FAF;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${buttonLabel}</a>
    </p>
    <p style="font-size:12px;color:#5B6B82;line-height:1.6">${footer}<br/>If the button does not work, open: ${url}</p>
  </div>`;
  return { text, html };
}
