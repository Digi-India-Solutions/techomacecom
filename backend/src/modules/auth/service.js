import { OAuth2Client } from "google-auth-library";
import prisma from "../../../db/db.js";
import env from "../../../config/env.js";
import { ApiError } from "../../lib/http.js";
import { sendOtp, verifyOtp } from "../../services/otp.service.js";
import { sendEmailOtp, verifyEmailOtp, consumeEmailVerification } from "../../services/email-otp.service.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { randomToken, sha256 } from "../../lib/tokens.js";
import { sendMail, actionEmail } from "../../lib/mailer.js";
import { revokeAllSessions } from "../../services/session.service.js";
import { publicUrl } from "../../lib/storage.js";
import { GST_STATE_CODES } from "../../lib/money.js";

let googleClient;

export function toAddressDto(a) {
  return {
    id: String(a.id),
    name: a.name,
    phone: a.phone,
    organisationName: a.organisation_name,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    type: a.type,
    isDefault: a.is_default,
    updatedAt: a.updated_at,
  };
}

export function toGstDto(g) {
  const code = g.gstin.slice(0, 2) === "25" ? "26" : g.gstin.slice(0, 2);
  return {
    id: String(g.id),
    gstin: g.gstin,
    companyName: g.company_name,
    billingAddress: g.billing_address,
    stateCode: code,
    stateName: GST_STATE_CODES[code] || null,
    pan: g.gstin.slice(2, 12),
    isDefault: g.is_default,
    updatedAt: g.updated_at,
  };
}

/** Shape returned to the storefront (camelCase, no internal columns). */
export function toCustomerDto(c) {
  return {
    id: String(c.id),
    name: c.name || "",
    mobile: c.mobile || null,
    email: c.email || null,
    customerType: c.customer_type,
    qualification: c.qualification || null,
    registrationNumber: c.registration_number || null,
    avatarUrl: publicUrl(c.avatar_url),
    mobileVerified: Boolean(c.mobile_verified_at),
    emailVerified: Boolean(c.email_verified_at),
    hasGoogle: Boolean(c.google_id),
    // Email + password account: the email is the verified sign-in id (cannot be changed in the profile)
    hasPassword: Boolean(c.password_hash),
    profileComplete: Boolean(c.name && c.mobile),
    createdAt: c.created_at,
    lastLoginAt: c.last_login_at,
    addresses: (c.addresses || []).map(toAddressDto),
    gstDetails: (c.gst_details || []).map(toGstDto),
  };
}

export async function getCustomerProfile(id) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ is_default: "desc" }, { created_at: "asc" }] },
      gst_details: { orderBy: [{ is_default: "desc" }, { created_at: "asc" }] },
    },
  });
}

function assertActive(customer) {
  if (customer.deleted_at) throw ApiError.forbidden("This account has been closed. Contact support.", "ACCOUNT_CLOSED");
  if (customer.status !== "active") throw ApiError.forbidden("This account has been blocked. Contact support.", "ACCOUNT_BLOCKED");
}

// ---------------------------------------------------------------------------
// Email + password sign-up / sign-in (current storefront login)
// ---------------------------------------------------------------------------

const EMAIL_TAKEN = () =>
  ApiError.conflict("An account with this email already exists. Please sign in.", "EMAIL_TAKEN", {
    email: "Already registered",
  });
const MOBILE_TAKEN = () =>
  ApiError.conflict("This mobile number is already linked to another account.", "MOBILE_IN_USE", {
    mobile: "Already registered",
  });
const INVALID_LOGIN = () => ApiError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS");

/** Step 1 of sign-up: email a verification code (refused if the email already has an account). */
export async function requestSignupEmailOtp(email, ip) {
  const existing = await prisma.customer.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw EMAIL_TAKEN();
  return sendEmailOtp({ email, purpose: "signup", ip });
}

/** Step 2: check the code → one-time token the sign-up form sends back. */
export function verifySignupEmailOtp(email, otp) {
  return verifyEmailOtp({ email, purpose: "signup", otp });
}

/**
 * Step 3: create the account (verified email + mobile + argon2id password hash).
 * The caller signs the new customer in straight away.
 */
