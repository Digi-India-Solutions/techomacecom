'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Bed, Loader2, RefreshCw } from 'lucide-react';
import type { CustomerRental } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { useSiteSettings } from '@/lib/settings/store';
import { errorMessage } from '@/lib/api/backend';
import { PaymentCancelled } from '@/lib/razorpay';
import { EmptyState, SectionHeader, btnPrimary, btnSecondary } from './ui';
import { OPEN_RENTAL, StatusPill, Steps, TONE, day, inr, rentalMessage } from './rentals/rentalUi';
import { payRental } from './rentals/payments';

type Filter = 'all' | 'open' | 'closed';

/** My Account → Rentals (data is loaded by the account page). */
export default function RentalsTabContent({
  rentals,
  loading,
  error,
  onReload,
  onChanged,
}: {
  rentals: CustomerRental[];
  loading: boolean;
  error: string;
  onReload: () => void;
  onChanged: (r: CustomerRental) => void;
}) {
  const { store, rental: rules } = useSiteSettings();
  const { user } = useUserStore();
  const { addToast } = useToastStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [payingId, setPayingId] = useState<string | null>(null);

  const visible = useMemo(
    () => rentals.filter((r) => (filter === 'all' ? true : filter === 'open' ? OPEN_RENTAL.includes(r.status) : !OPEN_RENTAL.includes(r.status))),
    [rentals, filter]
  );
  const openCount = rentals.filter((r) => OPEN_RENTAL.includes(r.status)).length;

  const pay = async (r: CustomerRental, kind: 'advance' | 'balance') => {
    setPayingId(r.id);
    try {
      const updated = await payRental(r, kind, store.brandName, user);
      onChanged(updated);
      addToast({ type: 'success', title: 'Payment received', message: `Thank you! ${updated.rentalNumber} is updated.` });
    } catch (err) {
      if (!(err instanceof PaymentCancelled)) addToast({ type: 'error', title: 'Payment failed', message: errorMessage(err) });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <>
      <SectionHeader
        title="Your rentals"
        subtitle="Track bookings, documents, deliveries, extensions, pickups and deposit refunds."
        action={
          <Link href="/rent" className={btnSecondary}>
            <Bed className="w-4 h-4" /> Rent equipment
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-[#F1F5F9] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed border-[#D5DEEA] rounded-2xl">
          <AlertTriangle className="w-8 h-8 text-[#F28C38] mx-auto" />
          <p className="mt-3 text-[15px] font-semibold text-[#12263F]">{error}</p>
          <button type="button" onClick={onReload} className={`${btnSecondary} mt-4`}>
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : rentals.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No rentals yet"
          text="Rent oxygen concentrators, CPAP/BiPAP, hospital beds and more — delivered, installed and picked up by our team."
          cta={<Link href="/rent" className={btnPrimary}>Browse rental equipment</Link>}
        />
      ) : (
        <>
          <div className="inline-flex rounded-xl border border-[#DCE6F2] p-1 bg-[#F8FAFD] mb-4" role="tablist">
            {(
              [
                ['all', `All (${rentals.length})`],
                ['open', `Ongoing (${openCount})`],
                ['closed', `Completed (${rentals.length - openCount})`],
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

          <div className="space-y-5">
            {visible.map((r) => {
              const msg = rentalMessage(r, rules.depositRefundDays);
              const busy = payingId === r.id;
              return (
                <article key={r.id} className="border border-[#DCE6F2] rounded-2xl overflow-hidden transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(11,37,69,0.18)]">
                  <div className="bg-[#F8FAFD] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EEF5] text-[13px]">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <span>
                        <span className="text-[#8A97A8]">Rental </span>
                        <span className="font-semibold text-[#12263F]">{r.rentalNumber}</span>
                      </span>
                      <span>
                        <span className="text-[#8A97A8]">Booked </span>
                        <span className="text-[#12263F]">{day(r.createdAt)}</span>
                      </span>
                      <span>
                        <span className="text-[#8A97A8]">Total </span>
                        <span className="font-semibold text-[#12263F]">{inr(r.amounts.total)}</span>
                      </span>
                    </div>
                    <StatusPill r={r} />
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-16 h-16 rounded-lg bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
                          {r.product.image ? (
                            <Image src={r.product.image} alt={r.product.name} fill className="object-contain p-1.5" sizes="64px" referrerPolicy="no-referrer" />
                          ) : (
                            <Bed className="w-7 h-7 m-auto mt-4 text-[#C5CFDC]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          {r.product.brand && <p className="text-[12px] uppercase tracking-wide text-[#8A97A8]">{r.product.brand}</p>}
                          <p className="text-[14px] font-semibold text-[#12263F] line-clamp-2">{r.product.name}</p>
                          <p className="text-[13px] text-[#5B6B82]">
                            {r.plan.durationLabel} · {inr(r.plan.rate)}/{r.plan.unit}
                            {r.startDate && r.endDate ? ` · ${day(r.startDate)} → ${day(r.endDate)}` : r.requestedStartDate ? ` · from ${day(r.requestedStartDate)}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {r.actions.payAdvance && (
                          <button type="button" disabled={busy} onClick={() => pay(r, 'advance')} className={`${btnPrimary} !py-2`}>
                            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Pay {inr(r.amounts.advanceDue)}
                          </button>
                        )}
                        {!r.actions.payAdvance && r.actions.payBalance && r.balanceDuePolicy === 'before_dispatch' && ['pending_approval', 'approved'].includes(r.status) && (
                          <button type="button" disabled={busy} onClick={() => pay(r, 'balance')} className={`${btnPrimary} !py-2`}>
                            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Pay balance {inr(r.amounts.balanceDue)}
                          </button>
                        )}
                        <Link href={`/account/rentals/${r.id}`} className={`${btnSecondary} !py-2`}>
                          {r.actions.uploadKyc ? 'Upload documents' : 'View details'} <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {msg.text && <p className={`rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed ${TONE[msg.tone]}`}>{msg.text}</p>}
                    {r.status !== 'pending_payment' && <Steps r={r} compact />}
                  </div>
                </article>
              );
            })}
            {visible.length === 0 && <p className="py-10 text-center text-[14px] text-[#5B6B82]">Nothing here.</p>}
          </div>
        </>
      )}
    </>
  );
}
