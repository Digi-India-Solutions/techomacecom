'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { Order } from '@/types';
import { cancelCustomerOrder } from '@/lib/api/orders';
import { errorMessage } from '@/lib/api/backend';
import { useSiteSettings } from '@/lib/settings/store';
import { useToastStore } from '@/lib/store';
import { formatINR } from './returnUi';

interface Props {
  order: Order;
  onClose: () => void;
  onCancelled: (updated: Order) => void;
}

/** Cancel an order before dispatch. Reasons come from admin → Settings → Returns & Refunds. */
export default function CancelOrderModal({ order, onClose, onCancelled }: Props) {
  const { returns } = useSiteSettings();
  const reasons = returns.cancelReasons.length ? returns.cancelReasons : ['Other'];
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToastStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const prepaid = order.paymentStatus === 'Paid' || order.paymentStatus === 'Partially Refunded';
  const needsNote = reason === 'Other';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError('Please choose a reason');
    if (needsNote && note.trim().length < 3) return setError('Please tell us a little more');
    setSubmitting(true);
    setError('');
    try {
      const updated = await cancelCustomerOrder(order.id, { reason, note: note.trim() || undefined });
      addToast({
        type: 'success',
        title: 'Order cancelled',
        message: prepaid
          ? `Your refund of ${formatINR(order.totalAmount)} has been initiated.`
          : `Order ${order.orderNumber} has been cancelled.`,
      });
      onCancelled(updated);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not cancel the order. Please try again or contact support.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B2545]/60 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
      <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl border border-[#DCE6F2] overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-[#E8EEF5] px-5 sm:px-6 py-4">
          <div>
            <h3 id="cancel-title" className="text-[17px] font-semibold text-[#12263F]">
              Cancel order
            </h3>
            <p className="text-[13px] text-[#5B6B82] mt-0.5">
              {order.orderNumber} · {order.items.length} item{order.items.length === 1 ? '' : 's'} · {formatINR(order.totalAmount)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8A97A8] hover:bg-[#EAF2FC] hover:text-[#12263F] cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          <fieldset>
            <legend className="text-[14px] font-semibold text-[#12263F] mb-2.5">Why are you cancelling?</legend>
            <div className="grid gap-2">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-[14px] cursor-pointer transition-colors ${
                    reason === r ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 text-[#12263F]' : 'border-[#DCE6F2] text-[#12263F] hover:border-[#B9CCE6]'
                  }`}
                >
                  <input type="radio" name="cancel-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="w-4 h-4 accent-[#1D5FAF]" />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="cancel-note" className="block text-[14px] font-semibold text-[#12263F] mb-1.5">
              Anything else? {!needsNote && <span className="font-normal text-[#8A97A8]">(optional)</span>}
            </label>
            <textarea
              id="cancel-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell us what we could do better"
              className="w-full rounded-xl border border-[#D5DEEA] px-3.5 py-2.5 text-[14px] text-[#12263F] placeholder:text-[#97A3B4] focus:outline-none focus:border-[#1D5FAF] focus:ring-3 focus:ring-[#1D5FAF]/15"
            />
          </div>

          <div className={`rounded-xl border p-3.5 text-[13px] leading-relaxed ${prepaid ? 'border-[#CFE0F5] bg-[#F3F8FE] text-[#12263F]' : 'border-[#E8EEF5] bg-[#F8FAFD] text-[#5B6B82]'}`}>
            {prepaid ? (
              <>
                <span className="font-semibold">Refund: </span>
                {formatINR(order.totalAmount)} will go back to your original payment method. Banks usually credit it within{' '}
                {returns.refundProcessingDays} business days.
              </>
            ) : (
              <>
                <span className="font-semibold text-[#12263F]">Cash on delivery: </span>nothing has been charged, so there is nothing to refund.
              </>
            )}
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-[13px] text-red-700" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-[#D5DEEA] px-5 py-2.5 text-[14px] font-semibold text-[#12263F] hover:bg-[#F8FAFD] cursor-pointer">
              Keep order
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
