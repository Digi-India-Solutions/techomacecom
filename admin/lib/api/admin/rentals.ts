import type { AdminRental, OfflinePaymentMethod, RefundMode, RentalStatus, RentalsSummary } from '@/types/admin';
import { adminGet, adminPost, getApiBaseUrl, refreshAdminSession, AdminApiError } from './client';

/**
 * Rental bookings — backend/src/modules/rentals (/api/v1/admin/rentals). Live data only.
 *   pending_payment → pending_approval → approved → dispatched → active ⇄ overdue
 *   → return_scheduled → returned → deposit_refunded        (cancelled before dispatch)
 */

export type RentalListFilter = 'all' | 'open' | 'needs_action' | 'in_use' | RentalStatus;

export function listRentals(params: { status?: RentalListFilter; due?: '7d' | 'kyc'; q?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.due) qs.set('due', params.due);
  if (params.q?.trim()) qs.set('q', params.q.trim());
  const query = qs.toString();
  return adminGet<{ items: AdminRental[]; counts: Record<string, number>; summary: RentalsSummary }>(
    `/admin/rentals${query ? `?${query}` : ''}`
  );
}

export const getRental = (id: string) => adminGet<AdminRental>(`/admin/rentals/${encodeURIComponent(id)}`);

const act = <B extends object>(id: string, path: string, body: B = {} as B) =>
  adminPost<AdminRental>(`/admin/rentals/${encodeURIComponent(id)}/${path}`, body);

export const reviewKyc = (
  id: string,
  decisions: { docId: string; status: 'approved' | 'rejected'; reason?: string | null }[],
  note?: string
) => act(id, 'kyc-review', { decisions, note: note || null });

export const approveRental = (id: string, input: { unitId?: string; note?: string }) => act(id, 'approve', input);
export const assignRentalUnit = (id: string, unitId: string) => act(id, 'assign-unit', { unitId });
export const dispatchRental = (id: string, input: { courier: string; awb?: string; trackingUrl?: string; note?: string }) =>
  act(id, 'dispatch', input);
export const markRentalDelivered = (id: string, deliveredOn?: string) => act(id, 'delivered', deliveredOn ? { deliveredOn } : {});
export const recordRentalPayment = (
  id: string,
  input: { amount: number; method: OfflinePaymentMethod; reference?: string; note?: string }
) => act(id, 'payments', input);
export const extendRental = (
  id: string,
  input: { extraPeriods: number; collected: boolean; method?: OfflinePaymentMethod; reference?: string }
) => act(id, 'extend', input);
export const scheduleRentalReturn = (
  id: string,
  input: { pickupDate: string; courier?: string; awb?: string; trackingUrl?: string; note?: string }
) => act(id, 'schedule-return', input);
export const receiveRentalReturn = (
  id: string,
  input: {
    condition: 'good' | 'needs_service' | 'damaged';
    notes?: string;
    receivedOn?: string;
    deductions: { type: 'late_fee' | 'damage' | 'missing_accessory'; amount: number; description?: string }[];
  }
) => act(id, 'receive', input);
export const refundRentalDeposit = (id: string, input: { amount: number; mode: RefundMode; reference?: string; note?: string }) =>
  act(id, 'refund-deposit', input);
export const refundRental = (id: string, input: { amount: number; mode: RefundMode; reference?: string; note?: string }) =>
  act(id, 'refunds', input);
export const syncRentalRefund = (id: string, refundId: string) => act(id, `refunds/${encodeURIComponent(refundId)}/sync`);
export const cancelRental = (id: string, reason: string) => act(id, 'cancel', { reason });
export const addRentalNote = (id: string, note: string) => act(id, 'notes', { note });
export const sendRentalReminder = (id: string) =>
  adminPost<{ sent: string[]; rental: AdminRental }>(`/admin/rentals/${encodeURIComponent(id)}/remind`);

/** KYC files are private: fetched with the staff session cookie and shown from a blob URL. */
export async function openKycDocument(rentalId: string, docId: string): Promise<string> {
  const url = `${getApiBaseUrl()}/admin/rentals/${encodeURIComponent(rentalId)}/kyc/${encodeURIComponent(docId)}/file`;
  let res = await fetch(url, { credentials: 'include' });
  if (res.status === 401 && (await refreshAdminSession())) res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new AdminApiError(res.status, body?.error?.code || 'HTTP_ERROR', body?.error?.message || 'Could not open the document');
  }
  return URL.createObjectURL(await res.blob());
}

// ---------------------------------------------------------------------------
// Manual entry (admin → Rentals → + New rental)
// ---------------------------------------------------------------------------

export interface ManualRentalOptions {
  gstEnabled: boolean;
  states: string[];
  products: {
    id: string;
    name: string;
    sku: string;
    image: string;
    gstRate: number;
    plans: { period: 'daily' | 'weekly' | 'monthly'; rate: number; minPeriods: number; maxPeriods: number; deposit: number; delivery: number }[];
    units: { id: string; unitCode: string; serialNumber: string; condition: string }[];
  }[];
}

export interface LookupAddress {
  id: string;
  type: string;
  name: string;
  phone: string;
  organisation: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type CustomerLookup =
  | { found: false }
  | { found: true; customer: { id: string; name: string; email: string; mobile: string; status: string; rentals: number; orders: number; addresses: LookupAddress[] } };

export const getManualRentalOptions = () => adminGet<ManualRentalOptions>('/admin/rentals/new/options');
export const lookupRentalCustomer = (email: string) =>
  adminGet<CustomerLookup>(`/admin/rentals/customer-lookup?email=${encodeURIComponent(email.trim())}`);

export interface ManualRentalInput {
  productId: string;
  period: 'daily' | 'weekly' | 'monthly';
  periods: number;
  startDate: string;
  status: 'approved' | 'active' | 'completed';
  rate?: number;
  deposit?: number;
  delivery?: number;
  chargeGst: boolean;
  customer: { email: string; name: string; mobile?: string; type?: string };
  addressId?: string;
  address?: { type: string; name: string; phone: string; organisation?: string; line1: string; line2?: string; landmark?: string; city: string; state: string; pincode: string };
  unitId?: string;
  payment?: { amount: number; method: OfflinePaymentMethod | 'card'; reference?: string; paidOn?: string };
  completion?: { returnedOn: string; condition: 'good' | 'needs_service' | 'damaged'; depositRefund: number; refundMethod: 'bank_transfer' | 'upi' | 'pending' | 'none'; refundReference?: string };
  note?: string;
}

export const createManualRental = (input: ManualRentalInput) =>
  adminPost<{ id: string; rentalNumber: string; customerCreated: boolean }>('/admin/rentals', input);
