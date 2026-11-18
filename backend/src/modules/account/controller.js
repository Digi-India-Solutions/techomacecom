import { ok } from "../../lib/http.js";
import { getCustomerProfile, toCustomerDto, toAddressDto, toGstDto } from "../auth/service.js";
import * as service from "./service.js";

/**
 * Every write returns the refreshed customer ({ user }) so the storefront can
 * replace its copy in one step — addresses and GST details included.
 */
async function withUser(req, res, extra = {}, status = 200) {
  const user = toCustomerDto(await getCustomerProfile(req.customer.id));
  return ok(res, { user, ...extra }, { status });
}

const id = (req) => req.validatedParams.id;

// ---- Addresses ----
export async function listAddresses(req, res) {
  return ok(res, (await service.listAddresses(req.customer.id)).map(toAddressDto));
}
export async function createAddress(req, res) {
  const address = await service.createAddress(req.customer.id, req.body);
  return withUser(req, res, { address: toAddressDto(address), message: "Address saved" }, 201);
}
export async function updateAddress(req, res) {
  const address = await service.updateAddress(req.customer.id, id(req), req.body);
  return withUser(req, res, { address: toAddressDto(address), message: "Address updated" });
}
export async function setDefaultAddress(req, res) {
  await service.setDefaultAddress(req.customer.id, id(req));
  return withUser(req, res, { message: "Default address updated" });
}
export async function deleteAddress(req, res) {
  await service.deleteAddress(req.customer.id, id(req));
  return withUser(req, res, { message: "Address deleted" });
}

// ---- GST details ----
export async function listGst(req, res) {
  return ok(res, (await service.listGst(req.customer.id)).map(toGstDto));
}
export async function createGst(req, res) {
  const gst = await service.createGst(req.customer.id, req.body);
  return withUser(req, res, { gst: toGstDto(gst), message: "GST details saved" }, 201);
}
export async function updateGst(req, res) {
  const gst = await service.updateGst(req.customer.id, id(req), req.body);
  return withUser(req, res, { gst: toGstDto(gst), message: "GST details updated" });
}
export async function setDefaultGst(req, res) {
  await service.setDefaultGst(req.customer.id, id(req));
  return withUser(req, res, { message: "Default GST details updated" });
}
export async function deleteGst(req, res) {
  await service.deleteGst(req.customer.id, id(req));
  return withUser(req, res, { message: "GST details removed" });
}

// ---- Profile photo ----
export async function uploadAvatar(req, res) {
  await service.setAvatar(req.customer, req.file);
  return withUser(req, res, { message: "Profile photo updated" });
}
export async function deleteAvatar(req, res) {
  await service.removeAvatar(req.customer);
  return withUser(req, res, { message: "Profile photo removed" });
}
