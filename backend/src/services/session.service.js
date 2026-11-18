import prisma from "../../db/db.js";
import { clientIp, userAgent, ApiError } from "../lib/http.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/tokens.js";

/**
 * Refresh-token sessions (auth_sessions table).
 *  • every login creates one session (one refresh token / jti)
 *  • every refresh revokes the old session and creates a new one (rotation)
 *  • presenting an already-rotated token = token theft → all sessions of that user revoked
 */

function subjectColumn(subjectType) {
  return subjectType === "admin" ? "admin_user_id" : "customer_id";
}

/** Creates a session and returns { accessToken, refreshToken, remember }. */
export async function issueTokens(req, subjectType, subjectId, { remember = true, accessClaims = {} } = {}) {
  const refresh = signRefreshToken(subjectType, subjectId);
  await prisma.authSession.create({
    data: {
      subject_type: subjectType,
      [subjectColumn(subjectType)]: BigInt(subjectId),
      jti: refresh.jti,
      remember,
      user_agent: userAgent(req),
      ip_address: clientIp(req),
      expires_at: refresh.expiresAt,
    },
  });
  return {
    accessToken: signAccessToken(subjectType, subjectId, accessClaims),
    refreshToken: refresh.token,
    remember,
  };
}

/**
 * Validates a refresh token and rotates it.
 * @param loadSubject async (id: bigint) => subject | null — must return null if the
 *        account is blocked / inactive so refresh stops working for it
 * @param accessClaims (subject) => extra access-token claims
 */
export async function rotateRefreshToken(req, subjectType, token, { loadSubject, accessClaims = () => ({}) }) {
  if (!token) throw ApiError.unauthorized("Session expired. Please sign in again.", "NO_REFRESH_TOKEN");

  let payload;
  try {
    payload = verifyRefreshToken(token, subjectType);
  } catch {
    throw ApiError.unauthorized("Session expired. Please sign in again.", "INVALID_REFRESH_TOKEN");
  }

  const session = await prisma.authSession.findUnique({ where: { jti: payload.jti } });
  if (!session || session.subject_type !== subjectType) {
    throw ApiError.unauthorized("Session expired. Please sign in again.", "INVALID_REFRESH_TOKEN");
  }

  if (session.revoked_at) {
    // A rotated token came back → someone else may hold it. Sign out everywhere.
    if (session.replaced_by) {
      await revokeAllSessions(subjectType, session[subjectColumn(subjectType)]);
      throw ApiError.unauthorized("Session expired. Please sign in again.", "REFRESH_TOKEN_REUSED");
    }
    // Revoked by logout, password change or deactivation
    throw ApiError.unauthorized("You have been signed out. Please sign in again.", "SESSION_REVOKED");
  }
  if (session.expires_at <= new Date()) {
    throw ApiError.unauthorized("Session expired. Please sign in again.", "REFRESH_TOKEN_EXPIRED");
  }

  const subjectId = session[subjectColumn(subjectType)];
  const subject = await loadSubject(subjectId);
  if (!subject) {
    await revokeAllSessions(subjectType, subjectId);
    throw ApiError.unauthorized("This account is no longer active.", "ACCOUNT_INACTIVE");
  }

  const next = signRefreshToken(subjectType, subjectId);
  await prisma.$transaction([
    prisma.authSession.update({
      where: { id: session.id },
      data: { revoked_at: new Date(), replaced_by: next.jti },
    }),
    prisma.authSession.create({
      data: {
        subject_type: subjectType,
        [subjectColumn(subjectType)]: subjectId,
        jti: next.jti,
        remember: session.remember,
        user_agent: userAgent(req),
        ip_address: clientIp(req),
        expires_at: next.expiresAt,
      },
    }),
  ]);

  return {
    subject,
    tokens: {
      accessToken: signAccessToken(subjectType, subjectId, accessClaims(subject)),
      refreshToken: next.token,
      remember: session.remember,
    },
  };
}

/** Logout: revoke the session behind this refresh token (if it is valid). */
export async function revokeByRefreshToken(subjectType, token) {
  if (!token) return;
  try {
    const payload = verifyRefreshToken(token, subjectType);
    await prisma.authSession.updateMany({
      where: { jti: payload.jti, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  } catch {
    // expired / invalid token — nothing to revoke
  }
}

export async function revokeAllSessions(subjectType, subjectId, { exceptJti } = {}) {
  await prisma.authSession.updateMany({
    where: {
      subject_type: subjectType,
      [subjectColumn(subjectType)]: BigInt(subjectId),
      revoked_at: null,
      ...(exceptJti ? { NOT: { jti: exceptJti } } : {}),
    },
    data: { revoked_at: new Date() },
  });
}
