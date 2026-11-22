/**
 * Rentals — backend/src/modules/rentals (/api/v1/rentals). Live data only.
 * Flow: quote → (upload KYC) → createRental (+ Razorpay advance) → verifyRentalPayment
 *       → staff approve / dispatch / deliver → extend · request pickup → deposit refund.
 */
import { apiDelete, apiFetch, apiPost, BACKEND_URL, refreshSession, ApiClientError } from './backend';
import type { RazorpayOrderInfo, RazorpaySuccess } from '@/lib/razorpay';
import type { CustomerRental, RentalKycDoc, RentalQuote } from '@/types';

export type RentalPeriod = 'daily' | 'weekly' | 'monthly';

export function fetchRentalQuote(input: { productSlug: string; period: RentalPeriod; periods: number; startDate?: string }) {
  return apiPost<RentalQuote>('/rentals/quote', input);
}

export const fetchMyRentals = () => apiFetch<CustomerRental[]>('/rentals');
export const fetchMyRental = (id: string) => apiFetch<CustomerRental>(`/rentals/${encodeURIComponent(id)}`);

export interface CreateRentalInput {
  productSlug: string;
  period: RentalPeriod;
  periods: number;
  startDate: string;
  addressId: string;
  kycDocumentIds: string[];
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
