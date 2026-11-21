import { ok } from "../../lib/http.js";
import * as service from "../orders/service.js";

/**
 * Account orders controller — scoped to the signed-in customer.
 */

export async function createOrder(req, res) {
  const order = await service.createCustomerOrder(req.customer.id, req.body);
  return ok(res, order, { status: 201 });
}

export async function listOrders(req, res) {
  const orders = await service.listCustomerOrders(req.customer.id);
  return ok(res, orders);
}

export async function getOrder(req, res) {
  const order = await service.getCustomerOrder(req.customer.id, req.params.id);
  return ok(res, order);
}
