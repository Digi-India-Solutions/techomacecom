import type { OrderRefund, OrderReturnRequest } from '@/types';

/** Shared look & copy for return / replacement requests in My Account. */

export const formatINR = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const formatDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const OPEN_RETURN_STATUSES = ['requested', 'approved', 'pickup_scheduled', 'received', 'replacement_shipped'];

export const RETURN_STATUS_STYLE: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  pickup_scheduled: 'bg-sky-50 text-sky-800 border-sky-200',
  received: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  replacement_shipped: 'bg-violet-50 text-violet-700 border-violet-200',
  refunded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const REFUND_STATUS_LABEL: Record<string, { label: string; style: string }> = {
  processing: { label: 'Processing', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  processed: { label: 'Credited', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'On hold', style: 'bg-red-50 text-red-700 border-red-200' },
};

export function refundDestination(r: OrderRefund) {
  return r.method === 'gateway' ? 'your original payment method' : r.method === 'upi' ? 'your UPI id' : 'your bank account';
}

/** One short paragraph: where the request stands and what the customer should do next. */
export function nextStepMessage(ret: OrderReturnRequest, refundDays: string): string {
  const what = ret.type === 'replacement' ? 'replacement' : 'return';
  const lastRefund = [...ret.refunds].reverse().find((r) => r.status !== 'failed');
  switch (ret.status) {
    case 'requested':
      return `We've received your ${what} request and our team is reviewing it. You'll hear from us within 1–2 working days.`;
    case 'approved':
      return `Your ${what} is approved. We'll schedule a pickup from your delivery address shortly — please keep the item packed with all accessories and documents.`;
    case 'pickup_scheduled':
      return ret.pickup?.pickupDate
        ? `Pickup is scheduled for ${formatDay(ret.pickup.pickupDate)}${ret.pickup.courier ? ` with ${ret.pickup.courier}` : ''}. Keep the item packed in its original box with all accessories.`
        : 'Pickup has been scheduled. Keep the item packed in its original box with all accessories.';
    case 'received':
      return ret.type === 'replacement'
        ? 'We have received and inspected the item. Your replacement will be dispatched soon.'
        : 'We have received and inspected the item. Your refund is being processed.';
    case 'replacement_shipped':
      return 'Your replacement is on its way. Use the tracking link below to follow the delivery.';
    case 'completed':
      return 'Your replacement has been delivered. This request is closed.';
    case 'refunded':
      return lastRefund
        ? `${formatINR(lastRefund.amount)} has been refunded to ${refundDestination(lastRefund)}. It usually reflects within ${refundDays} business days${lastRefund.reference ? ` (reference ${lastRefund.reference})` : ''}.`
        : `Your refund has been issued. It usually reflects within ${refundDays} business days.`;
    case 'rejected':
      return ret.rejectionReason ? `We couldn't approve this request: ${ret.rejectionReason}` : "We couldn't approve this request.";
    case 'cancelled':
      return 'You cancelled this request.';
    default:
      return '';
  }
}
