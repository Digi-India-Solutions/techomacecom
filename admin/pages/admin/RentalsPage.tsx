import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  IndianRupee,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Wallet,
} from 'lucide-react';
import type { AdminRental, RentalsSummary } from '@/types/admin';
import { listRentals, type RentalListFilter } from '@/lib/api/admin/rentals';
import { formatINR, formatShortDate } from '@/lib/api/admin/client';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useAuth } from '@/components/admin/AuthContext';
import { SafeImage } from '@/components/admin/SafeImage';
import { EmptyState } from '@/components/admin/EmptyState';
import { inputClass } from '@/components/admin/FormField';

const card = 'rounded-xl border border-[#DCE6F2] bg-white';

const TABS: { key: RentalListFilter; label: string; countKeys?: string[] }[] = [
  { key: 'all', label: 'All', countKeys: ['all'] },
  { key: 'pending_approval', label: 'Under review', countKeys: ['pending_approval'] },
  { key: 'approved', label: 'To dispatch', countKeys: ['approved'] },
  { key: 'dispatched', label: 'Dispatched', countKeys: ['dispatched'] },
  { key: 'active', label: 'Active', countKeys: ['active', 'extension_requested'] },
  { key: 'overdue', label: 'Overdue', countKeys: ['overdue'] },
  { key: 'return_scheduled', label: 'Pickup', countKeys: ['return_scheduled'] },
  { key: 'returned', label: 'Deposit to refund', countKeys: ['returned'] },
  { key: 'deposit_refunded', label: 'Completed', countKeys: ['deposit_refunded'] },
  { key: 'pending_payment', label: 'Awaiting payment', countKeys: ['pending_payment'] },
  { key: 'cancelled', label: 'Cancelled', countKeys: ['cancelled'] },
];

const KYC_TONE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  submitted: 'bg-[#F28C38]/12 text-[#B85A0E] border-[#F28C38]/35',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function periodCell(r: AdminRental) {
  if (r.startDate && r.endDate) {
    return (
      <>
        <p className="text-xs text-[#12263F] tabular-nums">
          {formatShortDate(r.startDate)} → {formatShortDate(r.endDate)}
        </p>
        {r.status === 'overdue' ? (
          <p className="text-[11px] font-semibold text-red-600">{r.overdueDays} day(s) overdue</p>
        ) : r.daysLeft != null ? (
          <p className={`text-[11px] ${r.daysLeft <= 3 ? 'font-semibold text-[#B85A0E]' : 'text-[#5B6B82]'}`}>{r.daysLeft} day(s) left</p>
        ) : null}
      </>
    );
  }
  return (
    <p className="text-xs text-[#5B6B82]">
      Wants from {r.requestedStartDate ? formatShortDate(r.requestedStartDate) : '—'}{r.requestedDeliveryTimeLabel ? `, ${r.requestedDeliveryTimeLabel}` : ''}
    </p>
  );
}

