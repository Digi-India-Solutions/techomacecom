import { ok, clientIp } from "../../lib/http.js";
import { setAuthCookies, clearAuthCookies, readRefreshToken } from "../../lib/tokens.js";
import { issueTokens, rotateRefreshToken, revokeByRefreshToken } from "../../services/session.service.js";
import env from "../../../config/env.js";
import * as service from "./service.js";

/** Issues the session cookies (httpOnly) and returns the customer profile. */
async function signIn(req, res, customer, isNewUser, status = 200) {
  const tokens = await issueTokens(req, "customer", customer.id);
  setAuthCookies(res, "customer", tokens);
  const profile = await service.getCustomerProfile(customer.id);
  return ok(res, { user: service.toCustomerDto(profile), isNewUser }, { status });
}

/** POST /auth/signup/email/send-otp — step 1: email a verification code */
export async function sendSignupEmailOtp(req, res) {
  const result = await service.requestSignupEmailOtp(req.body.email, clientIp(req));
  return ok(res, {
    ...result,
    message: result.emailSent
      ? `We sent a 6-digit code to ${req.body.email}`
      : "Email is not configured on this server — use the development code shown",
  });
}

/** POST /auth/signup/email/verify-otp — step 2: code → one-time verification token */
export async function verifySignupEmailOtp(req, res) {
  const result = await service.verifySignupEmailOtp(req.body.email, req.body.otp);
  return ok(res, { ...result, message: "Email verified" });
}

/** POST /auth/signup — step 3: create the account and sign in straight away */
export async function signup(req, res) {
  const customer = await service.signupWithEmail(req.body);
  return signIn(req, res, customer, true, 201);
}

/** POST /auth/login — email + password */
export async function login(req, res) {
  const customer = await service.loginWithPassword(req.body);
  return signIn(req, res, customer, false);
}

const RESET_SENT_MESSAGE =
  "If an account exists for this email, we've sent a link to reset your password. Please check your inbox (and spam folder).";

/** POST /auth/forgot-password — same answer whether or not the email has an account */
export async function forgotPassword(req, res) {
  const { devResetUrl } = await service.requestPasswordReset(req.body.email);
  return ok(res, {
    message: RESET_SENT_MESSAGE,
    // Development only, when SMTP is not configured
    ...(devResetUrl ? { devResetUrl } : {}),
  });
}

/** GET /auth/reset-password/check?token= — is this link still usable? */
export async function checkResetLink(req, res) {
  return ok(res, await service.checkResetToken(req.validatedQuery.token));
}

/** POST /auth/reset-password — set the new password, then sign in on this device */
export async function resetPassword(req, res) {
  const customer = await service.resetPasswordWithToken(req.body);
  return signIn(req, res, customer, false);
}

/** POST /auth/otp/send — DISABLED (route commented out) */
export async function sendOtp(req, res) {
  const result = await service.requestLoginOtp(req.body.mobile, clientIp(req));
  return ok(res, { ...result, message: `OTP sent to +91 ${req.body.mobile}` });
}

/** POST /auth/otp/verify — signs in, or signs up a new mobile */
export async function verifyOtp(req, res) {
  const { customer, isNewUser } = await service.loginWithOtp(req.body);
  return signIn(req, res, customer, isNewUser);
}

/** POST /auth/google */
export async function google(req, res) {
  const { customer, isNewUser } = await service.loginWithGoogle(req.body);
  return signIn(req, res, customer, isNewUser);
}

/** GET /auth/config — what the sign-in screen should offer */
export function config(req, res) {
  return ok(res, {
    // Sign-in is email + password; mobile OTP sign-in is switched off
    signInMethods: ["email_password"],
    otpLoginEnabled: false,
    googleEnabled: Boolean(env.google.clientId),
    googleClientId: env.google.clientId || null,
    otpLength: 6,
  });
}

/** POST /auth/refresh — rotates the refresh token */
export async function refresh(req, res) {
  const { subject, tokens } = await rotateRefreshToken(req, "customer", readRefreshToken(req, "customer"), {
    loadSubject: service.loadActiveCustomer,
  });
  setAuthCookies(res, "customer", tokens);
  const profile = await service.getCustomerProfile(subject.id);
  return ok(res, { user: service.toCustomerDto(profile) });
}

/** POST /auth/logout */
export async function logout(req, res) {
  await revokeByRefreshToken("customer", readRefreshToken(req, "customer"));
  clearAuthCookies(res, "customer");
  return ok(res, { message: "Signed out" });
}

/** GET /auth/me */
export async function me(req, res) {
  const profile = await service.getCustomerProfile(req.customer.id);
  return ok(res, { user: service.toCustomerDto(profile) });
}

/** PUT /auth/me */
export async function updateMe(req, res) {
  await service.updateProfile(req.customer, req.body);
  const profile = await service.getCustomerProfile(req.customer.id);
  return ok(res, { user: service.toCustomerDto(profile) });
}

/** POST /auth/me/mobile/send */
export async function sendMobileOtp(req, res) {
  const result = await service.requestMobileLinkOtp(req.customer, req.body.mobile, clientIp(req));
  return ok(res, { ...result, message: `OTP sent to +91 ${req.body.mobile}` });
}

/** POST /auth/me/mobile/verify */
export async function verifyMobile(req, res) {
  await service.linkMobile(req.customer, req.body);
  const profile = await service.getCustomerProfile(req.customer.id);
  return ok(res, { user: service.toCustomerDto(profile) });
}
