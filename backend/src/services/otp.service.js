import crypto from "node:crypto";
import prisma from "../../db/db.js";
import env from "../../config/env.js";
import { ApiError } from "../lib/http.js";
import { sendOtpSms } from "../lib/sms.js";

/**
 * Mobile OTPs (otp_requests) — document §7.2 / §13.1:
 *  • 6 digits, stored only as an HMAC hash
 *  • valid for 5 minutes, max 5 wrong attempts
 *  • max 3 sends per mobile per 10 minutes
 * purpose: "login" (storefront sign-in / sign-up, adding a mobile) or "review"
 */

function hashOtp(mobile, purpose, otp) {
  return crypto.createHmac("sha256", env.otp.secret).update(`${purpose}:${mobile}:${otp}`).digest("hex");
}

function safeEqual(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export async function sendOtp({ mobile, purpose = "login", ip }) {
  const now = Date.now();
  const windowStart = new Date(now - env.otp.sendWindowMinutes * 60 * 1000);

  const recent = await prisma.otpRequest.findMany({
    where: { mobile, purpose, created_at: { gte: windowStart } },
    orderBy: { created_at: "desc" },
    select: { created_at: true },
  });

  const last = recent[0];
  if (last) {
    const waitMs = env.otp.resendCooldownSeconds * 1000 - (now - last.created_at.getTime());
    if (waitMs > 0) {
      throw ApiError.tooMany(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another OTP`, "OTP_COOLDOWN");
    }
  }
  if (recent.length >= env.otp.sendLimit) {
    const oldest = recent[recent.length - 1].created_at.getTime();
    const minutes = Math.ceil((oldest + env.otp.sendWindowMinutes * 60 * 1000 - now) / 60000);
    throw ApiError.tooMany(`Too many OTP requests for this number. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, "OTP_LIMIT");
  }

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(now + env.otp.expiryMinutes * 60 * 1000);

  // Only the newest code works: expire any earlier unused ones.
  await prisma.$transaction([
    prisma.otpRequest.updateMany({
      where: { mobile, purpose, verified_at: null, expires_at: { gt: new Date(now) } },
      data: { expires_at: new Date(now) },
    }),
    prisma.otpRequest.create({
      data: { mobile, purpose, otp_hash: hashOtp(mobile, purpose, otp), expires_at: expiresAt, ip_address: ip },
    }),
  ]);

  try {
    await sendOtpSms(mobile, otp);
  } catch (error) {
    console.error("[otp] SMS send failed:", error.message);
    throw new ApiError(503, "SMS_FAILED", "We could not send the OTP right now. Please try again shortly.");
  }

  return {
    expiresInSeconds: env.otp.expiryMinutes * 60,
    resendAfterSeconds: env.otp.resendCooldownSeconds,
    // Development only (OTP_DEV_ECHO): lets you sign in without an SMS provider.
    ...(env.otp.devEcho ? { devOtp: otp } : {}),
  };
}

/** Throws on a wrong / expired / locked code; marks the OTP as used on success. */
export async function verifyOtp({ mobile, purpose = "login", otp }) {
  const record = await prisma.otpRequest.findFirst({
    where: { mobile, purpose, verified_at: null },
    orderBy: { created_at: "desc" },
  });

  if (!record || record.expires_at <= new Date()) {
    throw ApiError.badRequest("This OTP has expired. Please request a new one.", "OTP_EXPIRED");
  }
  if (record.attempts >= env.otp.maxAttempts) {
    throw ApiError.tooMany("Too many wrong attempts. Please request a new OTP.", "OTP_LOCKED");
  }

  if (!safeEqual(record.otp_hash, hashOtp(mobile, purpose, otp))) {
    const attempts = record.attempts + 1;
    await prisma.otpRequest.update({ where: { id: record.id }, data: { attempts } });
    const left = env.otp.maxAttempts - attempts;
    throw ApiError.badRequest(
      left > 0 ? `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Please request a new OTP.",
      left > 0 ? "OTP_INVALID" : "OTP_LOCKED"
    );
  }

  await prisma.otpRequest.update({ where: { id: record.id }, data: { verified_at: new Date() } });
  return true;
}
