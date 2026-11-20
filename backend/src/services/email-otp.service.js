import crypto from "node:crypto";
import prisma from "../../db/db.js";
import env from "../../config/env.js";
import { ApiError } from "../lib/http.js";
import { sendMail, otpEmail } from "../lib/mailer.js";

/**
 * Email OTPs (email_otps) — used to prove a customer owns the email they sign up with.
 *
 *   1. sendEmailOtp     6-digit code emailed; only an HMAC hash is stored
 *                       valid EMAIL_OTP_EXPIRY_MINUTES (10), 30 s resend cooldown, max 3 per 10 min
 *   2. verifyEmailOtp   max 5 wrong tries; on success returns a one-time VERIFICATION TOKEN
 *                       (random 32 bytes, only its SHA-256 stored) valid 30 minutes
 *   3. consumeEmailVerification
 *                       the sign-up request presents the token; it must belong to the same
 *                       email, be verified, unexpired and unused — then it is burned
 *
 * So the browser never decides "this email is verified": the server does, and the account
 * can only be created by someone who received the code.
 */

const EXPIRY_MINUTES = env.otp.emailExpiryMinutes;
const TOKEN_MINUTES = 30;
const PURPOSE_TEXT = {
  signup: "Use this code to verify your email and finish creating your Buy Denmed account.",
};

const hmac = (email, purpose, otp) =>
  crypto.createHmac("sha256", env.otp.secret).update(`email:${purpose}:${email}:${otp}`).digest("hex");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function safeEqualHex(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Emails a new code. Earlier unused codes for the same email + purpose stop working. */
export async function sendEmailOtp({ email, purpose = "signup", ip }) {
  const now = Date.now();
  const recent = await prisma.emailOtp.findMany({
    where: { email, purpose, created_at: { gte: new Date(now - env.otp.sendWindowMinutes * 60_000) } },
    orderBy: { created_at: "desc" },
    select: { created_at: true },
  });

  const last = recent[0];
  if (last) {
    const waitMs = env.otp.resendCooldownSeconds * 1000 - (now - last.created_at.getTime());
    if (waitMs > 0) {
      throw ApiError.tooMany(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code`, "OTP_COOLDOWN");
    }
  }
  if (recent.length >= env.otp.sendLimit) {
    const oldest = recent[recent.length - 1].created_at.getTime();
    const minutes = Math.ceil((oldest + env.otp.sendWindowMinutes * 60_000 - now) / 60_000);
    throw ApiError.tooMany(`Too many codes requested for this email. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, "OTP_LIMIT");
  }

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const [, record] = await prisma.$transaction([
    prisma.emailOtp.updateMany({
      where: { email, purpose, verified_at: null, expires_at: { gt: new Date(now) } },
      data: { expires_at: new Date(now) },
    }),
    prisma.emailOtp.create({
      data: {
        email,
        purpose,
        otp_hash: hmac(email, purpose, otp),
        expires_at: new Date(now + EXPIRY_MINUTES * 60_000),
        ip_address: ip,
      },
    }),
  ]);

  const mail = await sendMail({
    to: email,
    subject: `${otp} is your Buy Denmed verification code`,
    ...otpEmail({ otp, minutes: EXPIRY_MINUTES, purposeLine: PURPOSE_TEXT[purpose] }),
  });

  if (!mail.sent) {
    if (!env.otp.devEcho) {
      // Production: a code nobody received is useless — retire it and tell the user.
      await prisma.emailOtp.update({ where: { id: record.id }, data: { expires_at: new Date() } });
      throw new ApiError(503, "EMAIL_FAILED", "We could not send the verification email right now. Please try again shortly.");
    }
    console.warn(`[email-otp] email not sent (${mail.error}). Development code for ${email}: ${otp}`);
  }

  return {
    emailSent: mail.sent,
    expiresInSeconds: EXPIRY_MINUTES * 60,
    resendAfterSeconds: env.otp.resendCooldownSeconds,
    // Development only, and only when the email could NOT be delivered (e.g. SMTP not configured).
    ...(!mail.sent && env.otp.devEcho ? { devOtp: otp } : {}),
  };
}

/** Checks the code; returns a one-time verification token for the sign-up request. */
export async function verifyEmailOtp({ email, purpose = "signup", otp }) {
  const record = await prisma.emailOtp.findFirst({
    where: { email, purpose, verified_at: null },
    orderBy: { created_at: "desc" },
  });

  if (!record || record.expires_at <= new Date()) {
    throw ApiError.badRequest("This code has expired. Please request a new one.", "OTP_EXPIRED", { otp: "Expired" });
  }
  if (record.attempts >= env.otp.maxAttempts) {
    throw ApiError.tooMany("Too many wrong attempts. Please request a new code.", "OTP_LOCKED");
  }

  if (!safeEqualHex(record.otp_hash, hmac(email, purpose, otp))) {
    const attempts = record.attempts + 1;
    await prisma.emailOtp.update({ where: { id: record.id }, data: { attempts } });
    const left = env.otp.maxAttempts - attempts;
    throw ApiError.badRequest(
      left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Please request a new code.",
      left > 0 ? "OTP_INVALID" : "OTP_LOCKED",
      { otp: "Incorrect code" }
    );
  }

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.emailOtp.update({
    where: { id: record.id },
    data: {
      verified_at: new Date(),
      verification_token_hash: sha256(token),
      token_expires_at: new Date(Date.now() + TOKEN_MINUTES * 60_000),
    },
  });
  return { verificationToken: token, expiresInSeconds: TOKEN_MINUTES * 60 };
}

/**
 * Burns a verification token inside the caller's transaction.
 * Throws EMAIL_NOT_VERIFIED unless it matches this email + purpose and is still valid.
 */
export async function consumeEmailVerification(tx, { email, purpose = "signup", token }) {
  const record = token
    ? await tx.emailOtp.findUnique({ where: { verification_token_hash: sha256(token) } })
    : null;
  const valid =
    record &&
    record.purpose === purpose &&
    record.email.toLowerCase() === email.toLowerCase() &&
    record.verified_at &&
    !record.consumed_at &&
    record.token_expires_at > new Date();
  if (!valid) {
    throw ApiError.badRequest("Please verify your email with the code we sent before signing up.", "EMAIL_NOT_VERIFIED", {
      email: "Email not verified",
    });
  }
  // Conditional update: two parallel sign-ups with one token → only one succeeds
  const burned = await tx.emailOtp.updateMany({ where: { id: record.id, consumed_at: null }, data: { consumed_at: new Date() } });
  if (burned.count !== 1) {
    throw ApiError.badRequest("This verification was already used. Please verify your email again.", "EMAIL_NOT_VERIFIED", {
      email: "Email not verified",
    });
  }
}
