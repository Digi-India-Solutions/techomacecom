import crypto from "node:crypto";
import env from "../../config/env.js";
import { ApiError } from "./http.js";

/**
 * Minimal Razorpay REST client.
 *   createOrder({ amountPaise, receipt, notes })               → Razorpay order (checkout opens it)
 *   verifyPaymentSignature({ orderId, paymentId, signature })  → true when the checkout callback is genuine
 *   createRefund(paymentId, { amountPaise, receipt, notes })   → Razorpay refund entity
 *   fetchRefund(refundId)                                      → Razorpay refund entity
 * Refund entity status: "pending" | "processed" | "failed".
 * (Product orders still create their Razorpay order inside modules/orders/service.js.)
 */

const BASE_URL = "https://api.razorpay.com/v1";

export function razorpayConfigured() {
  return Boolean(env.razorpay?.keyId && env.razorpay?.keySecret);
}

async function request(method, path, body) {
  if (!razorpayConfigured()) {
    throw new ApiError(503, "GATEWAY_NOT_CONFIGURED", "Razorpay keys are not configured on the server");
  }
  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString("base64");
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ApiError(502, "GATEWAY_UNREACHABLE", "Could not reach Razorpay. Please try again in a minute.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data?.error?.description ||
      (res.status === 404
        ? "Razorpay could not find this payment. It may have been made with different (test / live) API keys — refund it by bank transfer or UPI instead."
        : res.status === 401
          ? "Razorpay rejected the API keys configured on the server"
          : `Razorpay returned an error (${res.status})`);
    throw new ApiError(502, "GATEWAY_ERROR", message);
  }
  return data;
}

const cleanNotes = (notes = {}) =>
  Object.fromEntries(Object.entries(notes).map(([k, v]) => [k, String(v ?? "").slice(0, 256)]));

/** @returns {{ keyId, orderId, amount, currency }} what the storefront needs to open Razorpay Checkout */
export async function createOrder({ amountPaise, receipt, notes = {} }) {
  const rp = await request("POST", "/orders", {
    amount: Number(amountPaise),
    currency: "INR",
    receipt: receipt ? String(receipt).slice(0, 40) : undefined,
    notes: cleanNotes(notes),
  });
  return { keyId: env.razorpay.keyId, orderId: rp.id, amount: rp.amount, currency: rp.currency };
}

/** HMAC-SHA256(order_id|payment_id) with the key secret, compared in constant time. */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createRefund(paymentId, { amountPaise, receipt, notes = {} }) {
  return request("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, {
    amount: Number(amountPaise),
    speed: "normal",
    receipt: receipt ? String(receipt).slice(0, 40) : undefined,
    notes: cleanNotes(notes),
  });
}

export function fetchRefund(refundId) {
  return request("GET", `/refunds/${encodeURIComponent(refundId)}`);
}

/** Razorpay refund status → refunds.status */
export function mapRefundStatus(status) {
  if (status === "processed") return "processed";
  if (status === "failed") return "failed";
  return "processing";
}
