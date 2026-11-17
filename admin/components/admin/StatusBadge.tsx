import React from 'react';

export type StatusTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-[#EAF2FC] text-[#1D5FAF] border-[#1D5FAF]/25',
  warning: 'bg-[#F28C38]/12 text-[#B85A0E] border-[#F28C38]/35',
  danger: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-slate-100 text-[#5B6B82] border-[#DCE6F2]',
};

const AUTO_TONE_MAP: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  draft: { label: 'Draft', tone: 'neutral' },
  out_of_stock: { label: 'Out of Stock', tone: 'danger' },
  in_stock: { label: 'In Stock', tone: 'success' },
  low_stock: { label: 'Low Stock', tone: 'warning' },
  available: { label: 'Available', tone: 'success' },
  reserved: { label: 'Reserved', tone: 'info' },
  with_customer: { label: 'With Customer', tone: 'info' },
  in_transit: { label: 'In Transit', tone: 'warning' },
  under_service: { label: 'Under Service', tone: 'warning' },
  retired: { label: 'Retired', tone: 'neutral' },
  new: { label: 'New', tone: 'info' },
  good: { label: 'Good', tone: 'success' },
  needs_service: { label: 'Needs Service', tone: 'warning' },
  damaged: { label: 'Damaged', tone: 'danger' },
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  packed: { label: 'Packed', tone: 'info' },
  to_ship: { label: 'To Ship', tone: 'warning' },
  shipped: { label: 'Shipped', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  returned: { label: 'Returned', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'success' },
  partial: { label: 'Partial', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  overdue: { label: 'Overdue', tone: 'danger' },
  in_progress: { label: 'In Progress', tone: 'info' },
  quoted: { label: 'Quoted', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'info' },
  partial_refund: { label: 'Partial Refund', tone: 'warning' },
  partial_refunded: { label: 'Partial Refund', tone: 'warning' },
  requested: { label: 'Requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  pickup_scheduled: { label: 'Pickup Scheduled', tone: 'info' },
  received: { label: 'Received', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  pending_approval: { label: 'Pending Approval', tone: 'warning' },
  dispatched: { label: 'Dispatched', tone: 'info' },
  extension_requested: { label: 'Extension Requested', tone: 'warning' },
  return_scheduled: { label: 'Return Scheduled', tone: 'info' },
  deposit_refunded: { label: 'Deposit Refunded', tone: 'success' },
  reupload_requested: { label: 'Re-upload Requested', tone: 'warning' },
  contacted: { label: 'Contacted', tone: 'info' },
  follow_up: { label: 'Follow-up', tone: 'warning' },
  converted: { label: 'Converted', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
  published: { label: 'Published', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  held: { label: 'Held', tone: 'info' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ status, label, tone, className = '' }: StatusBadgeProps) {
  const mapped = AUTO_TONE_MAP[status.toLowerCase()];
  const resolvedLabel = label || mapped?.label || status.replace(/_/g, ' ');
  const resolvedTone = tone || mapped?.tone || 'neutral';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 capitalize ${TONE_CLASSES[resolvedTone]} ${className}`}
    >
      {resolvedLabel}
    </span>
  );
}