export function RentalsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<RentalListFilter>((params.get('status') as RentalListFilter) || 'all');
  const [due, setDue] = useState<'7d' | 'kyc' | undefined>(
    params.get('filter') === 'due_7d' ? '7d' : params.get('filter') === 'kyc' ? 'kyc' : undefined
  );
  const [query, setQuery] = useState(params.get('search') || '');
  const [debounced, setDebounced] = useState(query);
  const [items, setItems] = useState<AdminRental[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<RentalsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listRentals({ status: due ? 'all' : status, due, q: debounced });
      setItems(res.items);
      setCounts(res.counts);
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load rentals');
    } finally {
      setLoading(false);
    }
  }, [status, due, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const pickTab = (key: RentalListFilter) => {
    setStatus(key);
    setDue(undefined);
    const next = new URLSearchParams(params);
    next.delete('filter');
    if (key === 'all') next.delete('status');
    else next.set('status', key);
    setParams(next, { replace: true });
  };

  const pickQueue = (q: '7d' | 'kyc') => {
    const nextDue = due === q ? undefined : q;
    setDue(nextDue);
    setStatus('all');
    const next = new URLSearchParams(params);
    next.delete('status');
    if (nextDue) next.set('filter', nextDue === '7d' ? 'due_7d' : 'kyc');
    else next.delete('filter');
    setParams(next, { replace: true });
  };

  const kpis = [
    { label: 'Awaiting approval', value: summary?.awaitingApproval ?? 0, icon: ClipboardCheck, tone: 'text-[#B85A0E] bg-[#F28C38]/12', onClick: () => pickTab('pending_approval') },
    { label: 'KYC to verify', value: summary?.kycToReview ?? 0, icon: FileCheck2, tone: 'text-violet-700 bg-violet-50', onClick: () => pickQueue('kyc') },
    { label: 'To dispatch', value: summary?.toDispatch ?? 0, icon: Truck, tone: 'text-[#1D5FAF] bg-[#EAF2FC]', onClick: () => pickTab('approved') },
    { label: 'Due in 7 days', value: summary?.dueIn7Days ?? 0, icon: CalendarClock, tone: 'text-sky-700 bg-sky-50', onClick: () => pickQueue('7d') },
    { label: 'Overdue', value: summary?.overdue ?? 0, icon: AlertTriangle, tone: 'text-red-700 bg-red-50', onClick: () => pickTab('overdue') },
    { label: 'Deposits to refund', value: summary?.depositsToRefund ?? 0, icon: Wallet, tone: 'text-emerald-700 bg-emerald-50', onClick: () => pickTab('returned') },
  ];

  return (
    <div className="space-y-5">
      {/* <div className="flex w-full flex-nowrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12263F]">Rentals</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Verify KYC, confirm bookings, assign serial-numbered units, track deliveries, extensions and returns, and refund deposits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {summary && summary.depositsHeld > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs text-[#5B6B82]">
              <IndianRupee className="h-3.5 w-3.5" /> Deposits held <strong className="text-[#12263F]">{formatINR(summary.depositsHeld)}</strong>
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {can('rentals.create') && (
            <Link
              to="/admin/rentals/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              <Plus className="h-3.5 w-3.5" /> New rental
            </Link>
          )}
        </div>
      </div> */}

      <div className="flex w-full items-center justify-between gap-4">
  <div className="flex-1 min-w-0">
    <h1 className="text-2xl font-bold tracking-tight text-[#12263F]">
      Rentals
    </h1>
    <p className="mt-0.5 whitespace-nowrap text-sm text-[#5B6B82]">
      Verify KYC, confirm bookings, assign serial-numbered units, track deliveries, extensions and returns, and refund deposits.
    </p>
  </div>

  <div className="ml-auto flex shrink-0 items-center gap-2">
    {summary && summary.depositsHeld > 0 && (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs text-[#5B6B82]">
        <IndianRupee className="h-3.5 w-3.5" /> Deposits held
        <strong className="text-[#12263F]">
          {formatINR(summary.depositsHeld)}
        </strong>
      </span>
    )}

    <button
      type="button"
      onClick={load}
      disabled={loading}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
    </button>

    {can('rentals.create') && (
      <Link
        to="/admin/rentals/new"
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
      >
        <Plus className="h-3.5 w-3.5" /> New rental
      </Link>
    )}
  </div>
</div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button key={k.label} type="button" onClick={k.onClick} className={`${card} flex items-center gap-3 p-3.5 text-left transition-shadow hover:shadow-md`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${k.tone}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold tabular-nums text-[#12263F]">{k.value}</span>
                <span className="block truncate text-[11px] text-[#5B6B82]">{k.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={`${card} space-y-3 p-3`}>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const n = (t.countKeys || []).reduce((s, k) => s + (counts[k] || 0), 0);
            const active = !due && status === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => pickTab(t.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
                }`}
              >
                {t.label}
                <span className={`rounded px-1.5 text-[10px] tabular-nums ${active ? 'bg-white/20' : 'bg-[#F6F9FD]'}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rental #, customer, phone, product, serial…" className={`${inputClass} pl-8`} />
          </div>
          {due && (
            <button type="button" onClick={() => pickQueue(due)} className="self-start rounded-lg bg-[#EAF2FC] px-3 py-1.5 text-xs font-semibold text-[#1D5FAF]">
              {due === '7d' ? 'Due in 7 days' : 'KYC to verify'} ✕
            </button>
          )}
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {loading && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-[#F28C38]" />
            <p className="text-sm font-semibold text-[#12263F]">Could not load rentals</p>
            <p className="text-xs text-[#5B6B82]">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={PackageCheck}
              title={debounced || status !== 'all' || due ? 'No rentals match these filters' : 'No rental bookings yet'}
              description="Bookings made from the website's Rent pages appear here once the customer starts checkout."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                  <th className="px-4 py-3">Rental</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Equipment &amp; plan</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {items.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-[#F6F9FD]" onClick={() => navigate(`/admin/rentals/${r.id}`)}>
                    <td className="px-4 py-3 align-top">
                      <Link to={`/admin/rentals/${r.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs font-semibold text-[#1D5FAF] hover:underline">
                        {r.rentalNumber}
                      </Link>
                      <p className="text-[11px] text-[#5B6B82]">{formatShortDate(r.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-semibold text-[#12263F]">{r.customer.name}</p>
                      <p className="text-[11px] text-[#5B6B82]">
                        {r.customer.phone || r.customer.email}
                        {r.deliveryAddress?.city ? ` · ${r.deliveryAddress.city}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[#DCE6F2]">
                          <SafeImage src={r.product.image} alt={r.product.name} />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-xs font-medium text-[#12263F]">{r.product.name}</p>
                          <p className="text-[11px] text-[#5B6B82]">
                            {r.plan.durationLabel} · {formatINR(r.plan.rate)}/{r.plan.unit}
                            {r.unit ? ` · ${r.unit.unitCode}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">{periodCell(r)}</td>
                    <td className="px-4 py-3 text-right align-top tabular-nums">
                      <p className="text-xs font-semibold text-[#12263F]">{formatINR(r.amounts.total)}</p>
                      {r.amounts.balanceDue > 0 && r.status !== 'cancelled' ? (
                        <p className="text-[11px] font-semibold text-[#B85A0E]">Due {formatINR(r.amounts.balanceDue)}</p>
                      ) : (
                        <p className="text-[11px] text-emerald-700">Paid {formatINR(r.amounts.paid)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {r.kyc.required ? (
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${KYC_TONE[r.kyc.status || 'pending']}`}>
                          {r.kyc.statusLabel}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#5B6B82]">Not needed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={r.status} label={r.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
