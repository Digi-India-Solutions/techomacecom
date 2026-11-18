import prisma from "../../db/db.js";
import { clientIp, userAgent, ApiError } from "../lib/http.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, readRefreshToken } from "../lib/tokens.js";
import { describeDevice } from "../lib/device.js";

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
    // sid ties the access token to this session, so signing a device out takes effect immediately
    accessToken: signAccessToken(subjectType, subjectId, { ...accessClaims, sid: refresh.jti }),
    refreshToken: refresh.token,
    remember,
  };
}

/**
 * Is the session behind an access token still signed in? (logout, "sign out device",
 * password change and refresh rotation all revoke it). Tokens without a sid were issued
 * before this check existed and are allowed until they expire.
 */
export async function isSessionActive(sid) {
  if (!sid) return true;
  const session = await prisma.authSession.findUnique({ where: { jti: sid }, select: { revoked_at: true, expires_at: true } });
  return Boolean(session && !session.revoked_at && session.expires_at > new Date());
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
      accessToken: signAccessToken(subjectType, subjectId, { ...accessClaims(subject), sid: next.jti }),
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

// ---------------------------------------------------------------------------
// "Signed-in devices" (profile pages)
// ---------------------------------------------------------------------------

/** jti of the refresh token this request carries (identifies "this device"), if any. */
export function currentSessionJti(req, subjectType) {
  try {
    return verifyRefreshToken(readRefreshToken(req, subjectType), subjectType).jti;
  } catch {
    return undefined;
  }
}

/**
 * Active sessions, newest first. Each refresh replaces the row, so there is one
 * row per signed-in browser and created_at is when it was last active.
 */
export async function listActiveSessions(subjectType, subjectId, currentJti) {
  const rows = await prisma.authSession.findMany({
    where: {
      subject_type: subjectType,
      [subjectColumn(subjectType)]: BigInt(subjectId),
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return rows
    .map((r) => ({
      id: String(r.id),
      ...describeDevice(r.user_agent),
      ipAddress: r.ip_address || null,
      lastActiveAt: r.created_at,
      expiresAt: r.expires_at,
      rememberMe: r.remember,
      current: Boolean(currentJti) && r.jti === currentJti,
    }))
    .sort((a, b) => Number(b.current) - Number(a.current));
}

/** Signs one other device out. The current device must use normal sign-out. */
export async function revokeSessionById(subjectType, subjectId, sessionId, currentJti) {
  const session = await prisma.authSession.findFirst({
    where: { id: sessionId, subject_type: subjectType, [subjectColumn(subjectType)]: BigInt(subjectId), revoked_at: null },
  });
  if (!session) throw ApiError.notFound("This device is already signed out.", "SESSION_NOT_FOUND");
  if (currentJti && session.jti === currentJti) {
    throw ApiError.badRequest("This is the device you are using. Use Sign out instead.", "CURRENT_SESSION");
  }
  await prisma.authSession.update({ where: { id: session.id }, data: { revoked_at: new Date() } });
  return { ...describeDevice(session.user_agent), id: String(session.id) };
}

/** Signs out every device except this one. Returns how many were signed out. */
export async function revokeOtherSessions(subjectType, subjectId, currentJti) {
  const { count } = await prisma.authSession.updateMany({
    where: {
      subject_type: subjectType,
      [subjectColumn(subjectType)]: BigInt(subjectId),
      revoked_at: null,
      ...(currentJti ? { NOT: { jti: currentJti } } : {}),
    },
    data: { revoked_at: new Date() },
  });
  return count;
}
