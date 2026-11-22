'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, ExternalLink, Loader2, Package, Repeat, Truck, Undo2, X } from 'lucide-react';
import type { OrderReturnRequest } from '@/types';
import { cancelReturnRequest } from '@/lib/api/orders';
import { errorMessage } from '@/lib/api/backend';
import { useSiteSettings } from '@/lib/settings/store';
import { useToastStore } from '@/lib/store';
import { REFUND_STATUS_LABEL, RETURN_STATUS_STYLE, formatDay, formatINR, nextStepMessage } from './returnUi';

interface Props {
  ret: OrderReturnRequest;
  /** Called after the customer withdraws the request */
  onChanged?: (updated: OrderReturnRequest) => void;
  /** Show the order number (used on the Returns tab) */
  showOrder?: boolean;
  onOpenOrder?: (orderId: string) => void;
}

/** One return / replacement request: progress, what happens next, refunds and tracking. */
export default function ReturnTracker({ ret, onChanged, showOrder, onOpenOrder }: Props) {
  const { returns: settings } = useSiteSettings();
  const { addToast } = useToastStore();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const closedBad = ret.status === 'rejected' || ret.status === 'cancelled';
  const TypeIcon = ret.type === 'replacement' ? Repeat : Undo2;
  const message = nextStepMessage(ret, settings.refundProcessingDays);

  const withdraw = async () => {
    setCancelling(true);
    try {
      const updated = await cancelReturnRequest(ret.id);
      addToast({ type: 'success', title: 'Request cancelled', message: `${ret.returnNumber} has been withdrawn.` });
      setConfirming(false);
      onChanged?.(updated);
    } catch (err) {
      addToast({ type: 'error', title: 'Could not cancel the request', message: errorMessage(err) });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden" aria-label={`${ret.typeLabel} ${ret.returnNumber}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#F8FAFD] border-b border-[#E8EEF5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center shrink-0">
            <TypeIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#12263F]">
              {ret.type === 'replacement' ? 'Replacement' : 'Return & refund'}
              <span className="ml-2 font-mono text-[12px] font-medium text-[#5B6B82]">{ret.returnNumber}</span>
            </p>
            <p className="text-[12px] text-[#8A97A8]">
              {showOrder && ret.orderNumber && (
                <>
                  {onOpenOrder ? (
                    <button type="button" onClick={() => onOpenOrder(ret.orderId)} className="text-[#1D5FAF] hover:underline cursor-pointer">
                      Order {ret.orderNumber}
                    </button>
                  ) : (
                    <>Order {ret.orderNumber}</>
                  )}{' '}
                  ·{' '}
                </>
              )}
              Requested {formatDay(ret.createdAt)}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${RETURN_STATUS_STYLE[ret.status] || RETURN_STATUS_STYLE.requested}`}>{ret.statusLabel}</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Progress */}
        <ol className="flex items-start" aria-label="Progress">
          {ret.steps.map((s, i) => {
            const bad = s.key === 'rejected' || s.key === 'cancelled';
            return (
              <li key={s.key} className="relative flex-1 flex flex-col items-center text-center min-w-0">
                {i < ret.steps.length - 1 && (
                  <span aria-hidden className={`absolute top-[11px] left-1/2 w-full h-0.5 ${ret.steps[i + 1].done ? (ret.steps[i + 1].key === 'rejected' || ret.steps[i + 1].key === 'cancelled' ? 'bg-red-300' : 'bg-[#16A34A]') : 'bg-[#E2E8F0]'}`} />
                )}
                <span
                  className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                    bad ? 'bg-red-500 text-white' : s.done ? 'bg-[#16A34A] text-white' : 'bg-white border-2 border-[#D5DEEA]'
                  } ${s.current && !bad ? 'ring-4 ring-[#16A34A]/15' : ''}`}
                >
                  {bad ? <X className="w-3.5 h-3.5" /> : s.done ? <Check className="w-3.5 h-3.5" /> : null}
                </span>
                <span className={`mt-1.5 px-0.5 text-[11px] sm:text-[12px] leading-tight ${s.done ? 'font-semibold text-[#12263F]' : 'text-[#8A97A8]'}`}>{s.label}</span>
                {s.at && <span className="hidden sm:block text-[11px] text-[#8A97A8] mt-0.5">{formatDay(s.at)}</span>}
              </li>
            );
          })}
        </ol>

        {/* What happens next */}
        {message && (
          <p className={`rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${closedBad ? 'bg-red-50 text-red-800' : ret.status === 'refunded' || ret.status === 'completed' ? 'bg-[#F0FDF4] text-[#14532D]' : 'bg-[#F3F8FE] text-[#12263F]'}`}>
            {message}
          </p>
        )}

        {/* Tracking */}
        {(ret.pickup || ret.replacementShipment) && (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {ret.pickup && <ShipmentLine title="Pickup" s={ret.pickup} />}
            {ret.replacementShipment && <ShipmentLine title="Replacement" s={ret.replacementShipment} />}
          </div>
        )}

        {/* Refunds */}
        {ret.refunds.filter((r) => r.status !== 'failed').map((r) => {
          const st = REFUND_STATUS_LABEL[r.status];
          return (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E8EEF5] px-3.5 py-2.5 text-[13px]">
              <span className="text-[#12263F]">
                <span className="font-semibold">{formatINR(r.amount)}</span> refunded to {r.method === 'gateway' ? 'original payment method' : r.methodLabel.toLowerCase()}
                {r.reference && <span className="ml-1.5 font-mono text-[12px] text-[#8A97A8]">Ref {r.reference}</span>}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${st?.style}`}>{st?.label}</span>
            </div>
          );
        })}

        {/* Details */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer"
        >
          {expanded ? 'Hide request details' : 'View request details'}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="space-y-3 text-[13px]">
            <ul className="divide-y divide-[#EEF2F7] rounded-lg border border-[#E8EEF5]">
              {ret.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-10 h-10 rounded-md bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
                    {it.image ? (
                      <Image src={it.image} alt="" fill className="object-contain p-0.5" sizes="40px" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="w-5 h-5 m-auto mt-2.5 text-[#C5CFDC]" />
                    )}
                  </div>
                  <span className="flex-1 min-w-0 text-[#12263F] line-clamp-1">
                    {it.productName}
                    {it.variantName && <span className="text-[#8A97A8]"> · {it.variantName}</span>}
                  </span>
                  <span className="text-[#5B6B82] shrink-0">× {it.quantity}</span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[#5B6B82]">
              <dt>Reason</dt>
              <dd className="text-[#12263F]">{ret.reason}</dd>
              {ret.customerNote && (
                <>
                  <dt>Your note</dt>
                  <dd className="text-[#12263F] whitespace-pre-line">{ret.customerNote}</dd>
                </>
              )}
              {ret.type === 'refund' && ret.requestedAmount > 0 && (
                <>
                  <dt>Item value</dt>
                  <dd className="text-[#12263F]">{formatINR(ret.requestedAmount)}</dd>
                </>
              )}
              {ret.refundAccount && (
                <>
                  <dt>Refund to</dt>
                  <dd className="text-[#12263F]">{ret.refundAccount.label}</dd>
                </>
              )}
            </dl>
            {ret.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ret.photos.map((p, i) => (
                  <a key={p} href={p} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-[#DCE6F2] hover:ring-2 hover:ring-[#1D5FAF]/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            {ret.timeline.length > 0 && (
              <ol className="border-l-2 border-[#E2E8F0] pl-4 space-y-2.5">
                {ret.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1D5FAF] border-2 border-white" />
                    <p className="font-semibold text-[#12263F]">
                      {t.label} <span className="font-normal text-[#8A97A8]">· {new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    </p>
                    {t.note && <p className="text-[#5B6B82]">{t.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Withdraw */}
        {ret.canCancel && (
          <div className="pt-1 border-t border-[#EEF2F7]">
            {confirming ? (
              <div className="flex flex-wrap items-center gap-2 pt-3 text-[13px]">
                <span className="text-[#12263F]">Withdraw this request? You can raise a new one while the return window is open.</span>
                <button type="button" onClick={withdraw} disabled={cancelling} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50 cursor-pointer">
                  {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Yes, withdraw
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={cancelling} className="rounded-lg border border-[#D5DEEA] px-3 py-1.5 font-semibold text-[#12263F] cursor-pointer">
                  Keep it
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="mt-3 text-[13px] font-semibold text-red-600 hover:underline cursor-pointer">
                Cancel this request
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ShipmentLine({ title, s }: { title: string; s: NonNullable<OrderReturnRequest['pickup']> }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-[#E8EEF5] px-3.5 py-2.5 text-[13px]">
      <Truck className="w-4 h-4 text-[#1D5FAF] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold text-[#12263F]">
          {title} · {s.courier}
        </p>
        <p className="text-[12px] text-[#5B6B82]">
          {s.pickupDate && <>On {formatDay(s.pickupDate)} · </>}
          {s.awb ? <span className="font-mono">AWB {s.awb}</span> : 'AWB will be shared by the courier'}
          {s.deliveredAt && <> · Delivered {formatDay(s.deliveredAt)}</>}
        </p>
        {s.trackingUrl && (
          <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D5FAF] hover:underline mt-0.5">
            Track <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
