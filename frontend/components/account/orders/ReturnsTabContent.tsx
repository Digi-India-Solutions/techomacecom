'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import type { OrderReturnRequest } from '@/types';
import { fetchMyReturns } from '@/lib/api/orders';
import { errorMessage } from '@/lib/api/backend';
import { useSiteSettings } from '@/lib/settings/store';
import { EmptyState, SectionHeader, btnPrimary, btnSecondary } from '../ui';
import ReturnTracker from './ReturnTracker';
import { OPEN_RETURN_STATUSES, formatINR } from './returnUi';

type Filter = 'all' | 'open' | 'closed';

/** My Account → Returns & refunds: every request across orders. */
export default function ReturnsTabContent({ onOpenOrder, onChanged }: { onOpenOrder: (orderId: string) => void; onChanged?: () => void }) {
  const { returns: policy } = useSiteSettings();
  const [items, setItems] = useState<OrderReturnRequest[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(
    () =>
      fetchMyReturns()
        .then((rows) => {
          setItems(rows);
          setError('');
        })
        .catch((err) => setError(errorMessage(err, 'Could not load your returns.'))),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setError('');
    setItems(null);
    load();
  };

  const visible = useMemo(() => {
    if (!items) return [];
    if (filter === 'open') return items.filter((r) => OPEN_RETURN_STATUSES.includes(r.status));
    if (filter === 'closed') return items.filter((r) => !OPEN_RETURN_STATUSES.includes(r.status));
    return items;
  }, [items, filter]);

  const refunded = (items || []).reduce((sum, r) => sum + r.refundedAmount, 0);
  const openCount = (items || []).filter((r) => OPEN_RETURN_STATUSES.includes(r.status)).length;

  return (
    <>
      <SectionHeader
        title="Returns & refunds"
        subtitle={`Track pickups, replacements and refunds. Requests can be raised within ${policy.returnWindowDays} days of delivery from Your orders.`}
        action={
          <Link href="/policies/returns" className="text-[13px] font-semibold text-[#1D5FAF] hover:underline">
            Returns policy
          </Link>
        }
      />

      {error ? (
        <div className="text-center py-12 border border-dashed border-[#D5DEEA] rounded-2xl">
          <AlertTriangle className="w-8 h-8 text-[#F28C38] mx-auto" />
          <p className="mt-3 text-[15px] font-semibold text-[#12263F]">{error}</p>
          <button type="button" onClick={retry} className={`${btnSecondary} mt-4`}>
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : items === null ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-[#F1F5F9] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No returns yet"
          text="If something isn't right with a delivered order, open it under Your orders and choose “Return or replace”."
          cta={
            <button type="button" onClick={() => onOpenOrder('')} className={btnPrimary}>
              Go to your orders
            </button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex rounded-xl border border-[#DCE6F2] p-1 bg-[#F8FAFD]" role="tablist">
              {(
                [
                  ['all', `All (${items.length})`],
                  ['open', `In progress (${openCount})`],
                  ['closed', `Closed (${items.length - openCount})`],
                ] as [Filter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${filter === key ? 'bg-white text-[#1D5FAF] shadow-sm' : 'text-[#5B6B82] hover:text-[#12263F]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {refunded > 0 && (
              <p className="text-[13px] text-[#5B6B82]">
                Total refunded <span className="font-semibold text-[#16A34A]">{formatINR(refunded)}</span>
              </p>
            )}
          </div>
          {visible.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-[#5B6B82]">Nothing here.</p>
          ) : (
            <div className="space-y-4">
              {visible.map((r) => (
                <ReturnTracker
                  key={r.id}
                  ret={r}
                  showOrder
                  onOpenOrder={onOpenOrder}
                  onChanged={(updated) => {
                    setItems((prev) => (prev || []).map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
                    onChanged?.();
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
