import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { storeAvatar, discardAvatar } from "../../services/avatar.service.js";
import { MAX_ADDRESSES, MAX_GST_PROFILES } from "./validator.js";

/**
 * Customer account data: saved addresses, GST details and profile photo.
 * Every query is scoped to the signed-in customer, so one customer can never
 * read or change another's rows (a foreign id simply returns 404).
 *
 * Exactly one default address / GST profile when any exist:
 *   • the first one saved becomes the default
 *   • choosing a new default clears the old one in the same transaction
 *     (addresses also have a partial unique index as a backstop)
 *   • deleting the default promotes the most recently updated remaining row
 */

const ORDER = [{ is_default: "desc" }, { created_at: "asc" }];

async function findOwned(tx, model, customerId, id, label) {
  const row = await tx[model].findFirst({ where: { id, customer_id: customerId } });
  if (!row) throw ApiError.notFound(`${label} not found`);
  return row;
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

const addressColumns = (d) => ({
  type: d.type,
  name: d.name,
  phone: d.phone,
  organisation_name: d.type === "home" ? null : d.organisationName,
  line1: d.line1,
  line2: d.line2,
  landmark: d.landmark,
  city: d.city,
  state: d.state,
  pincode: d.pincode,
});

export function listAddresses(customerId) {
  return prisma.address.findMany({ where: { customer_id: customerId }, orderBy: ORDER });
}

export function createAddress(customerId, data) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { customer_id: customerId } });
    if (count >= MAX_ADDRESSES) {
      throw ApiError.badRequest(`You can save up to ${MAX_ADDRESSES} addresses. Delete one you no longer use.`, "ADDRESS_LIMIT");
    }
    const makeDefault = data.isDefault || count === 0;
    if (makeDefault) {
      await tx.address.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } });
    }
    return tx.address.create({ data: { customer_id: customerId, ...addressColumns(data), is_default: makeDefault } });
  });
}

export function updateAddress(customerId, id, data) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, "address", customerId, id, "Address");
    // Unticking "default" on the default address does nothing — pick another address as default instead.
    const makeDefault = current.is_default || data.isDefault;
    if (makeDefault && !current.is_default) {
      await tx.address.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } });
    }
    return tx.address.update({ where: { id }, data: { ...addressColumns(data), is_default: makeDefault } });
  });
}

export function setDefaultAddress(customerId, id) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, "address", customerId, id, "Address");
    if (current.is_default) return current;
    await tx.address.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } });
    return tx.address.update({ where: { id }, data: { is_default: true } });
  });
}

export function deleteAddress(customerId, id) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, "address", customerId, id, "Address");
    await tx.address.delete({ where: { id } });
    if (current.is_default) {
      const next = await tx.address.findFirst({ where: { customer_id: customerId }, orderBy: { updated_at: "desc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { is_default: true } });
    }
    return current;
  });
}

// ---------------------------------------------------------------------------
// GST details (B2B invoices — document: GSTIN optional at checkout)
// ---------------------------------------------------------------------------

async function assertGstinNotSaved(tx, customerId, gstin, exceptId) {
  const dup = await tx.customerGstDetail.findFirst({
    where: { customer_id: customerId, gstin, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (dup) throw ApiError.conflict("You have already saved this GSTIN.", "GSTIN_EXISTS", { gstin: "Already saved" });
}

const gstColumns = (d) => ({ gstin: d.gstin, company_name: d.companyName, billing_address: d.billingAddress });

export function listGst(customerId) {
  return prisma.customerGstDetail.findMany({ where: { customer_id: customerId }, orderBy: ORDER });
}

export function createGst(customerId, data) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.customerGstDetail.count({ where: { customer_id: customerId } });
    if (count >= MAX_GST_PROFILES) {
      throw ApiError.badRequest(`You can save up to ${MAX_GST_PROFILES} GST profiles.`, "GST_LIMIT");
    }
    await assertGstinNotSaved(tx, customerId, data.gstin);
    const makeDefault = data.isDefault || count === 0;
    if (makeDefault) {
      await tx.customerGstDetail.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } });
    }
    return tx.customerGstDetail.create({ data: { customer_id: customerId, ...gstColumns(data), is_default: makeDefault } });
  });
}

export function updateGst(customerId, id, data) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, "customerGstDetail", customerId, id, "GST details");
    await assertGstinNotSaved(tx, customerId, data.gstin, id);
    const makeDefault = current.is_default || data.isDefault;
    if (makeDefault && !current.is_default) {
      await tx.customerGstDetail.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } });
    }
    return tx.customerGstDetail.update({ where: { id }, data: { ...gstColumns(data), is_default: makeDefault } });
  });
}

export function setDefaultGst(customerId, id) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, "customerGstDetail", customerId, id, "GST details");
    if (current.is_default) return current;
    await tx.customerGstDetail.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } });
    return tx.customerGstDetail.update({ where: { id }, data: { is_default: true } });
  });
}

export function deleteGst(customerId, id) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, "customerGstDetail", customerId, id, "GST details");
    await tx.customerGstDetail.delete({ where: { id } });
    if (current.is_default) {
      const next = await tx.customerGstDetail.findFirst({ where: { customer_id: customerId }, orderBy: { updated_at: "desc" } });
      if (next) await tx.customerGstDetail.update({ where: { id: next.id }, data: { is_default: true } });
    }
    return current;
  });
}

// ---------------------------------------------------------------------------
// Profile photo
// ---------------------------------------------------------------------------

export async function setAvatar(customer, file) {
  const path = await storeAvatar(file);
  await prisma.customer.update({ where: { id: customer.id }, data: { avatar_url: path } });
  await discardAvatar(customer.avatar_url);
}

export async function removeAvatar(customer) {
  if (!customer.avatar_url) return;
  await prisma.customer.update({ where: { id: customer.id }, data: { avatar_url: null } });
  await discardAvatar(customer.avatar_url);
}
