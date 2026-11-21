import { ok } from "../../lib/http.js";
import * as service from "./service.js";
import * as returnsService from "./returns.service.js";

/**
 * Storefront Customer Orders Controller
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

export async function cancelOrder(req, res) {
  const order = await returnsService.cancelCustomerOrder(req.customer.id, req.params.id, req.body);
  return ok(res, order);
}

export async function requestReturn(req, res) {
  const result = await returnsService.createCustomerReturn(req.customer.id, req.params.id, req.body);
  return ok(res, result, { status: 201 });
}
