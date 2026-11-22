'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Bed,
  CalendarPlus,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  Truck,
  Upload,
  XCircle,
} from 'lucide-react';
import type { CustomerRental, RentalKycDoc } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { useSiteSettings } from '@/lib/settings/store';
import { errorMessage } from '@/lib/api/backend';
import { cancelMyRental, fetchMyRental, openKycDocument, requestRentalPickup, uploadRentalKycDocument } from '@/lib/api/rentals';
import { PaymentCancelled } from '@/lib/razorpay';
import { StatusPill, Steps, TONE, day, inr, rentalMessage } from './rentals/rentalUi';
import { payExtension, payRental } from './rentals/payments';

const card = 'bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-6';
const h2 = 'text-[16px] font-semibold text-[#12263F]';
const btn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
const CANCEL_REASONS = ['Plans changed', 'Patient recovered / no longer needed', 'Found another option', 'Booked by mistake', 'Other'];

const ymdFrom = (base: number, offsetDays: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(base + offsetDays * 86_400_000));

export default function RentalDetailView({ id }: { id: string }) {
  const { store, rental: rules } = useSiteSettings();
  const { user, isAuthenticated, setAuthModalOpen } = useUserStore();
  const { addToast } = useToastStore();
  const [r, setR] = useState<CustomerRental | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [extendBy, setExtendBy] = useState(1);
  const [pickupDate, setPickupDate] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [openedAt] = useState(() => Date.now());
  const ymd = (offset: number) => ymdFrom(openedAt, offset);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(
    () =>
      fetchMyRental(id)
        .then((x) => {
          setR(x);
          setError('');
        })
        .catch((err) => setError(errorMessage(err, 'We could not load this rental.'))),
    [id]
  );

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <Lock className="w-8 h-8 text-[#1D5FAF] mx-auto" />
        <p className="mt-3 text-[15px] font-semibold text-[#12263F]">Sign in to see this rental</p>
        <button type="button" onClick={() => setAuthModalOpen(true)} className={`${btn} mt-4 bg-[#1D5FAF] text-white`}>
          Login / Sign up
        </button>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-[#D5DEEA] rounded-2xl">
        <AlertTriangle className="w-8 h-8 text-[#F28C38] mx-auto" />
        <p className="mt-3 text-[15px] font-semibold text-[#12263F]">{error}</p>
        <button type="button" onClick={load} className={`${btn} mt-4 border border-[#D5DEEA] text-[#12263F]`}>
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }
  if (!r) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-28 rounded-2xl bg-[#F1F5F9] animate-pulse" />
        <div className="h-64 rounded-2xl bg-[#F1F5F9] animate-pulse" />
      </div>
    );
  }

  const msg = rentalMessage(r, rules.depositRefundDays);
  const act = async (key: string, fn: () => Promise<CustomerRental>, success: string) => {
    setBusy(key);
    try {
      setR(await fn());
      addToast({ type: 'success', title: success, message: '' });
      return true;
    } catch (err) {
      if (!(err instanceof PaymentCancelled)) addToast({ type: 'error', title: 'Something went wrong', message: errorMessage(err) });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const viewDoc = async (doc: RentalKycDoc) => {
    const win = window.open('', '_blank');
    try {
      const url = await openKycDocument(doc.id);
      if (win) win.location.href = url;
    } catch (err) {
      win?.close();
      addToast({ type: 'error', title: 'Could not open the file', message: errorMessage(err) });
    }
  };

  const extendCost = extendBy * r.plan.rate;
  const minPickup = ymd(1);
  const maxPickup = ymd(60);
  // Default: the booked end date (within the allowed window), else tomorrow
  const defaultPickup = r.endDate && r.endDate > minPickup ? (r.endDate < maxPickup ? r.endDate : maxPickup) : minPickup;
  const chosenPickup = pickupDate || defaultPickup;

  return (
    <div className="space-y-5">
      <Link href="/account?tab=rentals" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5B6B82] hover:text-[#1D5FAF]">
        <ArrowLeft className="w-4 h-4" /> Back to my rentals
      </Link>

      {/* Header */}
      <div className={`${card} flex flex-col sm:flex-row sm:items-center gap-4`}>
        <div className="w-20 h-20 rounded-xl bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
          {r.product.image ? <Image src={r.product.image} alt={r.product.name} fill className="object-contain p-2" sizes="80px" referrerPolicy="no-referrer" /> : <Bed className="w-8 h-8 m-auto mt-6 text-[#C5CFDC]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-[#12263F]">{r.product.name}</h1>
            <StatusPill r={r} />
          </div>
          <p className="mt-1 text-[13px] text-[#5B6B82]">
            Rental <span className="font-mono font-semibold text-[#12263F]">{r.rentalNumber}</span> · booked {day(r.createdAt)} · {r.plan.durationLabel} at {inr(r.plan.rate)}/{r.plan.unit}
          </p>
          {r.product.slug && (
            <Link href={`/rent/${r.product.slug}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D5FAF] hover:underline">
              View equipment <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* What now */}
      {msg.text && <p className={`rounded-xl border px-4 py-3 text-[14px] leading-relaxed ${TONE[msg.tone]}`}>{msg.text}</p>}

      {(r.actions.payAdvance || r.actions.payBalance) && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className={h2}>{r.actions.payAdvance ? 'Complete your booking payment' : 'Pay the balance'}</p>
            <p className="text-[13px] text-[#5B6B82]">
              {r.actions.payAdvance
                ? `${r.amounts.advancePercent < 100 ? `${r.amounts.advancePercent}% advance` : 'Full amount'} of ${inr(r.amounts.advanceDue)}`
                : `${inr(r.amounts.balanceDue)} ${r.balanceDuePolicy === 'on_delivery' && ['dispatched', 'approved'].includes(r.status) ? '(you can also pay the delivery team)' : 'remaining'}`}
            </p>
          </div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act('pay', () => payRental(r, r.actions.payAdvance ? 'advance' : 'balance', store.brandName, user), 'Payment received — thank you!')}
            className={`${btn} bg-[#1D5FAF] hover:bg-[#174E90] text-white`}
          >
            {busy === 'pay' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Pay {inr(r.actions.payAdvance ? r.amounts.advanceDue : r.amounts.balanceDue)}
          </button>
        </div>
      )}

      {r.status !== 'pending_payment' && (
        <div className={card}>
          <Steps r={r} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          {/* Documents */}
          {r.kyc.required && (
            <section className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className={h2}>Documents</h2>
                {r.kyc.statusLabel && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${r.kyc.status === 'approved' ? TONE.ok : r.kyc.status === 'rejected' ? TONE.bad : TONE.info}`}>{r.kyc.statusLabel}</span>
                )}
              </div>
              <ul className="mt-3 space-y-2.5">
                {r.kyc.requirements.map((q) => {
                  const d = q.document;
                  const needsUpload = r.actions.uploadKyc && (!d || d.status === 'rejected');
                  return (
                    <li key={q.key} className={`rounded-xl border p-3.5 ${d?.status === 'rejected' ? 'border-red-200 bg-red-50/50' : 'border-[#E8EEF5]'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d?.status === 'approved' ? 'bg-[#16A34A] text-white' : 'bg-[#EAF2FC] text-[#1D5FAF]'}`}>
                            {d?.status === 'approved' ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0 text-[13px]">
                            <p className="font-semibold text-[#12263F]">{q.label}</p>
                            {d ? (
                              <button type="button" onClick={() => viewDoc(d)} className="inline-flex items-center gap-1 text-[#1D5FAF] hover:underline cursor-pointer">
                                <Eye className="w-3.5 h-3.5" /> {d.fileName}
                              </button>
                            ) : (
                              <p className="text-[#8A97A8]">{q.hint}</p>
                            )}
                            {d?.status === 'rejected' && d.rejectReason && <p className="text-red-700">Not accepted: {d.rejectReason}</p>}
                            {d?.status === 'approved' && <p className="text-[#16A34A]">Verified</p>}
                          </div>
                        </div>
                        {needsUpload && (
                          <>
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => fileInputs.current[q.key]?.click()}
                              className={`${btn} !py-2 border border-[#D5DEEA] bg-white text-[#12263F] hover:border-[#1D5FAF]`}
                            >
                              {busy === `kyc-${q.key}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {d ? 'Upload again' : 'Upload'}
                            </button>
                            <input
                              ref={(el) => {
                                fileInputs.current[q.key] = el;
                              }}
                              type="file"
                              accept="application/pdf,image/jpeg,image/png,image/webp"
                              hidden
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                if (!f) return;
                                if (f.size > 8 * 1024 * 1024) return addToast({ type: 'error', title: 'File too large', message: 'Upload a file under 8 MB.' });
                                act(`kyc-${q.key}`, () => uploadRentalKycDocument(r.id, q.key, f), 'Document uploaded');
                              }}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 flex items-center gap-1 text-[12px] text-[#8A97A8]">
                <Lock className="w-3.5 h-3.5" /> Only our verification team can see these files.
              </p>
            </section>
          )}

          {/* Extend */}
          {r.actions.extend && (
            <section className={card}>
              <h2 className={`${h2} flex items-center gap-2`}>
                <CalendarPlus className="w-4 h-4 text-[#1D5FAF]" /> Extend this rental
              </h2>
              <p className="mt-1 text-[13px] text-[#5B6B82]">Currently till {day(r.endDate)}. Pay online and the new end date applies immediately.</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="ext" className="block text-[13px] font-semibold text-[#12263F] mb-1">
                    Extend by
                  </label>
                  <div className="flex items-center rounded-xl border border-[#D5DEEA] bg-white">
                    <button type="button" onClick={() => setExtendBy((n) => Math.max(1, n - 1))} className="px-3.5 py-2 text-[#5B6B82] hover:text-[#1D5FAF] cursor-pointer" aria-label="Fewer">−</button>
                    <span id="ext" className="w-24 text-center text-[14px] font-semibold tabular-nums">
                      {extendBy} {extendBy === 1 ? r.plan.unit : `${r.plan.unit}s`}
                    </span>
                    <button type="button" onClick={() => setExtendBy((n) => Math.min(r.plan.maxPeriods, n + 1))} className="px-3.5 py-2 text-[#5B6B82] hover:text-[#1D5FAF] cursor-pointer" aria-label="More">+</button>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => act('extend', () => payExtension(r, extendBy, store.brandName, user), 'Rental extended')}
                  className={`${btn} bg-[#1D5FAF] hover:bg-[#174E90] text-white`}
                >
                  {busy === 'extend' && <Loader2 className="w-4 h-4 animate-spin" />} Pay {inr(extendCost)} + GST
                </button>
              </div>
            </section>
          )}

          {/* Pickup */}
          {r.actions.requestReturn && (
            <section className={card}>
              <h2 className={`${h2} flex items-center gap-2`}>
                <Truck className="w-4 h-4 text-[#1D5FAF]" /> Request a pickup
              </h2>
              <p className="mt-1 text-[13px] text-[#5B6B82]">Done with the equipment? Choose a day and our team will collect it. Rent is charged till the end date you booked.</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="pickup" className="block text-[13px] font-semibold text-[#12263F] mb-1">
                    Pickup date
                  </label>
                  <input
                    id="pickup"
                    type="date"
                    min={minPickup}
                    max={maxPickup}
                    value={chosenPickup}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="rounded-xl border border-[#D5DEEA] px-3.5 py-2.5 text-[14px] text-[#12263F] focus:outline-none focus:border-[#1D5FAF]"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => act('pickup', () => requestRentalPickup(r.id, chosenPickup), 'Pickup requested — we will confirm the slot')}
                  className={`${btn} border border-[#1D5FAF] text-[#1D5FAF] hover:bg-[#EAF2FC]`}
                >
                  {busy === 'pickup' && <Loader2 className="w-4 h-4 animate-spin" />} Request pickup
                </button>
              </div>
            </section>
          )}

          {/* Return / deposit */}
          {(r.returnCondition || r.deductions.length > 0) && (
            <section className={card}>
              <h2 className={h2}>Return &amp; deposit</h2>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
                <dt className="text-[#8A97A8]">Deposit</dt>
                <dd className="text-[#12263F]">{inr(r.amounts.deposit)}</dd>
                {r.deductions.map((d) => (
                  <React.Fragment key={d.id}>
                    <dt className="text-[#8A97A8]">{d.type === 'late_fee' ? 'Late fee' : d.type === 'damage' ? 'Damage' : 'Missing accessory'}</dt>
                    <dd className="text-red-700">
                      − {inr(d.amount)}
                      {d.description && <span className="text-[#8A97A8]"> · {d.description}</span>}
                    </dd>
                  </React.Fragment>
                ))}
                <dt className="font-semibold text-[#12263F]">Refund</dt>
                <dd className="font-semibold text-[#16A34A]">{inr(r.amounts.depositRefund ?? 0)}</dd>
              </dl>
              {r.returnNotes && <p className="mt-2 text-[13px] text-[#5B6B82]">Inspection: {r.returnNotes}</p>}
            </section>
          )}

          {/* Timeline */}
          <section className={card}>
            <h2 className={h2}>Activity</h2>
            <ol className="mt-3 border-l-2 border-[#E2E8F0] pl-4 space-y-3">
              {[...r.timeline].reverse().map((t, i) => (
                <li key={i} className="relative text-[13px]">
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1D5FAF] border-2 border-white" />
                  <p className="font-semibold text-[#12263F]">
                    {t.label} <span className="font-normal text-[#8A97A8]">· {new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                  </p>
                  {t.note && <p className="text-[#5B6B82]">{t.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Side */}
        <aside className="space-y-5">
          <section className={card}>
            <h2 className={h2}>Payment</h2>
            <div className="mt-3 space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-[#5B6B82]">Rent</span><span>{inr(r.amounts.rent)}</span></div>
              {r.amounts.delivery > 0 && <div className="flex justify-between"><span className="text-[#5B6B82]">Delivery &amp; pickup</span><span>{inr(r.amounts.delivery)}</span></div>}
              {r.amounts.gst > 0 && <div className="flex justify-between"><span className="text-[#5B6B82]">GST</span><span>{inr(r.amounts.gst)}</span></div>}
              {r.amounts.deposit > 0 && <div className="flex justify-between text-[#16A34A]"><span>Refundable deposit</span><span>{inr(r.amounts.deposit)}</span></div>}
              <div className="flex justify-between font-semibold border-t border-[#E8EEF5] pt-2"><span>Total</span><span>{inr(r.amounts.total)}</span></div>
              <div className="flex justify-between"><span className="text-[#5B6B82]">Paid</span><span className="text-[#16A34A] font-semibold">{inr(r.amounts.paid)}</span></div>
              {r.amounts.balanceDue > 0 && r.status !== 'cancelled' && (
                <div className="flex justify-between"><span className="text-[#5B6B82]">Balance due</span><span className="text-[#B45309] font-semibold">{inr(r.amounts.balanceDue)}</span></div>
              )}
              {r.amounts.refunded > 0 && <div className="flex justify-between"><span className="text-[#5B6B82]">Refunded</span><span>{inr(r.amounts.refunded)}</span></div>}
            </div>
            {r.payments.length > 0 && (
              <ul className="mt-3 border-t border-[#E8EEF5] pt-3 space-y-1.5 text-[12px] text-[#5B6B82]">
                {r.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span>
                      {day(p.paidAt)} · {p.purpose} · {p.method}
                    </span>
                    <span className="text-[#12263F] font-semibold">{inr(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            {r.refunds.filter((x) => x.status !== 'failed').length > 0 && (
              <ul className="mt-3 border-t border-[#E8EEF5] pt-3 space-y-1.5 text-[12px] text-[#5B6B82]">
                {r.refunds
                  .filter((x) => x.status !== 'failed')
                  .map((x) => (
                    <li key={x.id} className="flex justify-between gap-2">
                      <span>
                        Refund · {x.method === 'gateway' ? 'original payment' : x.methodLabel} {x.status === 'processing' ? '(processing)' : ''}
                        {x.reference && <span className="block font-mono">{x.reference}</span>}
                      </span>
                      <span className="text-[#16A34A] font-semibold">{inr(x.amount)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className={`${card} space-y-3 text-[13px]`}>
            <h2 className={h2}>Delivery</h2>
            <p className="text-[#5B6B82]">
              {r.startDate && r.endDate ? (
                <>
                  Rental period <span className="font-semibold text-[#12263F]">{day(r.startDate)} → {day(r.endDate)}</span>
                </>
              ) : (
                <>Requested from {day(r.requestedStartDate)} · starts on delivery</>
              )}
            </p>
            {r.unit && <p className="text-[#5B6B82]">Unit serial <span className="font-mono text-[#12263F]">{r.unit.serialNumber}</span></p>}
            {r.deliveryAddress && (
              <p className="flex items-start gap-1.5 text-[#5B6B82]">
                <MapPin className="w-4 h-4 shrink-0 text-[#1D5FAF]" />
                <span>
                  {r.deliveryAddress.organisation && <>{r.deliveryAddress.organisation}, </>}
                  {r.deliveryAddress.name} · {r.deliveryAddress.phone}
                  <br />
                  {r.deliveryAddress.line1}
                  {r.deliveryAddress.line2 ? `, ${r.deliveryAddress.line2}` : ''}, {r.deliveryAddress.city} – {r.deliveryAddress.pincode}
                </span>
              </p>
            )}
            {[
              ['Delivery', r.delivery],
              ['Pickup', r.returnPickup],
            ].map(([t, s]) =>
              s && typeof s === 'object' ? (
                <div key={t as string} className="rounded-lg border border-[#E8EEF5] px-3 py-2">
                  <p className="font-semibold text-[#12263F]">
                    {t as string} · {s.courier}
                  </p>
                  <p className="text-[12px] text-[#5B6B82]">
                    {s.pickupDate && <>On {day(s.pickupDate)} · </>}
                    {s.awb ? `AWB ${s.awb}` : ''}
                    {s.deliveredAt ? ` · done ${day(s.deliveredAt)}` : ''}
                  </p>
                  {s.trackingUrl && (
                    <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D5FAF] hover:underline">
                      Track <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : null
            )}
          </section>

          {r.actions.cancel && (
            <section className={card}>
              {cancelOpen ? (
                <div className="space-y-3 text-[13px]">
                  <p className="font-semibold text-[#12263F]">Cancel this booking?</p>
                  {r.amounts.paid > 0 && <p className="text-[#5B6B82]">{inr(r.amounts.paid)} will be refunded to your original payment method.</p>}
                  <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full rounded-xl border border-[#D5DEEA] px-3 py-2.5 text-[14px]">
                    {CANCEL_REASONS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={async () => {
                        if (await act('cancel', () => cancelMyRental(r.id, cancelReason), 'Booking cancelled')) setCancelOpen(false);
                      }}
                      className={`${btn} !py-2 bg-red-600 hover:bg-red-700 text-white`}
                    >
                      {busy === 'cancel' && <Loader2 className="w-4 h-4 animate-spin" />} Cancel booking
                    </button>
                    <button type="button" onClick={() => setCancelOpen(false)} className={`${btn} !py-2 border border-[#D5DEEA] text-[#12263F]`}>
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setCancelOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-600 hover:underline cursor-pointer">
                  <XCircle className="w-4 h-4" /> Cancel this booking
                </button>
              )}
            </section>
          )}

          <p className="text-[12px] text-[#8A97A8] px-1">
            Need help? Call <a href={store.supportPhoneHref} className="font-semibold text-[#1D5FAF]">{store.supportPhone}</a>
          </p>
        </aside>
      </div>
    </div>
  );
}
