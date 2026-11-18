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

/**
 * Sends an email. Returns { sent: true } or { sent: false, error }.
 * Never throws — callers decide whether a failed email should fail the request.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] EMAIL_USER / EMAIL_PASS not set — not sending "${subject}" to ${to}`);
    return { sent: false, error: "Email is not configured" };
  }
  try {
    await t.sendMail({ from: `"Buy Denmed" <${env.mail.from}>`, to, subject, text, html });
    return { sent: true };
  } catch (error) {
    console.error(`[mail] failed to send "${subject}" to ${to}:`, error.message);
    return { sent: false, error: error.message };
  }
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
