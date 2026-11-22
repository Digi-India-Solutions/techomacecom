import React from 'react';
import { Check, X } from 'lucide-react';
import type { CustomerRental } from '@/types';

export const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const day = (d?: string | null) =>
  d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const RENTAL_STATUS_STYLE: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  pending_approval: 'bg-sky-50 text-sky-800 border-sky-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  dispatched: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  extension_requested: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  return_scheduled: 'bg-violet-50 text-violet-700 border-violet-200',
  returned: 'bg-slate-100 text-slate-700 border-slate-200',
  deposit_refunded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const OPEN_RENTAL = ['pending_payment', 'pending_approval', 'approved', 'dispatched', 'active', 'extension_requested', 'overdue', 'return_scheduled', 'returned'];

export function StatusPill({ r }: { r: CustomerRental }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${RENTAL_STATUS_STYLE[r.status] || RENTAL_STATUS_STYLE.pending_approval}`}>
      {r.statusLabel}
    </span>
  );
}

/** One sentence: where the rental stands and what the customer should do. */
export function rentalMessage(r: CustomerRental, depositRefundDays: number): { tone: 'info' | 'warn' | 'ok' | 'bad'; text: string } {
  const bal = r.amounts.balanceDue;
  switch (r.status) {
    case 'pending_payment':
      return { tone: 'warn', text: `Pay ${inr(r.amounts.advanceDue)} to confirm this booking.` };
    case 'pending_approval':
      if (r.kyc.required && r.kyc.status === 'rejected') return { tone: 'warn', text: `Please re-upload your documents: ${r.kyc.note || 'see below'}.` };
      if (r.kyc.required && r.kyc.status !== 'approved') return { tone: 'info', text: 'We are verifying your documents. This usually takes a few hours.' };
      return { tone: 'info', text: 'Payment received — our team is confirming your booking.' };
    case 'approved':
      return bal > 0 && r.balanceDuePolicy === 'before_dispatch'
        ? { tone: 'warn', text: `Booking confirmed. Pay the balance of ${inr(bal)} so we can dispatch the equipment.` }
        : { tone: 'ok', text: `Booking confirmed — we're preparing your equipment for delivery${bal > 0 ? ` (balance ${inr(bal)} payable on delivery)` : ''}.` };
    case 'dispatched':
      return { tone: 'info', text: `Your equipment is on its way${bal > 0 ? `. Keep ${inr(bal)} ready to pay on delivery` : ''}.` };
    case 'active':
    case 'extension_requested':
      return {
        tone: 'ok',
        text:
          r.daysLeft != null && r.daysLeft <= 3
            ? `Your rental ends on ${day(r.endDate)} (${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'} left). Extend it or request a pickup.`
            : `In use till ${day(r.endDate)}.${r.returnRequestedOn ? ` Pickup requested for ${day(r.returnRequestedOn)}.` : ''}`,
      };
    case 'overdue':
      return {
        tone: 'bad',
        text: `This rental ended on ${day(r.endDate)} (${r.overdueDays} day${r.overdueDays === 1 ? '' : 's'} ago). Late fee so far ${inr(r.lateFeeAccrued)} — extend it or request a pickup.`,
      };
    case 'return_scheduled':
      return { tone: 'info', text: `Pickup scheduled${r.returnPickup?.pickupDate ? ` for ${day(r.returnPickup.pickupDate)}` : ''}. Keep the equipment and all accessories ready.` };
    case 'returned':
      return { tone: 'info', text: `We received the equipment. Your deposit refund of ${inr(r.amounts.depositRefund ?? 0)} will be processed within ${depositRefundDays} working days.` };
    case 'deposit_refunded':
      return { tone: 'ok', text: (r.amounts.depositRefund ?? 0) > 0 ? `Deposit of ${inr(r.amounts.depositRefund ?? 0)} refunded. Thank you for renting with us!` : 'Rental completed. Thank you for renting with us!' };
    case 'cancelled':
      return { tone: 'bad', text: r.cancelReason || 'This booking was cancelled.' };
    default:
      return { tone: 'info', text: '' };
  }
}

export const TONE: Record<string, string> = {
  info: 'bg-[#F3F8FE] text-[#12263F] border-[#CFE0F5]',
  warn: 'bg-[#FFF7EF] text-[#7A3E06] border-[#F8D3AE]',
  ok: 'bg-[#F0FDF4] text-[#14532D] border-[#BBF7D0]',
  bad: 'bg-red-50 text-red-800 border-red-200',
};

export function Steps({ r, compact }: { r: CustomerRental; compact?: boolean }) {
  return (
    <ol className="flex items-start" aria-label="Progress">
      {r.steps.map((s, i) => {
        const bad = s.key === 'cancelled';
        return (
          <li key={s.key} className="relative flex-1 flex flex-col items-center text-center min-w-0">
            {i < r.steps.length - 1 && <span aria-hidden className={`absolute top-[11px] left-1/2 w-full h-0.5 ${r.steps[i + 1].done ? (r.steps[i + 1].key === 'cancelled' ? 'bg-red-300' : 'bg-[#16A34A]') : 'bg-[#E2E8F0]'}`} />}
            <span
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${bad ? 'bg-red-500 text-white' : s.done ? 'bg-[#16A34A] text-white' : 'bg-white border-2 border-[#D5DEEA]'} ${s.current && !bad ? 'ring-4 ring-[#16A34A]/15' : ''}`}
            >
              {bad ? <X className="w-3.5 h-3.5" /> : s.done ? <Check className="w-3.5 h-3.5" /> : null}
            </span>
            <span className={`mt-1.5 px-0.5 text-[11px] sm:text-[12px] leading-tight ${s.done ? 'font-semibold text-[#12263F]' : 'text-[#8A97A8]'}`}>{s.label}</span>
            {!compact && s.at && <span className="hidden sm:block text-[11px] text-[#8A97A8] mt-0.5">{day(s.at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
