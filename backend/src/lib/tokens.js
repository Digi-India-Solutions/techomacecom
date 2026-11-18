import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

/**
 * JWTs for two audiences that must never be interchangeable:
 *   customer → storefront (buydenmed.com)
 *   admin    → admin panel (admin.buydenmed.com)
 *
 * Access token  : short-lived, signed with JWT_SECRET_KEY
 * Refresh token : long-lived, signed with REFRESH_TOKEN_SECRET, carries a jti that
 *                 maps to one auth_sessions row (rotated on every refresh)
 *
 * Both travel in httpOnly cookies; the API also accepts `Authorization: Bearer`.
 */

export const AUDIENCE = {
  customer: "buydenmed:storefront",
  admin: "buydenmed:admin",
};

export const COOKIES = {
  customer: { access: "bd_at", refresh: "bd_rt", accessPath: "/api/v1", refreshPath: "/api/v1/auth" },
  admin: { access: "bda_at", refresh: "bda_rt", accessPath: "/api/v1/admin", refreshPath: "/api/v1/admin/auth" },
};

export function signAccessToken(subjectType, subjectId, extra = {}) {
  return jwt.sign({ typ: subjectType, ...extra }, env.jwt.accessSecret, {
    subject: String(subjectId),
    audience: AUDIENCE[subjectType],
    issuer: env.jwt.issuer,
    expiresIn: env.jwt.accessExpiry,
    algorithm: "HS256",
  });
}

/** Returns { token, jti, expiresAt } */
export function signRefreshToken(subjectType, subjectId) {
  const jti = crypto.randomBytes(24).toString("hex");
  const token = jwt.sign({ typ: subjectType }, env.jwt.refreshSecret, {
    subject: String(subjectId),
    audience: AUDIENCE[subjectType],
    issuer: env.jwt.issuer,
    expiresIn: env.jwt.refreshExpiry,
    jwtid: jti,
    algorithm: "HS256",
  });
  const { exp } = jwt.decode(token);
  return { token, jti, expiresAt: new Date(exp * 1000) };
}

/** Throws jsonwebtoken errors (TokenExpiredError / JsonWebTokenError) on failure. */
export function verifyAccessToken(token, subjectType) {
  return jwt.verify(token, env.jwt.accessSecret, {
    audience: AUDIENCE[subjectType],
    issuer: env.jwt.issuer,
    algorithms: ["HS256"],
  });
}

export function verifyRefreshToken(token, subjectType) {
  return jwt.verify(token, env.jwt.refreshSecret, {
    audience: AUDIENCE[subjectType],
    issuer: env.jwt.issuer,
    algorithms: ["HS256"],
  });
}

function baseCookie(path) {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: "lax",
    domain: env.cookie.domain,
    path,
  };
}

/**
 * @param remember false → refresh cookie lasts only for the browser session
 *                 (admin "Remember me" unticked)
 */
export function setAuthCookies(res, subjectType, { accessToken, refreshToken, remember = true }) {
  const c = COOKIES[subjectType];
  res.cookie(c.access, accessToken, { ...baseCookie(c.accessPath), maxAge: env.jwt.accessCookieMs });
  res.cookie(c.refresh, refreshToken, {
    ...baseCookie(c.refreshPath),
    ...(remember ? { maxAge: env.jwt.refreshCookieMs } : {}),
  });
}

export function clearAuthCookies(res, subjectType) {
  const c = COOKIES[subjectType];
  res.clearCookie(c.access, baseCookie(c.accessPath));
  res.clearCookie(c.refresh, baseCookie(c.refreshPath));
}

/** Bearer header first (mobile apps / Postman), then the audience's cookie. */
export function readAccessToken(req, subjectType) {
  const header = req.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return req.cookies?.[COOKIES[subjectType].access] || null;
}

export function readRefreshToken(req, subjectType) {
  return req.cookies?.[COOKIES[subjectType].refresh] || req.body?.refreshToken || null;
}

/** SHA-256 hex — for one-time tokens stored in the DB (invite / reset links). */
export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
