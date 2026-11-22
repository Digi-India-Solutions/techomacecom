import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Loader2,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Repeat,
  RotateCcw,
  Search,
  Truck,
  Undo2,
  XCircle,
} from 'lucide-react';
import type { RefundMode, ReturnRequest, ReturnsSummary, ReturnRequestType } from '@/types/admin';
import {
  approveReturn,
  completeReturn,
  getReturn,
  listReturns,
  markReturnReceived,
  refundReturn,
  rejectReturn,
  saveReturnNote,
  scheduleReturnPickup,
  shipReplacement,
  type ReturnListFilter,
} from '@/lib/api/admin/returns';
import { AdminApiError, formatDateTime, formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { SafeImage } from '@/components/admin/SafeImage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

const card = 'rounded-xl border border-[#DCE6F2] bg-white';
const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50';
const btnSuccess =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';

const errText = (err: unknown) => (err instanceof Error ? err.message : 'Please try again');

const FILTERS: { key: ReturnListFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'requested', label: 'Needs review' },
  { key: 'pickup_scheduled', label: 'Pickup scheduled' },
  { key: 'received', label: 'Received' },
  { key: 'replacement_shipped', label: 'Replacement shipped' },
  { key: 'closed', label: 'Closed' },
];

const COURIERS = ['Shiprocket Reverse', 'Delhivery Reverse', 'BlueDart Reverse', 'Ekart', 'DTDC', 'Xpressbees', 'Own fleet'];

function TypeBadge({ type }: { type: ReturnRequestType }) {
  return type === 'replacement' ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
      <Repeat className="h-3 w-3" /> Replacement
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#1D5FAF]/25 bg-[#EAF2FC] px-2 py-0.5 text-[11px] font-semibold text-[#1D5FAF]">
      <Undo2 className="h-3 w-3" /> Refund
    </span>
  );
}

