/**
 * Customer orders — backend /api/v1/orders (and /api/v1/account/orders)
 *
 * Uses the same apiFetch helper as addresses / GST:
 *   • cookie-based auth (httpOnly)
 *   • automatic 401 → refresh → retry
 *   • standard { success, data } envelope unwrapping
 */

import { apiFetch, apiPost } from './backend';
import type { Order, Address } from '@/types';

export interface CreateOrderPayload {
  items: {
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    mrp?: number;
    imageUrl?: string;
  }[];
  shippingAddress: Address;
  billingAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  gstDetails?: {
    gstin: string;
    legalBusinessName: string;
  };
  paymentMethod: 'cod' | 'razorpay' | 'emi';
  subtotal: number;
  discount?: number;
  shipping?: number;
  codCharge?: number;
  tax?: number;
  total: number;
  couponCode?: string;
}

export interface RazorpayOrderInfo {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface CreateOrderResult extends Order {
  razorpay?: RazorpayOrderInfo;
}

/** Place a new order from storefront checkout. */
export function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  return apiPost<CreateOrderResult>('/orders', payload);
}

export interface VerifyPaymentPayload {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

/** Verify online payment via Razorpay. */
export function verifyOrderPayment(orderId: string, payload: VerifyPaymentPayload): Promise<Order> {
  return apiPost<Order>(`/orders/${encodeURIComponent(orderId)}/verify-payment`, payload);
}

/** List all orders for the signed-in customer, newest first. */
export function fetchOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/orders');
}

/** Single order by numeric id or order-number string (e.g. "BDM-2026-89102"). */
export function fetchOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`);
}

export interface CancelOrderPayload {
  reason: string;
  note?: string;
}

/** Cancel an active customer order before dispatch. */
export function cancelCustomerOrder(orderId: string, payload: CancelOrderPayload): Promise<Order> {
  return apiPost<Order>(`/orders/${encodeURIComponent(orderId)}/cancel`, payload);
}

export interface ReturnOrderPayload {
  reason: string;
  customerNote?: string;
  photos?: string[];
  itemIds?: string[];
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName?: string;
  };
}

export interface ReturnOrderResult {
  returnRequest: {
    id: string;
    returnNumber: string;
    status: string;
    reason: string;
    createdAt: string;
  };
  order: Order;
}

/** Request return / replacement for a delivered order within 7 days. */
export function requestOrderReturn(orderId: string, payload: ReturnOrderPayload): Promise<ReturnOrderResult> {
  return apiPost<ReturnOrderResult>(`/orders/${encodeURIComponent(orderId)}/returns`, payload);
}
