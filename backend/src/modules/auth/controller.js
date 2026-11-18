import { ok, clientIp, ApiError } from "../../lib/http.js";
import { setAuthCookies, clearAuthCookies, readRefreshToken } from "../../lib/tokens.js";
import {
  issueTokens,
  rotateRefreshToken,
  revokeByRefreshToken,
  currentSessionJti,
  listActiveSessions,
  revokeSessionById,
  revokeOtherSessions,
} from "../../services/session.service.js";
import env from "../../../config/env.js";
import * as service from "./service.js";

async function signIn(req, res, customer, isNewUser) {
  const tokens = await issueTokens(req, "customer", customer.id);
  setAuthCookies(res, "customer", tokens);
  const profile = await service.getCustomerProfile(customer.id);
  return ok(res, { user: service.toCustomerDto(profile), isNewUser });
}

/** POST /auth/otp/send */
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

/** GET /auth/sessions — signed-in devices */
export async function sessions(req, res) {
  return ok(res, await listActiveSessions("customer", req.customer.id, currentSessionJti(req, "customer")));
}

/** DELETE /auth/sessions/:id */
export async function revokeSession(req, res) {
  const device = await revokeSessionById("customer", req.customer.id, req.validatedParams.id, currentSessionJti(req, "customer"));
  return ok(res, { message: `${device.label} has been signed out.` });
}

/** POST /auth/sessions/revoke-others */
export async function revokeOthers(req, res) {
  const jti = currentSessionJti(req, "customer");
  if (!jti) throw ApiError.unauthorized("Please sign in again to manage your devices.", "NO_REFRESH_TOKEN");
  const count = await revokeOtherSessions("customer", req.customer.id, jti);
  return ok(res, {
    count,
    message: count ? `Signed out of ${count} other device${count === 1 ? "" : "s"}.` : "No other devices were signed in.",
  });
}
