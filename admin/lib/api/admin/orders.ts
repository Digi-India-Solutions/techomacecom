import type { Order, OrderPaymentMethod, OrderPaymentStatus, OrderStatus, RefundMode } from '@/types/admin';
import { adminFetch, adminGet, adminPatch, adminPost } from './client';

/**
 * Sales orders — backend/src/modules/orders (/api/v1/admin/orders).
 * Live data only: errors are thrown so the page can show them (never sample data).
 * Return / replacement requests live in ./returns.ts.
 */

export async function listOrders(filters?: {
  search?: string;
  status?: 'all' | OrderStatus;
  paymentMethod?: 'all' | OrderPaymentMethod;
  paymentStatus?: 'all' | OrderPaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') params.set('paymentMethod', filters.paymentMethod);
  if (filters?.paymentStatus && filters.paymentStatus !== 'all') params.set('paymentStatus', filters.paymentStatus);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  const qs = params.toString();
  const { data } = await adminFetch<Order[]>(`/admin/orders${qs ? `?${qs}` : ''}`);
  return data;
}

export const getAllOrdersForCounts = () => adminGet<Order[]>('/admin/orders');

export const getOrderById = (id: string) => adminGet<Order>(`/admin/orders/${encodeURIComponent(id)}`);

export function updateOrderStatus(params: { id: string; status: OrderStatus; actor: string; note?: string }): Promise<Order> {
  return adminPatch<Order>(`/admin/orders/${encodeURIComponent(params.id)}/status`, {
    status: params.status,
    note: params.note,
  });
}

export function createOrderShipment(params: {
  id: string;
  courier: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actor: string;
}): Promise<Order> {
  return adminPost<Order>(`/admin/orders/${encodeURIComponent(params.id)}/shipment`, params);
}

export const addOrderInternalNote = (id: string, note: string) =>
  adminPost<Order>(`/admin/orders/${encodeURIComponent(id)}/notes`, { note });

export async function bulkMarkOrdersPacked(ids: string[], _actor: string): Promise<void> {
  await adminPost('/admin/orders/bulk-packed', { ids });
}

// --- Refunds on an order (cancellation, goodwill, return without an RMA) ---

export interface OrderRefundInput {
  amount: number;
  mode: RefundMode;
  reference?: string;
  note?: string;
  reason: 'goodwill' | 'cancel' | 'return';
}

export const issueOrderRefund = (orderId: string, input: OrderRefundInput) =>
  adminPost<Order>(`/admin/orders/${encodeURIComponent(orderId)}/refunds`, input);

/** Re-checks a Razorpay refund that is still processing. */
export const syncOrderRefund = (orderId: string, refundId: string) =>
  adminPost<Order>(`/admin/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}/sync`);
