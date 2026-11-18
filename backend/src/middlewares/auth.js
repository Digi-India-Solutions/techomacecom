import prisma from "../../db/db.js";
import { ApiError } from "../lib/http.js";
import { readAccessToken, verifyAccessToken } from "../lib/tokens.js";
import { getRolePermissions } from "../rbac/permission.service.js";
import { SUPER_ADMIN_SLUG } from "../rbac/catalog.js";

function decode(req, subjectType) {
  const token = readAccessToken(req, subjectType);
  if (!token) return { error: ApiError.unauthorized() };
  try {
    return { payload: verifyAccessToken(token, subjectType) };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // The client should call /refresh and retry once.
      return { error: ApiError.unauthorized("Your session has expired", "TOKEN_EXPIRED") };
    }
    return { error: ApiError.unauthorized("Invalid session", "INVALID_TOKEN") };
  }
}

// ---------------------------------------------------------------------------
// Storefront customers
// ---------------------------------------------------------------------------

async function loadCustomer(id) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.deleted_at) return null;
  return customer;
}

/** Requires a signed-in, active customer. Sets req.customer. */
export async function requireCustomer(req, res, next) {
  const { payload, error } = decode(req, "customer");
  if (error) return next(error);
  const customer = await loadCustomer(BigInt(payload.sub));
  if (!customer) return next(ApiError.unauthorized("Account not found", "ACCOUNT_NOT_FOUND"));
  if (customer.status !== "active") return next(ApiError.forbidden("This account has been blocked. Contact support.", "ACCOUNT_BLOCKED"));
  req.customer = customer;
  next();
}

/** Guest-friendly routes (e.g. reviews): sets req.customer when a valid session exists. */
export async function optionalCustomer(req, res, next) {
  const { payload } = decode(req, "customer");
  if (payload) {
    const customer = await loadCustomer(BigInt(payload.sub));
    if (customer?.status === "active") req.customer = customer;
  }
  next();
}

// ---------------------------------------------------------------------------
// Admin staff
// ---------------------------------------------------------------------------

/**
 * Requires a signed-in, active staff member. Re-reads the user on every request,
 * so deactivating someone or changing their role takes effect immediately —
 * not when their access token expires. Sets req.admin and req.permissions.
 */
export async function requireAdmin(req, res, next) {
  const { payload, error } = decode(req, "admin");
  if (error) return next(error);

  const admin = await prisma.adminUser.findUnique({
    where: { id: BigInt(payload.sub) },
    include: { role: true },
  });
  if (!admin) return next(ApiError.unauthorized("Account not found", "ACCOUNT_NOT_FOUND"));
  if (admin.status !== "active") return next(ApiError.forbidden("Your account is deactivated", "ACCOUNT_INACTIVE"));

  req.admin = admin;
  req.permissions = await getRolePermissions(admin.role);
  req.isSuperAdmin = admin.role.slug === SUPER_ADMIN_SLUG;
  next();
}

/**
 * requirePermission('orders.edit')            → needs that permission
 * requirePermission('orders.view', 'orders.edit') → needs ALL of them
 * Document §13.1: "the UI hiding a button is not security" — every admin route uses this.
 */
export function requirePermission(...codes) {
  return (req, res, next) => {
    if (!req.admin) return next(ApiError.unauthorized());
    const missing = codes.filter((code) => !req.permissions.has(code));
    if (missing.length) {
      return next(ApiError.forbidden(`Your role is missing the ${missing.join(", ")} permission`, "PERMISSION_DENIED"));
    }
    next();
  };
}

/** Needs at least one of the codes (e.g. a page readable by view OR edit). */
export function requireAnyPermission(...codes) {
  return (req, res, next) => {
    if (!req.admin) return next(ApiError.unauthorized());
    if (!codes.some((code) => req.permissions.has(code))) {
      return next(ApiError.forbidden(`Your role needs one of: ${codes.join(", ")}`, "PERMISSION_DENIED"));
    }
    next();
  };
}