function ageLabel(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function tomorrow() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ReturnsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [summary, setSummary] = useState<ReturnsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<ReturnListFilter>('all');
  const [type, setType] = useState<'all' | ReturnRequestType>('all');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  const openId = searchParams.get('id');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await listReturns({ status: filter, type, q: debounced });
      setItems(res.items);
      setSummary(res.summary);
    } catch (err) {
      setLoadError(errText(err));
    } finally {
      setLoading(false);
    }
  }, [filter, type, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('id', id);
    else next.delete('id');
    setSearchParams(next, { replace: true });
  };

  const onChanged = (updated: ReturnRequest) => {
    setItems((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    // counts may have moved between groups
    listReturns({ status: filter, type, q: debounced })
      .then((res) => {
        setItems(res.items);
        setSummary(res.summary);
      })
      .catch(() => undefined);
  };

  const kpis = [
    { key: 'requested' as const, label: 'Needs review', value: summary?.needsReview ?? 0, icon: ClipboardCheck, tone: 'text-[#B85A0E] bg-[#F28C38]/12' },
    { key: 'pickup_scheduled' as const, label: 'Pickup in progress', value: summary?.inPickup ?? 0, icon: Truck, tone: 'text-[#1D5FAF] bg-[#EAF2FC]' },
    { key: 'received' as const, label: 'Awaiting refund / replacement', value: summary?.awaitingResolution ?? 0, icon: PackageCheck, tone: 'text-violet-700 bg-violet-50' },
    { key: 'closed' as const, label: 'Refunded · last 30 days', value: formatINR(summary?.refundedLast30Days ?? 0), icon: Banknote, tone: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12263F]">Returns &amp; Refunds</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Review return and replacement requests, arrange reverse pickups, inspect items and issue refunds or replacements.
          </p>
        </div>
        <button type="button" onClick={load} className={btnSecondary} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              type="button"
              onClick={() => setFilter(k.key)}
              className={`${card} flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-md ${filter === k.key ? 'ring-2 ring-[#1D5FAF]/30' : ''}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${k.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-bold tabular-nums text-[#12263F]">{k.value}</span>
                <span className="block truncate text-xs text-[#5B6B82]">{k.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={`${card} flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between`}>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as 'all' | ReturnRequestType)} className={`${selectClass} !w-40`} aria-label="Request type">
            <option value="all">All types</option>
            <option value="refund">Refund</option>
            <option value="replacement">Replacement</option>
          </select>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="RMA, order, customer, SKU…"
              className={`${inputClass} pl-8`}
              aria-label="Search returns"
            />
          </div>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {loading && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-[#F28C38]" />
            <p className="text-sm font-semibold text-[#12263F]">Could not load return requests</p>
            <p className="text-xs text-[#5B6B82]">{loadError}</p>
            <button type="button" onClick={load} className={btnSecondary}>
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={PackageOpen}
              title={debounced || filter !== 'all' ? 'No requests match these filters' : 'No return requests yet'}
              description="Return and replacement requests raised by customers from My Orders appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Customer / Order</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {items.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-[#F6F9FD]" onClick={() => open(r.id)}>
                    <td className="px-4 py-3 align-top">
                      <p className="font-mono text-xs font-semibold text-[#12263F]">{r.returnNumber}</p>
                      <p className="text-[11px] text-[#5B6B82]" title={formatDateTime(r.createdAt)}>
                        {ageLabel(r.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-semibold text-[#12263F]">{r.customer.name}</p>
                      <p className="text-[11px] text-[#5B6B82]">
                        <span className="font-mono">{r.orderNumber}</span> · {r.paymentMethod}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex max-w-xs items-center gap-2">
                        <div className="flex -space-x-2">
                          {r.items.slice(0, 3).map((it) => (
                            <div key={it.id} className="h-9 w-9 overflow-hidden rounded-md border-2 border-white bg-[#F6F9FD] ring-1 ring-[#DCE6F2]">
                              <SafeImage src={it.image} alt={it.productName} />
                            </div>
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-[#12263F]">
                            {r.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                          </p>
                          <p className="truncate text-[11px] text-[#5B6B82]">{r.reason}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <TypeBadge type={r.type} />
                    </td>
                    <td className="px-4 py-3 text-right align-top tabular-nums">
                      <p className="text-xs font-semibold text-[#12263F]">{formatINR(r.requestedAmount)}</p>
                      {r.refundedAmount > 0 && <p className="text-[11px] text-emerald-700">Refunded {formatINR(r.refundedAmount)}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={r.status} label={r.statusLabel} />
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          open(r.id);
                        }}
                        className="rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                      >
                        {['requested', 'approved', 'pickup_scheduled', 'received', 'replacement_shipped'].includes(r.status) ? 'Process' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openId && <ReturnDrawer id={openId} onClose={() => open(null)} onChanged={onChanged} showToast={showToast} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail drawer
// ---------------------------------------------------------------------------

type ShowToast = ReturnType<typeof useToast>['showToast'];

function ReturnDrawer({
  id,
  onClose,
  onChanged,
  showToast,
}: {
  id: string;
  onClose: () => void;
  onChanged: (r: ReturnRequest) => void;
  showToast: ShowToast;
}) {
  const { can } = useAuth();
  const canEdit = can('returns.edit');
  const [ret, setRet] = useState<ReturnRequest | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // forms
  const [approveNote, setApproveNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [pickup, setPickup] = useState({ pickupDate: tomorrow(), courier: COURIERS[0], awb: '', trackingUrl: '' });
  const [conditions, setConditions] = useState<Record<string, 'resellable' | 'damaged'>>({});
  const [receiveNote, setReceiveNote] = useState('');
  const [resolution, setResolution] = useState<'refund' | 'replacement'>('refund');
  const [refund, setRefund] = useState<{ amount: number; mode: RefundMode; reference: string; note: string }>({
    amount: 0,
    mode: 'gateway',
    reference: '',
    note: '',
  });
  const [refundConfirm, setRefundConfirm] = useState(false);
  const [replacement, setReplacement] = useState({ courier: 'Shiprocket', awb: '', trackingUrl: '' });
  const [adminNote, setAdminNote] = useState('');

  const hydrate = useCallback((r: ReturnRequest) => {
    setRet(r);
    setAdminNote(r.adminNote || '');
    setConditions(Object.fromEntries(r.items.map((i) => [i.id, i.condition || 'resellable'])));
    setResolution(r.type);
    if (r.refundable) {
      setRefund((f) => ({ ...f, amount: r.refundable!.suggested, mode: r.refundable!.defaultMode }));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setRet(null);
    setError('');
    getReturn(id)
      .then((r) => alive && hydrate(r))
      .catch((err) => alive && setError(errText(err)));
    return () => {
      alive = false;
    };
  }, [id, hydrate]);

  const run = async (label: string, fn: () => Promise<ReturnRequest>, success: string) => {
    setBusy(true);
    setFieldErrors({});
    try {
      const updated = await fn();
      hydrate(updated);
      onChanged(updated);
      showToast({ title: success, variant: 'success' });
      return true;
    } catch (err) {
      if (err instanceof AdminApiError && err.fields) setFieldErrors(err.fields);
      showToast({ title: `Could not ${label}`, description: errText(err), variant: 'error' });
      // refresh: a failed gateway refund is still recorded on the request
      getReturn(id).then(hydrate).catch(() => undefined);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const isCod = ret?.paymentMethod === 'COD';
  const modeOptions = useMemo(() => {
    const opts: { value: RefundMode; label: string }[] = [];
    if (ret?.refundable?.gatewayAvailable && !isCod) opts.push({ value: 'gateway', label: 'Original payment method (Razorpay)' });
    opts.push({ value: 'bank_transfer', label: 'Bank transfer (NEFT / IMPS) — already sent' });
    opts.push({ value: 'upi', label: 'UPI — already sent' });
    return opts;
  }, [ret?.refundable?.gatewayAvailable, isCod]);

  return (
    <Drawer
      open
      onClose={onClose}
      widthClass="max-w-2xl"
      title={ret ? `${ret.returnNumber}` : 'Return request'}
      subtitle={ret ? `${ret.typeLabel} · Order ${ret.orderNumber} · ${ret.customer.name}` : undefined}
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : !ret ? (
        <div className="flex items-center gap-2 text-sm text-[#5B6B82]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading request…
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status + steps */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ret.status} label={ret.statusLabel} />
            <TypeBadge type={ret.type} />
            <span className="ml-auto text-xs tabular-nums text-[#5B6B82]">Requested {formatDateTime(ret.createdAt)}</span>
          </div>
          <ol className="flex items-start">
            {ret.steps.map((s, i) => (
              <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
                {i < ret.steps.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-1/2 top-3 h-0.5 w-full ${ret.steps[i + 1].done ? 'bg-emerald-500' : 'bg-[#DCE6F2]'}`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    s.key === 'rejected' || s.key === 'cancelled'
                      ? 'bg-red-500 text-white'
                      : s.done
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-[#DCE6F2] bg-white text-[#5B6B82]'
                  } ${s.current ? 'ring-4 ring-emerald-500/15' : ''}`}
                >
                  {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`mt-1.5 px-1 text-[11px] leading-tight ${s.done ? 'font-semibold text-[#12263F]' : 'text-[#5B6B82]'}`}>{s.label}</span>
                {s.at && <span className="mt-0.5 text-[10px] text-[#5B6B82]">{formatShortDate(s.at)}</span>}
              </li>
            ))}
          </ol>

          {/* Next action */}
          {canEdit && (
            <ActionPanel
              ret={ret}
              busy={busy}
              fieldErrors={fieldErrors}
              approveNote={approveNote}
              setApproveNote={setApproveNote}
              onApprove={() => run('approve the request', () => approveReturn(ret.id, approveNote.trim()), 'Request approved — customer notified')}
              onRejectOpen={() => setRejectOpen(true)}
              pickup={pickup}
              setPickup={setPickup}
              onPickup={() =>
                run(
                  'schedule the pickup',
                  () =>
                    scheduleReturnPickup(ret.id, {
                      pickupDate: pickup.pickupDate,
                      courier: pickup.courier.trim(),
                      awb: pickup.awb.trim() || undefined,
                      trackingUrl: pickup.trackingUrl.trim() || undefined,
                    }),
                  'Pickup scheduled — customer notified'
                )
              }
              conditions={conditions}
              setConditions={setConditions}
              receiveNote={receiveNote}
              setReceiveNote={setReceiveNote}
              onReceive={() =>
                run(
                  'mark the item received',
                  () =>
                    markReturnReceived(ret.id, {
                      items: ret.items.map((i) => ({ id: i.id, condition: conditions[i.id] || 'resellable' })),
                      note: receiveNote.trim() || undefined,
                    }),
                  'Marked as received'
                )
              }
              resolution={resolution}
              setResolution={setResolution}
              refund={refund}
              setRefund={setRefund}
              modeOptions={modeOptions}
              onRefund={() => setRefundConfirm(true)}
              replacement={replacement}
              setReplacement={setReplacement}
              onShipReplacement={() =>
                run(
                  'ship the replacement',
                  () =>
                    shipReplacement(ret.id, {
                      courier: replacement.courier.trim(),
                      awb: replacement.awb.trim() || undefined,
                      trackingUrl: replacement.trackingUrl.trim() || undefined,
                    }),
                  'Replacement shipped — customer notified'
                )
              }
              onComplete={() => run('close the request', () => completeReturn(ret.id), 'Replacement delivered — request closed')}
            />
          )}

          {ret.status === 'rejected' && ret.rejectionReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <span className="font-semibold">Not approved:</span> {ret.rejectionReason}
            </div>
          )}

          {/* Customer + order */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#DCE6F2] p-3.5 text-xs">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5B6B82]">Customer</p>
              <p className="text-sm font-semibold text-[#12263F]">{ret.customer.name}</p>
              {ret.customer.phone && <p className="tabular-nums text-[#12263F]">{ret.customer.phone}</p>}
              {ret.customer.email && <p className="text-[#5B6B82]">{ret.customer.email}</p>}
              <p className="mt-1.5 text-[#5B6B82]">{ret.customer.address}</p>
            </div>
            <div className="rounded-xl border border-[#DCE6F2] p-3.5 text-xs">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5B6B82]">Order</p>
              <Link to={`/admin/orders/${ret.orderId}`} className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-[#1D5FAF] hover:underline">
                {ret.orderNumber} <ExternalLink className="h-3 w-3" />
              </Link>
              <p className="mt-1 text-[#12263F]">
                {formatINR(ret.orderTotal)} · {ret.paymentMethod}
              </p>
              {ret.orderDeliveredAt && <p className="text-[#5B6B82]">Delivered {formatShortDate(ret.orderDeliveredAt)}</p>}
              {ret.refundable && (
                <p className="mt-1 text-[#5B6B82]">
                  Paid {formatINR(ret.refundable.paid)} · Refunded so far {formatINR(ret.refundable.alreadyRefunded)}
                </p>
              )}
            </div>
          </section>

          {/* Items */}
          <section className="rounded-xl border border-[#DCE6F2]">
            <p className="border-b border-[#DCE6F2] px-3.5 py-2.5 text-xs font-semibold text-[#12263F]">Items in this request</p>
            <ul className="divide-y divide-[#DCE6F2]">
              {ret.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-3.5 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2]">
                    <SafeImage src={it.image} alt={it.productName} />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-[#12263F]">{it.productName}</p>
                    <p className="text-[#5B6B82]">
                      {it.variantName ? `${it.variantName} · ` : ''}
                      <span className="font-mono">{it.sku}</span> · Qty {it.quantity} of {it.orderedQuantity}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold tabular-nums text-[#12263F]">{formatINR(it.refundAmount)}</p>
                    {it.condition && <StatusBadge status={it.condition === 'damaged' ? 'damaged' : 'good'} label={it.condition === 'damaged' ? 'Damaged' : 'Resellable'} />}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Reason & evidence */}
          <section className="space-y-3 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 text-xs">
            <p>
              <span className="font-semibold text-[#12263F]">Reason:</span> {ret.reason}
            </p>
            {ret.customerNote && <p className="whitespace-pre-line text-[#12263F]">“{ret.customerNote}”</p>}
            {ret.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ret.photos.map((p, idx) => (
                  <a key={p} href={p} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-[#DCE6F2] bg-white hover:ring-2 hover:ring-[#1D5FAF]/40" title={`Photo ${idx + 1} — open full size`}>
                    <SafeImage src={p} alt={`Customer photo ${idx + 1}`} />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Refund account (COD) */}
          {ret.refundAccount && (
            <section className="rounded-xl border border-[#DCE6F2] p-3.5 text-xs">
              <p className="mb-2 flex items-center gap-1.5 font-semibold text-[#12263F]">
                <Banknote className="h-4 w-4 text-[#1D5FAF]" /> Customer's refund account ({ret.refundAccount.mode === 'upi' ? 'UPI' : 'bank'})
              </p>
              {ret.refundAccount.details ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {Object.entries({
                    'Account holder': ret.refundAccount.details.accountHolder,
                    'Account number': ret.refundAccount.details.accountNumber,
                    IFSC: ret.refundAccount.details.ifsc,
                    Bank: ret.refundAccount.details.bankName,
                    'UPI id': ret.refundAccount.details.upiId,
                  })
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt className="text-[#5B6B82]">{k}</dt>
                        <dd className="flex items-center gap-1.5 font-mono text-[#12263F]">
                          {v}
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(String(v)).then(() => showToast({ title: `${k} copied`, variant: 'info' }))}
                            className="rounded p-0.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
                            aria-label={`Copy ${k}`}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </dd>
                      </React.Fragment>
                    ))}
                </dl>
              ) : (
                <p className="text-[#5B6B82]">{ret.refundAccount.label}</p>
              )}
            </section>
          )}

          {/* Shipments */}
          {(ret.pickup || ret.replacementShipment) && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ret.pickup && <ShipmentCard title="Reverse pickup" s={ret.pickup} />}
              {ret.replacementShipment && <ShipmentCard title="Replacement shipment" s={ret.replacementShipment} />}
            </section>
          )}

          {/* Refunds */}
          {ret.refunds.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-[#12263F]">Refunds</p>
              {ret.refunds.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-xs ${
                    r.status === 'failed' ? 'border-red-200 bg-red-50' : r.status === 'processing' ? 'border-[#F28C38]/35 bg-[#F28C38]/10' : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-[#12263F]">
                      {formatINR(r.amount)} · {r.methodLabel}
                    </p>
                    <p className="font-mono text-[11px] text-[#5B6B82]">
                      {r.reference || r.gatewayRefundId || `#${r.id}`} · {r.processedBy}
                    </p>
                    {r.failureReason && <p className="mt-0.5 text-[11px] text-red-700">{r.failureReason}</p>}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <p className="mt-1 text-[11px] tabular-nums text-[#5B6B82]">{formatDateTime(r.processedAt || r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Internal note */}
          <section className="space-y-2">
            <FormField label="Internal note (staff only)" hint="QC findings, courier remarks, anything the team should know. Not shown to the customer.">
              <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} disabled={!canEdit} className={textareaClass} />
            </FormField>
            {canEdit && adminNote !== (ret.adminNote || '') && (
              <button type="button" disabled={busy} onClick={() => run('save the note', () => saveReturnNote(ret.id, adminNote), 'Note saved')} className={btnSecondary}>
                Save note
              </button>
            )}
          </section>

          {/* History */}
          <section>
            <p className="mb-2 text-xs font-semibold text-[#12263F]">History</p>
            <ol className="space-y-0 border-l-2 border-[#DCE6F2] pl-4">
              {ret.history.map((h) => (
                <li key={h.id} className="relative pb-3 text-xs last:pb-0">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1D5FAF]" />
                  <p className="font-semibold text-[#12263F]">
                    {h.label} <span className="font-normal text-[#5B6B82]">· {h.actor}</span>
                  </p>
                  {h.note && <p className="text-[#5B6B82]">{h.note}</p>}
                  <p className="text-[11px] tabular-nums text-[#5B6B82]">{formatDateTime(h.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {/* Reject */}
      {rejectOpen && ret && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#12263F]">Reject {ret.returnNumber}?</h3>
            <p className="mt-1 text-xs text-[#5B6B82]">The customer will see this reason in My Orders and receive it by SMS / email.</p>
            <FormField label="Reason for the customer" required error={fieldErrors.reason} className="mt-4">
              <textarea
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="e.g. The seal is broken and the item shows signs of use, which our policy does not cover."
                className={textareaClass}
                autoFocus
              />
            </FormField>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejectOpen(false)} className={btnSecondary}>
                Back
              </button>
              <button
                type="button"
                disabled={busy || rejectReasonText.trim().length < 5}
                onClick={async () => {
                  if (await run('reject the request', () => rejectReturn(ret.id, rejectReasonText.trim()), 'Request rejected — customer notified')) {
                    setRejectOpen(false);
                    setRejectReasonText('');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Reject request
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={refundConfirm && Boolean(ret)}
        title={`Refund ${formatINR(refund.amount)}?`}
        description={
          refund.mode === 'gateway'
            ? `Razorpay will send ${formatINR(refund.amount)} back to the customer's original payment method. This cannot be undone.`
            : `This records that ${formatINR(refund.amount)} has already been sent by ${refund.mode === 'upi' ? 'UPI' : 'bank transfer'} (ref ${refund.reference || '—'}). The customer will be notified.`
        }
        confirmLabel="Issue refund"
        variant="primary"
        loading={busy}
        onCancel={() => setRefundConfirm(false)}
        onConfirm={async () => {
          if (!ret) return;
          await run(
            'issue the refund',
            () =>
              refundReturn(ret.id, {
                amount: refund.amount,
                mode: refund.mode,
                reference: refund.reference.trim() || undefined,
                note: refund.note.trim() || undefined,
              }),
            'Refund issued — customer notified'
          );
          setRefundConfirm(false);
        }}
      />
    </Drawer>
  );
}

function ShipmentCard({ title, s }: { title: string; s: NonNullable<ReturnRequest['pickup']> }) {
  return (
    <div className="rounded-xl border border-[#DCE6F2] p-3.5 text-xs">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5B6B82]">{title}</p>
      <p className="font-semibold text-[#12263F]">{s.courier}</p>
      {s.awb && <p className="font-mono text-[#5B6B82]">AWB {s.awb}</p>}
      {s.pickupDate && <p className="text-[#5B6B82]">Pickup on {formatShortDate(s.pickupDate)}</p>}
      {s.deliveredAt && <p className="text-emerald-700">Delivered {formatShortDate(s.deliveredAt)}</p>}
      {s.trackingUrl && (
        <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-[#1D5FAF] hover:underline">
          Track <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// What can be done next (depends on the status)
// ---------------------------------------------------------------------------

interface ActionPanelProps {
  ret: ReturnRequest;
  busy: boolean;
  fieldErrors: Record<string, string>;
  approveNote: string;
  setApproveNote: (v: string) => void;
  onApprove: () => void;
  onRejectOpen: () => void;
  pickup: { pickupDate: string; courier: string; awb: string; trackingUrl: string };
  setPickup: React.Dispatch<React.SetStateAction<ActionPanelProps['pickup']>>;
  onPickup: () => void;
  conditions: Record<string, 'resellable' | 'damaged'>;
  setConditions: React.Dispatch<React.SetStateAction<Record<string, 'resellable' | 'damaged'>>>;
  receiveNote: string;
  setReceiveNote: (v: string) => void;
  onReceive: () => void;
  resolution: 'refund' | 'replacement';
  setResolution: (v: 'refund' | 'replacement') => void;
  refund: { amount: number; mode: RefundMode; reference: string; note: string };
  setRefund: React.Dispatch<React.SetStateAction<ActionPanelProps['refund']>>;
  modeOptions: { value: RefundMode; label: string }[];
  onRefund: () => void;
  replacement: { courier: string; awb: string; trackingUrl: string };
  setReplacement: React.Dispatch<React.SetStateAction<ActionPanelProps['replacement']>>;
  onShipReplacement: () => void;
  onComplete: () => void;
}

function ActionPanel(p: ActionPanelProps) {
  const { ret, busy, fieldErrors: fe } = p;
  const wrap = 'rounded-xl border-2 border-[#1D5FAF]/20 bg-[#F6F9FD] p-4 space-y-3';
  const heading = (icon: React.ReactNode, text: string, hint?: string) => (
    <div>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-[#12263F]">
        {icon}
        {text}
      </p>
      {hint && <p className="mt-0.5 text-xs text-[#5B6B82]">{hint}</p>}
    </div>
  );

  if (ret.status === 'requested') {
    return (
      <div className={wrap}>
        {heading(<ClipboardCheck className="h-4 w-4 text-[#1D5FAF]" />, 'Review this request', 'Check the photos and description, then approve or reject. The customer is notified either way.')}
        <FormField label="Message to the customer (optional)">
          <input value={p.approveNote} onChange={(e) => p.setApproveNote(e.target.value)} placeholder="e.g. Please keep the original box ready for pickup." className={inputClass} />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={p.onApprove} className={btnPrimary}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
          </button>
          <button type="button" disabled={busy} onClick={p.onRejectOpen} className={btnDanger}>
            <XCircle className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      </div>
    );
  }

  const pickupForm = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Pickup date" required error={fe.pickupDate}>
          <input type="date" value={p.pickup.pickupDate} onChange={(e) => p.setPickup((s) => ({ ...s, pickupDate: e.target.value }))} className={inputClass} />
        </FormField>
        <FormField label="Courier" required error={fe.courier}>
          <input list="return-couriers" value={p.pickup.courier} onChange={(e) => p.setPickup((s) => ({ ...s, courier: e.target.value }))} className={inputClass} />
          <datalist id="return-couriers">
            {COURIERS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
        <FormField label="AWB / reference" error={fe.awb}>
          <input value={p.pickup.awb} onChange={(e) => p.setPickup((s) => ({ ...s, awb: e.target.value }))} placeholder="Optional" className={`${inputClass} font-mono`} />
        </FormField>
        <FormField label="Tracking link" error={fe.trackingUrl}>
          <input value={p.pickup.trackingUrl} onChange={(e) => p.setPickup((s) => ({ ...s, trackingUrl: e.target.value }))} placeholder="https://…" className={inputClass} />
        </FormField>
      </div>
      <button type="button" disabled={busy || !p.pickup.pickupDate || p.pickup.courier.trim().length < 2} onClick={p.onPickup} className={btnPrimary}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />} Schedule pickup
      </button>
    </div>
  );

  const receiveForm = (
    <div className="space-y-3">
      <div className="space-y-2">
        {ret.items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs">
            <span className="font-medium text-[#12263F]">
              {it.productName} ×{it.quantity}
            </span>
            <div className="flex gap-1">
              {(['resellable', 'damaged'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => p.setConditions((s) => ({ ...s, [it.id]: c }))}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                    p.conditions[it.id] === c
                      ? c === 'damaged'
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'border border-[#DCE6F2] bg-white text-[#5B6B82] hover:bg-[#EAF2FC]'
                  }`}
                >
                  {c === 'resellable' ? 'Resellable' : 'Damaged'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <FormField label="Inspection note (visible to the customer)">
        <input value={p.receiveNote} onChange={(e) => p.setReceiveNote(e.target.value)} placeholder="e.g. Display cracked as reported; accessories complete." className={inputClass} />
      </FormField>
      <button type="button" disabled={busy} onClick={p.onReceive} className={btnPrimary}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />} Mark received &amp; inspected
      </button>
    </div>
  );

  const max = ret.refundable?.max ?? 0;
  const refundForm = (
    <div className="space-y-3">
      {max <= 0 ? (
        <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-3 text-xs text-[#B85A0E]">
          Nothing is left to refund on this order (paid {formatINR(ret.refundable?.paid ?? 0)}, refunded {formatINR(ret.refundable?.alreadyRefunded ?? 0)}).
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Amount (₹)" required error={fe.amount} hint={`Estimate ${formatINR(ret.requestedAmount)} · max ${formatINR(max)}`}>
              <input
                type="number"
                min={1}
                max={max}
                step="0.01"
                value={p.refund.amount || ''}
                onChange={(e) => p.setRefund((s) => ({ ...s, amount: Number(e.target.value) }))}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
            <FormField label="Refund to" required error={fe.mode}>
              <select value={p.refund.mode} onChange={(e) => p.setRefund((s) => ({ ...s, mode: e.target.value as RefundMode }))} className={selectClass}>
                {p.modeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
            {p.refund.mode !== 'gateway' && (
              <FormField label={p.refund.mode === 'upi' ? 'UPI transaction id' : 'UTR / bank reference'} required error={fe.reference}>
                <input value={p.refund.reference} onChange={(e) => p.setRefund((s) => ({ ...s, reference: e.target.value }))} className={`${inputClass} font-mono`} />
              </FormField>
            )}
            <FormField label="Note to the customer" className={p.refund.mode === 'gateway' ? 'sm:col-span-2' : ''}>
              <input value={p.refund.note} onChange={(e) => p.setRefund((s) => ({ ...s, note: e.target.value }))} placeholder="Optional" className={inputClass} />
            </FormField>
          </div>
          {p.refund.mode !== 'gateway' && (
            <p className="text-[11px] text-[#5B6B82]">Send the money from the bank first, then record the transfer here with its reference.</p>
          )}
          <button
            type="button"
            disabled={busy || !(p.refund.amount >= 1) || p.refund.amount > max || (p.refund.mode !== 'gateway' && !p.refund.reference.trim())}
            onClick={p.onRefund}
            className={btnSuccess}
          >
            <Banknote className="h-3.5 w-3.5" /> Issue refund of {formatINR(p.refund.amount || 0)}
          </button>
        </>
      )}
    </div>
  );

  const replacementForm = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Courier" required error={fe.courier}>
          <input value={p.replacement.courier} onChange={(e) => p.setReplacement((s) => ({ ...s, courier: e.target.value }))} className={inputClass} />
        </FormField>
        <FormField label="AWB" error={fe.awb}>
          <input value={p.replacement.awb} onChange={(e) => p.setReplacement((s) => ({ ...s, awb: e.target.value }))} className={`${inputClass} font-mono`} />
        </FormField>
        <FormField label="Tracking link" error={fe.trackingUrl}>
          <input value={p.replacement.trackingUrl} onChange={(e) => p.setReplacement((s) => ({ ...s, trackingUrl: e.target.value }))} placeholder="https://…" className={inputClass} />
        </FormField>
      </div>
      <button type="button" disabled={busy || p.replacement.courier.trim().length < 2} onClick={p.onShipReplacement} className={btnPrimary}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />} Ship replacement
      </button>
    </div>
  );

  const resolutionSwitch = (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-[#DCE6F2] bg-white p-0.5">
        {(['refund', 'replacement'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => p.setResolution(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${p.resolution === r ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:text-[#12263F]'}`}
          >
            {r === 'refund' ? 'Refund' : 'Send replacement'}
            {ret.type === r && <span className="ml-1 opacity-75">(requested)</span>}
          </button>
        ))}
      </div>
      {p.resolution === 'refund' ? refundForm : replacementForm}
    </div>
  );

  if (ret.status === 'approved') {
    return (
      <div className={wrap}>
        {heading(<Truck className="h-4 w-4 text-[#1D5FAF]" />, 'Arrange the reverse pickup', 'Book the pickup with the courier and record it here. The customer is notified.')}
        {pickupForm}
        <details className="rounded-lg border border-[#DCE6F2] bg-white p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-[#12263F]">No pickup needed?</summary>
          <div className="mt-3 space-y-4">
            <div>
              <p className="mb-2 text-[#5B6B82]">The customer dropped the item off or sent it themselves:</p>
              {receiveForm}
            </div>
            <div className="border-t border-[#DCE6F2] pt-3">
              <p className="mb-2 text-[#5B6B82]">Resolve without taking the item back (e.g. low-value or missing part):</p>
              {resolutionSwitch}
            </div>
          </div>
        </details>
        <button type="button" disabled={busy} onClick={p.onRejectOpen} className={btnDanger}>
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    );
  }

  if (ret.status === 'pickup_scheduled') {
    return (
      <div className={wrap}>
        {heading(<PackageCheck className="h-4 w-4 text-[#1D5FAF]" />, 'Receive and inspect', 'When the item reaches the warehouse, record the condition of each unit.')}
        {receiveForm}
        <div className="flex flex-wrap gap-2 border-t border-[#DCE6F2] pt-3">
          <button type="button" disabled={busy} onClick={p.onRejectOpen} className={btnDanger}>
            <XCircle className="h-3.5 w-3.5" /> Reject (pickup failed / not eligible)
          </button>
        </div>
      </div>
    );
  }

  if (ret.status === 'received') {
    return (
      <div className={wrap}>
        {heading(
          <RotateCcw className="h-4 w-4 text-[#1D5FAF]" />,
          ret.type === 'replacement' ? 'Send the replacement' : 'Refund the customer',
          ret.type === 'replacement'
            ? 'The customer asked for a replacement. If it is out of stock you can refund instead.'
            : 'The customer asked for their money back.'
        )}
        {resolutionSwitch}
        <div className="border-t border-[#DCE6F2] pt-3">
          <button type="button" disabled={busy} onClick={p.onRejectOpen} className={btnDanger}>
            <XCircle className="h-3.5 w-3.5" /> Reject after inspection
          </button>
        </div>
      </div>
    );
  }

  if (ret.status === 'replacement_shipped') {
    return (
      <div className={wrap}>
        {heading(<Truck className="h-4 w-4 text-[#1D5FAF]" />, 'Replacement on the way', 'Close the request once the courier confirms delivery.')}
        <button type="button" disabled={busy} onClick={p.onComplete} className={btnSuccess}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark replacement delivered
        </button>
      </div>
    );
  }

  return null;
}