export async function signupWithEmail({ name, email, emailVerificationToken, mobile, password, customerType }) {
  const [emailOwner, mobileOwner] = await Promise.all([
    prisma.customer.findUnique({ where: { email }, select: { id: true } }),
    prisma.customer.findUnique({ where: { mobile }, select: { id: true } }),
  ]);
  if (emailOwner) throw EMAIL_TAKEN();
  if (mobileOwner) throw MOBILE_TAKEN();

  const passwordHash = await hashPassword(password); // slow on purpose — done before the transaction
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      await consumeEmailVerification(tx, { email, purpose: "signup", token: emailVerificationToken });
      return tx.customer.create({
        data: {
          name,
          email,
          email_verified_at: now,
          mobile,
          password_hash: passwordHash,
          password_changed_at: now,
          customer_type: customerType || "individual",
          last_login_at: now,
        },
      });
    });
  } catch (error) {
    // Lost a race with a parallel sign-up for the same email / mobile
    if (error?.code === "P2002") {
      const target = String(error.meta?.target || error.meta?.driverAdapterError?.cause?.constraint?.fields || "");
      throw target.includes("mobile") ? MOBILE_TAKEN() : EMAIL_TAKEN();
    }
    throw error;
  }
}

/**
 * Sign in with email + password. One generic error for "no such email" and
 * "wrong password" (no account enumeration); 5 wrong passwords lock the account
 * for CUSTOMER_LOCK_MINUTES.
 */
