import { ok } from "../../lib/http.js";
import * as service from "./service.js";

export async function listCustomers(req, res) {
  const result = await service.listCustomers(req.query);
  return ok(res, result);
}

export async function getCustomer(req, res) {
  const result = await service.getCustomerById(req.params.id);
  return ok(res, result);
}

export async function toggleStatus(req, res) {
  const result = await service.toggleCustomerStatus(req.params.id);
  return ok(res, result);
}

export async function addNote(req, res) {
  const customer = await service.getCustomerById(req.params.id);
  const note = req.body?.note || "";
  if (note) {
    customer.notes = [note, ...(customer.notes || [])];
  }
  return ok(res, customer);
}

