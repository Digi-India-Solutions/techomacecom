/**
 * Rentals — backend/src/modules/rentals (/api/v1/rentals). Live data only.
 * Flow: quote → (upload KYC) → createRental (+ Razorpay advance) → verifyRentalPayment
 *       → staff approve / dispatch / deliver → extend · request pickup → deposit refund.
 */
import { apiDelete, apiFetch, apiPost, BACKEND_URL, refreshSession, ApiClientError } from './backend';
import type { RazorpayOrderInfo, RazorpaySuccess } from '@/lib/razorpay';
import type { CustomerRental, RentalDepositMode, RentalKycDoc, RentalQuote } from '@/types';

export type RentalPeriod = 'daily' | 'weekly' | 'monthly';

/** Delivery time slots (24h "HH:MM") — same list as the API: 10 AM to 4 PM. */
export const DELIVERY_TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'] as const;
export type DeliveryTimeSlot = (typeof DELIVERY_TIME_SLOTS)[number];

/** "14:00" → "2:00 PM" */
export function deliveryTimeLabel(hhmm?: string | null) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function fetchRentalQuote(input: { productSlug: string; period: RentalPeriod; periods: number; startDate?: string; depositMode?: RentalDepositMode }) {
  return apiPost<RentalQuote>('/rentals/quote', input).then((q) => ({
    ...q,
    // Defaults for an API that predates the deposit-by-cheque option
    depositMode: q.depositMode ?? 'online',
    depositByCheque: q.depositByCheque ?? 0,
    onlineTotal: q.onlineTotal ?? q.total,
  }));
}

export const fetchMyRentals = () => apiFetch<CustomerRental[]>('/rentals');
export const fetchMyRental = (id: string) => apiFetch<CustomerRental>(`/rentals/${encodeURIComponent(id)}`);

export interface CreateRentalInput {
  productSlug: string;
  period: RentalPeriod;
  periods: number;
  startDate: string;
  deliveryTime: DeliveryTimeSlot;
  addressId: string;
  kycDocumentIds: string[];
  depositMode: RentalDepositMode;
}

export function createRental(input: CreateRentalInput) {
  return apiPost<{ rental: CustomerRental; razorpay?: RazorpayOrderInfo; error?: string }>('/rentals', input);
}

export const startRentalPayment = (id: string, kind: 'advance' | 'balance') =>
  apiPost<{ razorpay: RazorpayOrderInfo }>(`/rentals/${encodeURIComponent(id)}/pay`, { kind });

export const verifyRentalPayment = (id: string, r: RazorpaySuccess) =>
  apiPost<CustomerRental>(`/rentals/${encodeURIComponent(id)}/verify-payment`, r);

export const requestRentalExtension = (id: string, extraPeriods: number) =>
  apiPost<{ razorpay: RazorpayOrderInfo; extension: { id: string; amount: number; newEndDate: string } }>(
    `/rentals/${encodeURIComponent(id)}/extend`,
    { extraPeriods }
  );

export const requestRentalPickup = (id: string, pickupDate: string) =>
  apiPost<CustomerRental>(`/rentals/${encodeURIComponent(id)}/return-request`, { pickupDate });

export const cancelMyRental = (id: string, reason: string) =>
  apiPost<CustomerRental>(`/rentals/${encodeURIComponent(id)}/cancel`, { reason });

/** Checkout: upload a document before the booking exists. */
export function uploadKycDocument(docType: string, file: File) {
  const form = new FormData();
  form.append('docType', docType);
  form.append('file', file);
  return apiFetch<RentalKycDoc>('/rentals/kyc-documents', { method: 'POST', body: form });
}

/** My rentals: re-upload a document staff asked for. */
export function uploadRentalKycDocument(rentalId: string, docType: string, file: File) {
  const form = new FormData();
  form.append('docType', docType);
  form.append('file', file);
  return apiFetch<CustomerRental>(`/rentals/${encodeURIComponent(rentalId)}/kyc-documents`, { method: 'POST', body: form });
}

export const deleteKycDocument = (docId: string) => apiDelete<{ deleted: boolean }>(`/rentals/kyc-documents/${encodeURIComponent(docId)}`);

/** KYC files are private — fetched with the session cookie and opened from a blob URL. */
export async function openKycDocument(docId: string): Promise<string> {
  const url = `${BACKEND_URL}/rentals/kyc-documents/${encodeURIComponent(docId)}/file`;
  let res = await fetch(url, { credentials: 'include' });
  if (res.status === 401 && (await refreshSession())) res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new ApiClientError(res.status, 'HTTP_ERROR', 'Could not open the document');
  return URL.createObjectURL(await res.blob());
}