export async function loginWithPassword({ email, password }) {
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    await verifyPassword(null, password); // same timing as a real check
    throw INVALID_LOGIN();
  }

  if (customer.locked_until && customer.locked_until > new Date()) {
    const minutes = Math.ceil((customer.locked_until.getTime() - Date.now()) / 60_000);
    throw new ApiError(423, "ACCOUNT_LOCKED", `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  // Accounts created with Google / mobile OTP have no password → same generic error
  const valid = await verifyPassword(customer.password_hash, password);
  if (!valid) {
    const attempts = customer.failed_login_attempts + 1;
    const lock = attempts >= env.customer.lockAfterFailedLogins;
    await prisma.customer.update({
      where: { id: customer.id },
      data: lock
        ? { failed_login_attempts: 0, locked_until: new Date(Date.now() + env.customer.lockMinutes * 60_000) }
        : { failed_login_attempts: attempts },
    });
    if (lock) {
      throw new ApiError(423, "ACCOUNT_LOCKED", `Too many failed attempts. Try again in ${env.customer.lockMinutes} minutes.`);
    }
    throw INVALID_LOGIN();
  }

  assertActive(customer);
  return prisma.customer.update({
    where: { id: customer.id },
    data: { failed_login_attempts: 0, locked_until: null, last_login_at: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Forgot / reset password (emailed one-time link)
// ---------------------------------------------------------------------------

const RESET_LINK_INVALID = () =>
  ApiError.badRequest("This reset link has expired or was already used. Please request a new one.", "RESET_LINK_INVALID");

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

/** "ankit.bowade@gmail.com" → "an•••••••••e@gmail.com" (shown on the reset page) */
export function maskEmail(email) {
  const [user, domain] = String(email).split("@");
  if (!domain) return "•••";
  const shown = user.length <= 2 ? user[0] : `${user.slice(0, 2)}${"•".repeat(Math.min(user.length - 3, 8))}${user.slice(-1)}`;
  return `${shown}@${domain}`;
}

/**
 * "Forgot password": emails a one-time link to reset the password.
 *
 * Always resolves the same way (the controller sends one generic message) whether or
 * not the email has an account — nobody can use this form to find out who is registered.
 * Only the SHA-256 of the token is stored; a new request replaces the old link.
 * A 60 s cooldown per account stops mail-bombing someone's inbox.
 *
 * Returns { devResetUrl } only in development when the email could not be sent.
 */
export async function requestPasswordReset(email) {
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || customer.deleted_at || customer.status !== "active") return {};

  const cooldownMs = env.customer.resetCooldownSeconds * 1000;
  if (customer.password_reset_requested_at && Date.now() - customer.password_reset_requested_at.getTime() < cooldownMs) {
    return {}; // silently skip — the previous email is still on its way
  }

  const token = randomToken(32);
  const minutes = env.customer.resetExpiryMinutes;
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      password_reset_token_hash: sha256(token),
      password_reset_expires_at: new Date(Date.now() + minutes * 60_000),
      password_reset_requested_at: new Date(),
    },
  });

  const url = `${env.frontendUrl}/reset-password?token=${token}`;

  // Development without SMTP: hand the link back so the flow can be tested
  if (!(env.mail.user && env.mail.pass) && !env.isProduction) {
    console.log(`\n🔑  Customer password reset link for ${customer.email}:\n    ${url}\n`);
    return { devResetUrl: url };
  }

  // Sent in the background: waiting for SMTP would make "account exists" answers
  // measurably slower than "no account" ones (timing-based email enumeration).
  sendMail({
    to: customer.email,
    subject: "Reset your Buy Denmed password",
    ...actionEmail({
      heading: "Reset your password",
      intro: `Hi ${escapeHtml(customer.name || "there")}, we received a request to reset the password for your Buy Denmed account (${escapeHtml(customer.email)}).`,
      buttonLabel: "Reset password",
      url,
      footer: `This link expires in ${minutes} minutes and can be used once. If you did not ask for this, you can ignore this email — your password will not change.`,
    }),
  }).then((result) => {
    if (!result.sent) console.error(`[password-reset] email to ${customer.email} failed: ${result.error}`);
  });
  return {};
}

async function findByResetToken(token) {
  const customer = await prisma.customer.findUnique({ where: { password_reset_token_hash: sha256(token) } });
  if (!customer || !customer.password_reset_expires_at || customer.password_reset_expires_at <= new Date()) {
    throw RESET_LINK_INVALID();
  }
  return customer;
}

/** Lets the reset page tell the user up front that a link is dead (no password typed in vain). */
export async function checkResetToken(token) {
  const customer = await findByResetToken(token);
  return { email: maskEmail(customer.email), expiresAt: customer.password_reset_expires_at };
}

/**
 * Sets the new password from a valid link. The link is single-use, every existing
 * session is signed out (someone else may know the old password), the lockout is
 * cleared, and a "password changed" email is sent as a security notice.
 * Clicking the emailed link also proves the customer owns the email.
 */
export async function resetPasswordWithToken({ token, password }) {
  const customer = await findByResetToken(token);
  assertActive(customer);

  const passwordHash = await hashPassword(password);
  // Conditional update on the token hash: two tabs submitting the same link → only one wins
  const updated = await prisma.customer.updateMany({
    where: { id: customer.id, password_reset_token_hash: sha256(token) },
    data: {
      password_hash: passwordHash,
      password_changed_at: new Date(),
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      failed_login_attempts: 0,
      locked_until: null,
      email_verified_at: customer.email_verified_at ?? new Date(),
      last_login_at: new Date(),
    },
  });
  if (updated.count !== 1) throw RESET_LINK_INVALID();

  await revokeAllSessions("customer", customer.id);

  // Security notice — a failure here must not undo the reset
  sendMail({
    to: customer.email,
    subject: "Your Buy Denmed password was changed",
    ...actionEmail({
      heading: "Your password was changed",
      intro: `Hi ${escapeHtml(customer.name || "there")}, the password for your Buy Denmed account was just changed and all other devices were signed out.`,
      buttonLabel: "Go to Buy Denmed",
      url: `${env.frontendUrl}/login`,
      footer: "If this wasn't you, reset your password again right away using “Forgot password” and contact our support team.",
    }),
  }).catch(() => {});

  return prisma.customer.findUnique({ where: { id: customer.id } });
}

// ---------------------------------------------------------------------------
// Mobile OTP sign-in — DISABLED (routes commented out in routes.js). Kept so it
// can be switched back on; requestMobileLinkOtp / linkMobile below still use OTPs.
// ---------------------------------------------------------------------------

export async function requestLoginOtp(mobile, ip) {
  const existing = await prisma.customer.findUnique({ where: { mobile }, select: { id: true } });
  const result = await sendOtp({ mobile, purpose: "login", ip });
  return { ...result, isNewUser: !existing };
}

/**
 * Sign-in and sign-up in one step (document §5 step 4: OTP login).
 * A mobile with no account gets one created here.
 */
export async function loginWithOtp({ mobile, otp, customerType, name }) {
  await verifyOtp({ mobile, otp, purpose: "login" });

  let customer = await prisma.customer.findUnique({ where: { mobile } });
  let isNewUser = false;

  if (customer) {
    assertActive(customer);
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { last_login_at: new Date(), mobile_verified_at: customer.mobile_verified_at ?? new Date() },
    });
  } else {
    isNewUser = true;
    customer = await prisma.customer.create({
      data: {
        mobile,
        name: name || null,
        customer_type: customerType || "individual",
        mobile_verified_at: new Date(),
        last_login_at: new Date(),
      },
    });
  }
  return { customer, isNewUser };
}

/**
 * "Continue with Google" — verifies the Google ID token server-side, then:
 *   google_id match → sign in;  verified email match → link Google & sign in;  else → sign up.
 */
export async function loginWithGoogle({ credential, customerType }) {
  if (!env.google.clientId) {
    throw new ApiError(503, "GOOGLE_NOT_CONFIGURED", "Google sign-in is not set up yet. Please use mobile OTP.");
  }
  googleClient ??= new OAuth2Client(env.google.clientId);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized("Google sign-in failed. Please try again.", "GOOGLE_TOKEN_INVALID");
  }
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw ApiError.unauthorized("Your Google account email is not verified.", "GOOGLE_EMAIL_UNVERIFIED");
  }

  const email = payload.email.toLowerCase();
  let customer = await prisma.customer.findUnique({ where: { google_id: payload.sub } });
  let isNewUser = false;

  if (!customer) {
    const byEmail = await prisma.customer.findUnique({ where: { email } });
    if (byEmail) {
      if (byEmail.google_id && byEmail.google_id !== payload.sub) {
        throw ApiError.conflict("This email is linked to a different Google account.", "GOOGLE_ACCOUNT_MISMATCH");
      }
      customer = await prisma.customer.update({
        where: { id: byEmail.id },
        data: {
          google_id: payload.sub,
          email_verified_at: byEmail.email_verified_at ?? new Date(),
          avatar_url: byEmail.avatar_url ?? payload.picture ?? null,
          name: byEmail.name ?? payload.name ?? null,
        },
      });
    }
  }

  if (customer) {
    assertActive(customer);
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { last_login_at: new Date() } });
  } else {
    isNewUser = true;
    customer = await prisma.customer.create({
      data: {
        email,
        name: payload.name || null,
        google_id: payload.sub,
        avatar_url: payload.picture || null,
        email_verified_at: new Date(),
        customer_type: customerType || "individual",
        last_login_at: new Date(),
      },
    });
  }
  return { customer, isNewUser };
}

export async function updateProfile(customer, { name, email, customerType, qualification, registrationNumber }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (customerType !== undefined) data.customer_type = customerType;
  if (qualification !== undefined) data.qualification = qualification;
  if (registrationNumber !== undefined) data.registration_number = registrationNumber;
  if (email !== undefined) {
    const next = email ? email.toLowerCase() : null;
    if (next !== (customer.email?.toLowerCase() || null)) {
      if (!next && !customer.mobile) {
        throw ApiError.badRequest("Add a mobile number before removing your email.", "EMAIL_REQUIRED", { email: "Required" });
      }
      if (customer.google_id && customer.email) {
        throw ApiError.badRequest("This email is your Google sign-in and cannot be changed here.", "EMAIL_LOCKED", {
          email: "Linked to Google sign-in",
        });
      }
      if (next) {
        const owner = await prisma.customer.findUnique({ where: { email: next }, select: { id: true } });
        if (owner && owner.id !== customer.id) {
          throw ApiError.conflict("This email is already used by another account.", "EMAIL_IN_USE", { email: "Already in use" });
        }
      }
      // The email is the (verified) sign-in id of password accounts — never swapped for an unverified one
      if (customer.password_hash) {
        throw ApiError.badRequest("Your sign-in email cannot be changed here.", "EMAIL_LOCKED", { email: "Sign-in email" });
      }
      data.email = next;
      data.email_verified_at = null;
    }
  }
  if (!Object.keys(data).length) return customer;
  return prisma.customer.update({ where: { id: customer.id }, data });
}

/** Google users add a mobile with OTP (needed for checkout, delivery and rentals). */
export async function requestMobileLinkOtp(customer, mobile, ip) {
  if (customer.mobile === mobile) {
    throw ApiError.badRequest("This is already your mobile number.", "SAME_MOBILE", { mobile: "Same as current" });
  }
  const owner = await prisma.customer.findUnique({ where: { mobile }, select: { id: true } });
  if (owner && owner.id !== customer.id) {
    throw ApiError.conflict("This mobile number is already linked to another account.", "MOBILE_IN_USE");
  }
  return sendOtp({ mobile, purpose: "login", ip });
}

export async function linkMobile(customer, { mobile, otp }) {
  await verifyOtp({ mobile, otp, purpose: "login" });
  const owner = await prisma.customer.findUnique({ where: { mobile }, select: { id: true } });
  if (owner && owner.id !== customer.id) {
    throw ApiError.conflict("This mobile number is already linked to another account.", "MOBILE_IN_USE");
  }
  return prisma.customer.update({
    where: { id: customer.id },
    data: { mobile, mobile_verified_at: new Date() },
  });
}

export async function loadActiveCustomer(id) {
  const c = await prisma.customer.findUnique({ where: { id } });
  return c && !c.deleted_at && c.status === "active" ? c : null;
}
