import type { RefundMode, ReturnRequest, ReturnStatus, ReturnsSummary, ReturnRequestType } from '@/types/admin';
import { adminGet, adminPatch, adminPost } from './client';

/**
 * Returns, replacements & refunds — backend/src/modules/returns (/api/v1/admin/returns).
 *   requested → approved → pickup_scheduled → received → refunded | replacement_shipped → completed
 *   (rejected / cancelled close a request early)
 */

export type ReturnListFilter = 'all' | 'open' | 'closed' | ReturnStatus;

export function listReturns(params: { status?: ReturnListFilter; type?: 'all' | ReturnRequestType; q?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.type && params.type !== 'all') qs.set('type', params.type);
  if (params.q?.trim()) qs.set('q', params.q.trim());
  const query = qs.toString();
  return adminGet<{ items: ReturnRequest[]; summary: ReturnsSummary }>(`/admin/returns${query ? `?${query}` : ''}`);
}

export const getReturn = (id: string) => adminGet<ReturnRequest>(`/admin/returns/${encodeURIComponent(id)}`);

const action = <B extends object>(id: string, path: string, body: B) =>
  adminPost<ReturnRequest>(`/admin/returns/${encodeURIComponent(id)}/${path}`, body);

export const approveReturn = (id: string, note?: string) => action(id, 'approve', { note: note || null });

export const rejectReturn = (id: string, reason: string) => action(id, 'reject', { reason });

export const scheduleReturnPickup = (
  id: string,
  input: { pickupDate: string; courier: string; awb?: string; trackingUrl?: string; note?: string }
) => action(id, 'pickup', input);

export const markReturnReceived = (
  id: string,
  input: { items: { id: string; condition: 'resellable' | 'damaged' }[]; note?: string }
) => action(id, 'receive', input);

export const refundReturn = (id: string, input: { amount: number; mode: RefundMode; reference?: string; note?: string }) =>
  action(id, 'refund', input);

export const shipReplacement = (id: string, input: { courier: string; awb?: string; trackingUrl?: string; note?: string }) =>
  action(id, 'replacement', input);

export const completeReturn = (id: string, note?: string) => action(id, 'complete', { note: note || null });

export const saveReturnNote = (id: string, adminNote: string) =>
  adminPatch<ReturnRequest>(`/admin/returns/${encodeURIComponent(id)}/note`, { adminNote });
