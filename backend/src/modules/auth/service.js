import { OAuth2Client } from "google-auth-library";
import prisma from "../../../db/db.js";
import env from "../../../config/env.js";
import { ApiError } from "../../lib/http.js";
import { sendOtp, verifyOtp } from "../../services/otp.service.js";

let googleClient;

/** Shape returned to the storefront (camelCase, no internal columns). */
export function toCustomerDto(c) {
  return {
    id: String(c.id),
    name: c.name || "",
    mobile: c.mobile || null,
    email: c.email || null,
    customerType: c.customer_type,
    avatarUrl: c.avatar_url || null,
    mobileVerified: Boolean(c.mobile_verified_at),
    emailVerified: Boolean(c.email_verified_at),
    hasGoogle: Boolean(c.google_id),
    profileComplete: Boolean(c.name && c.mobile),
    createdAt: c.created_at,
    addresses: (c.addresses || []).map((a) => ({
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
    })),
    gstDetails: (c.gst_details || []).map((g) => ({
      id: String(g.id),
      gstin: g.gstin,
      companyName: g.company_name,
      billingAddress: g.billing_address,
      isDefault: g.is_default,
    })),
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

export async function updateProfile(customer, { name, email, customerType }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (customerType !== undefined) data.customer_type = customerType;
  if (email !== undefined) {
    const next = email ? email.toLowerCase() : null;
    if (next !== (customer.email || null)) {
      if (!next && !customer.mobile) throw ApiError.badRequest("Add a mobile number before removing your email.");
      if (customer.google_id && next !== customer.email) {
        throw ApiError.badRequest("This email is your Google sign-in and cannot be changed here.", "EMAIL_LOCKED");
      }
      data.email = next;
      data.email_verified_at = null;
    }
  }
  return prisma.customer.update({ where: { id: customer.id }, data });
}

/** Google users add a mobile with OTP (needed for checkout, delivery and rentals). */
export async function requestMobileLinkOtp(customer, mobile, ip) {
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
