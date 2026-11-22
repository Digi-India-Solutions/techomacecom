import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  BellRing,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import type { AdminRental, OfflinePaymentMethod, RefundMode } from '@/types/admin';
import {
  addRentalNote,
  approveRental,
  assignRentalUnit,
  cancelRental,
  dispatchRental,
  extendRental,
  getRental,
  markRentalDelivered,
  openKycDocument,
  receiveRentalReturn,
  recordRentalPayment,
  refundRental,
  refundRentalDeposit,
  reviewKyc,
  scheduleRentalReturn,
  sendRentalReminder,
  syncRentalRefund,
} from '@/lib/api/admin/rentals';
import { AdminApiError, formatDateTime, formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

const card = 'rounded-xl border border-[#DCE6F2] bg-white p-5';
const h2 = 'text-base font-semibold text-[#12263F]';
const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:cursor-not-allowed disabled:opacity-50';
const btnSuccess =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50';

const METHODS: { value: OfflinePaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
];
const DEDUCTION_LABEL = { late_fee: 'Late fee', damage: 'Damage', missing_accessory: 'Missing accessory' } as const;
type DeductionType = keyof typeof DEDUCTION_LABEL;

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const plusDays = (n: number) => {
  const d = new Date(Date.now() + n * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const errText = (err: unknown) => (err instanceof Error ? err.message : 'Please try again');

export function RentalDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { can } = useAuth();
  const canEdit = can('rentals.edit');
  const { showToast } = useToast();

  const [rental, setRental] = useState<AdminRental | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState<Record<string, string>>({});

  // forms
  const [unitId, setUnitId] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [kycDecisions, setKycDecisions] = useState<Record<string, { status: 'approved' | 'rejected'; reason: string }>>({});
  const [dispatch, setDispatch] = useState({ courier: 'Buy Denmed delivery team', awb: '', trackingUrl: '' });
  const [deliveredOn, setDeliveredOn] = useState(todayLocal());
  const [payment, setPayment] = useState<{ amount: number; method: OfflinePaymentMethod; reference: string }>({ amount: 0, method: 'upi', reference: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [ext, setExt] = useState<{ periods: number; collected: boolean; method: OfflinePaymentMethod; reference: string }>({ periods: 1, collected: true, method: 'upi', reference: '' });
  const [pickup, setPickup] = useState({ pickupDate: plusDays(1), courier: 'Buy Denmed pickup team', awb: '' });
  const [inspect, setInspect] = useState<{ condition: 'good' | 'needs_service' | 'damaged'; notes: string; deductions: { type: DeductionType; amount: number; description: string }[] }>({
    condition: 'good',
    notes: '',
    deductions: [],
  });
  const [refund, setRefund] = useState<{ amount: number; mode: RefundMode; reference: string; note: string }>({ amount: 0, mode: 'gateway', reference: '', note: '' });
  const [noteInput, setNoteInput] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [preview, setPreview] = useState<{ url: string; label: string; isPdf: boolean } | null>(null);

  const hydrate = useCallback((r: AdminRental) => {
    setRental(r);
    setUnitId(r.unit?.id || r.availableUnits?.[0]?.id || '');
    setPayment((p) => ({ ...p, amount: r.status === 'pending_payment' ? r.amounts.advanceDue : r.amounts.balanceDue }));
    setRefund((f) => ({
      ...f,
      amount: r.status === 'returned' ? r.amounts.depositRefund ?? 0 : Math.max(0, r.amounts.paid - r.amounts.refunded),
      mode: r.payments.some((p) => p.method.startsWith('Online')) ? 'gateway' : 'bank_transfer',
    }));
    setKycDecisions({});
    if (r.returnRequestedOn) setPickup((p) => ({ ...p, pickupDate: r.returnRequestedOn! }));
    // Suggest deductions: late fee + anything still unpaid
    const suggested: { type: DeductionType; amount: number; description: string }[] = [];
    if (r.lateFeeAccrued > 0) suggested.push({ type: 'late_fee', amount: r.lateFeeAccrued, description: `${r.overdueDays} day(s) late` });
    setInspect((i) => ({ ...i, deductions: suggested }));
  }, []);

  const load = useCallback(() => {
    setLoadError('');
    getRental(id)
      .then(hydrate)
      .catch((err) => setLoadError(errText(err)));
  }, [id, hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (label: string, fn: () => Promise<AdminRental>, success: string) => {
    setBusy(true);
    setFe({});
    try {
      hydrate(await fn());
      showToast({ title: success, variant: 'success' });
      return true;
    } catch (err) {
      if (err instanceof AdminApiError && err.fields) setFe(err.fields);
      showToast({ title: `Could not ${label}`, description: errText(err), variant: 'error' });
      load();
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className={`${card} max-w-lg space-y-3`}>
        <h2 className={h2}>Could not load this rental</h2>
        <p className="text-sm text-[#5B6B82]">{loadError}</p>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={btnSecondary}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
          <Link to="/admin/rentals" className={btnSecondary}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to rentals
          </Link>
        </div>
      </div>
    );
  }
  if (!rental) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  const r = rental;
  const inUse = ['active', 'overdue', 'extension_requested'].includes(r.status);
  const kycPending = r.kyc.required && r.kyc.status !== 'approved';
  const balanceBlocksDispatch = r.balanceDuePolicy === 'before_dispatch' && r.amounts.balanceDue > 0;
  const reviewable = r.kyc.requirements.map((q) => q.document).filter((d): d is NonNullable<typeof d> => Boolean(d) && d!.status === 'uploaded');
  const deductionTotal = inspect.deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const refundMax = r.status === 'returned' ? r.amounts.depositRefund ?? 0 : Math.max(0, r.amounts.paid - r.amounts.refunded);
  const extensionCost = ext.periods * r.plan.rate;

  const paymentForm = (
    <div className="space-y-3 rounded-lg border border-[#DCE6F2] bg-white p-3.5">
      <p className="text-xs font-semibold text-[#12263F]">Record a payment collected offline</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Amount (₹)" required error={fe.amount}>
          <input type="number" min={1} step="0.01" value={payment.amount || ''} onChange={(e) => setPayment((p) => ({ ...p, amount: Number(e.target.value) }))} className={`${inputClass} tabular-nums`} />
        </FormField>
        <FormField label="Method" required>
          <select value={payment.method} onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value as OfflinePaymentMethod }))} className={selectClass}>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Reference / UTR">
          <input value={payment.reference} onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))} className={`${inputClass} font-mono`} />
        </FormField>
      </div>
      <button
        type="button"
        disabled={busy || !(payment.amount >= 1)}
        onClick={async () => {
          if (await run('record the payment', () => recordRentalPayment(r.id, { amount: payment.amount, method: payment.method, reference: payment.reference.trim() || undefined }), 'Payment recorded'))
            setShowPayment(false);
        }}
        className={btnSuccess}
      >
        <Banknote className="h-3.5 w-3.5" /> Record {formatINR(payment.amount || 0)}
      </button>
    </div>
  );

  // -------------------------------------------------------------------------
  // Next step (by status)
  // -------------------------------------------------------------------------
  let nextStep: React.ReactNode = null;
  if (canEdit) {
    if (r.status === 'pending_payment') {
      nextStep = (
        <>
          <p className="text-xs text-[#5B6B82]">
            The customer started the booking but has not paid the {r.amounts.advancePercent < 100 ? `${r.amounts.advancePercent}% advance` : 'booking amount'} of{' '}
            <strong className="text-[#12263F]">{formatINR(r.amounts.advanceDue)}</strong> yet. They can pay from My Rentals, or record a payment taken offline.
          </p>
          {paymentForm}
        </>
      );
    } else if (r.status === 'pending_approval') {
      nextStep = kycPending ? (
        <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-3 text-xs text-[#B85A0E]">
          {r.kyc.status === 'rejected'
            ? 'Waiting for the customer to re-upload the rejected documents.'
            : r.kyc.status === 'pending'
              ? 'Waiting for the customer to upload KYC documents.'
              : 'Review the KYC documents below — the booking can be approved once they are verified.'}
        </p>
      ) : (
        <>
          <p className="text-xs text-[#5B6B82]">{r.kyc.required ? 'KYC verified. ' : ''}Confirm the booking and reserve a unit for it.</p>
          <UnitPicker r={r} unitId={unitId} setUnitId={setUnitId} />
          <FormField label="Message to the customer (optional)">
            <input value={approveNote} onChange={(e) => setApproveNote(e.target.value)} className={inputClass} placeholder="e.g. Our technician will call before delivery." />
          </FormField>
          <button type="button" disabled={busy} onClick={() => run('approve', () => approveRental(r.id, { unitId: unitId || undefined, note: approveNote.trim() || undefined }), 'Booking confirmed — customer notified')} className={btnPrimary}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve booking
          </button>
        </>
      );
    } else if (r.status === 'approved') {
      nextStep = (
        <>
          {!r.unit ? (
            <>
              <p className="text-xs text-[#5B6B82]">Assign a serial-numbered unit before dispatch.</p>
              <UnitPicker r={r} unitId={unitId} setUnitId={setUnitId} />
              <button type="button" disabled={busy || !unitId} onClick={() => run('assign the unit', () => assignRentalUnit(r.id, unitId), 'Unit assigned')} className={btnPrimary}>
                <PackageCheck className="h-3.5 w-3.5" /> Assign unit
              </button>
            </>
          ) : balanceBlocksDispatch ? (
            <>
              <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-3 text-xs text-[#B85A0E]">
                Balance of <strong>{formatINR(r.amounts.balanceDue)}</strong> must be paid before dispatch. The customer can pay it online from My Rentals, or record it here.
              </p>
              {paymentForm}
            </>
          ) : (
            <>
              <p className="text-xs text-[#5B6B82]">
                Unit <strong className="text-[#12263F]">{r.unit.unitCode}</strong> (S/N {r.unit.serialNumber}) is reserved. Hand it to the courier and record the dispatch.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label="Courier / team" required error={fe.courier}>
                  <input value={dispatch.courier} onChange={(e) => setDispatch((d) => ({ ...d, courier: e.target.value }))} className={inputClass} />
                </FormField>
                <FormField label="AWB" error={fe.awb}>
                  <input value={dispatch.awb} onChange={(e) => setDispatch((d) => ({ ...d, awb: e.target.value }))} className={`${inputClass} font-mono`} />
                </FormField>
                <FormField label="Tracking link" error={fe.trackingUrl}>
                  <input value={dispatch.trackingUrl} onChange={(e) => setDispatch((d) => ({ ...d, trackingUrl: e.target.value }))} placeholder="https://…" className={inputClass} />
                </FormField>
              </div>
              <button
                type="button"
                disabled={busy || dispatch.courier.trim().length < 2}
                onClick={() =>
                  run('dispatch', () => dispatchRental(r.id, { courier: dispatch.courier.trim(), awb: dispatch.awb.trim() || undefined, trackingUrl: dispatch.trackingUrl.trim() || undefined }), 'Dispatched — customer notified')
                }
                className={btnPrimary}
              >
                <Truck className="h-3.5 w-3.5" /> Dispatch
              </button>
            </>
          )}
        </>
      );
    } else if (r.status === 'dispatched') {
      nextStep =
        r.amounts.balanceDue > 0 ? (
          <>
            <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-3 text-xs text-[#B85A0E]">
              Collect the balance of <strong>{formatINR(r.amounts.balanceDue)}</strong> on delivery and record it before marking delivered.
            </p>
            {paymentForm}
          </>
        ) : (
          <>
            <p className="text-xs text-[#5B6B82]">
              The rental period ({r.plan.durationLabel}) starts on the delivery date.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <FormField label="Delivered on">
                <input type="date" max={todayLocal()} value={deliveredOn} onChange={(e) => setDeliveredOn(e.target.value)} className={inputClass} />
              </FormField>
              <button type="button" disabled={busy} onClick={() => run('mark delivered', () => markRentalDelivered(r.id, deliveredOn), 'Delivered — rental is active')} className={btnSuccess}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark delivered &amp; installed
              </button>
            </div>
          </>
        );
    } else if (inUse) {
      nextStep = (
        <div className="space-y-4">
          {r.returnRequestedOn && (
            <p className="rounded-lg border border-[#1D5FAF]/25 bg-[#EAF2FC] p-3 text-xs text-[#12263F]">
              The customer asked for a pickup on <strong>{formatShortDate(r.returnRequestedOn)}</strong>.
            </p>
          )}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#12263F]">Schedule pickup</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Pickup date" required error={fe.pickupDate}>
                <input type="date" min={todayLocal()} value={pickup.pickupDate} onChange={(e) => setPickup((p) => ({ ...p, pickupDate: e.target.value }))} className={inputClass} />
              </FormField>
              <FormField label="Courier / team">
                <input value={pickup.courier} onChange={(e) => setPickup((p) => ({ ...p, courier: e.target.value }))} className={inputClass} />
              </FormField>
              <FormField label="AWB" error={fe.awb}>
                <input value={pickup.awb} onChange={(e) => setPickup((p) => ({ ...p, awb: e.target.value }))} className={`${inputClass} font-mono`} />
              </FormField>
            </div>
            <button
              type="button"
              disabled={busy || !pickup.pickupDate}
              onClick={() => run('schedule the pickup', () => scheduleRentalReturn(r.id, { pickupDate: pickup.pickupDate, courier: pickup.courier.trim() || undefined, awb: pickup.awb.trim() || undefined }), 'Pickup scheduled — customer notified')}
              className={btnPrimary}
            >
              <Truck className="h-3.5 w-3.5" /> Schedule pickup
            </button>
          </div>
          <details className="rounded-lg border border-[#DCE6F2] bg-white p-3.5">
            <summary className="cursor-pointer text-xs font-semibold text-[#12263F]">Extend the rental</summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label={`Extra ${r.plan.unit}s`} required hint={`${formatINR(extensionCost)} + GST`}>
                  <input type="number" min={1} max={r.plan.maxPeriods} value={ext.periods} onChange={(e) => setExt((x) => ({ ...x, periods: Math.max(1, Number(e.target.value)) }))} className={inputClass} />
                </FormField>
                <FormField label="Payment">
                  <select value={ext.collected ? ext.method : 'later'} onChange={(e) => setExt((x) => (e.target.value === 'later' ? { ...x, collected: false } : { ...x, collected: true, method: e.target.value as OfflinePaymentMethod }))} className={selectClass}>
                    {METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        Collected by {m.label}
                      </option>
                    ))}
                    <option value="later">Add to the balance due</option>
                  </select>
                </FormField>
                {ext.collected && (
                  <FormField label="Reference">
                    <input value={ext.reference} onChange={(e) => setExt((x) => ({ ...x, reference: e.target.value }))} className={`${inputClass} font-mono`} />
                  </FormField>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => run('extend', () => extendRental(r.id, { extraPeriods: ext.periods, collected: ext.collected, method: ext.collected ? ext.method : undefined, reference: ext.reference.trim() || undefined }), 'Rental extended — customer notified')}
                className={btnSecondary}
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Extend by {ext.periods} {r.plan.unit}(s)
              </button>
            </div>
          </details>
          {r.amounts.balanceDue > 0 && paymentForm}
        </div>
      );
    } else if (r.status === 'return_scheduled') {
      nextStep = (
        <div className="space-y-3">
          <p className="text-xs text-[#5B6B82]">When the equipment is back, record its condition and any deductions from the {formatINR(r.amounts.deposit)} deposit.</p>
          <div className="flex flex-wrap gap-1.5">
            {(['good', 'needs_service', 'damaged'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setInspect((i) => ({ ...i, condition: c }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  inspect.condition === c ? (c === 'good' ? 'bg-emerald-600 text-white' : c === 'damaged' ? 'bg-red-600 text-white' : 'bg-[#F28C38] text-white') : 'border border-[#DCE6F2] bg-white text-[#5B6B82]'
                }`}
              >
                {c === 'good' ? 'Good — ready to rent' : c === 'needs_service' ? 'Needs service' : 'Damaged'}
              </button>
            ))}
          </div>
          <FormField label="Inspection notes (shown to the customer)">
            <textarea value={inspect.notes} onChange={(e) => setInspect((i) => ({ ...i, notes: e.target.value }))} className={textareaClass} placeholder="e.g. All accessories returned; cuff slightly worn." />
          </FormField>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#12263F]">Deductions from deposit</p>
            {inspect.deductions.map((d, i) => (
              <div key={i} className="grid grid-cols-[140px_110px_1fr_auto] items-center gap-2">
                <select value={d.type} onChange={(e) => setInspect((s) => ({ ...s, deductions: s.deductions.map((x, j) => (j === i ? { ...x, type: e.target.value as DeductionType } : x)) }))} className={selectClass}>
                  {Object.entries(DEDUCTION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input type="number" min={1} value={d.amount || ''} placeholder="₹" onChange={(e) => setInspect((s) => ({ ...s, deductions: s.deductions.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)) }))} className={`${inputClass} tabular-nums`} />
                <input value={d.description} placeholder="Details" onChange={(e) => setInspect((s) => ({ ...s, deductions: s.deductions.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) }))} className={inputClass} />
                <button type="button" onClick={() => setInspect((s) => ({ ...s, deductions: s.deductions.filter((_, j) => j !== i) }))} className="rounded p-1.5 text-[#5B6B82] hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setInspect((s) => ({ ...s, deductions: [...s.deductions, { type: 'damage', amount: 0, description: '' }] }))} className={btnSecondary}>
              <Plus className="h-3.5 w-3.5" /> Add deduction
            </button>
            {r.amounts.balanceDue > 0 && (
              <p className="text-[11px] text-[#B85A0E]">The customer still owes {formatINR(r.amounts.balanceDue)} — you can deduct it from the deposit.</p>
            )}
          </div>
          <p className="text-xs text-[#12263F]">
            Deposit {formatINR(r.amounts.deposit)} − deductions {formatINR(deductionTotal)} ={' '}
            <strong>{formatINR(Math.max(0, r.amounts.deposit - deductionTotal))} to refund</strong>
          </p>
          <button
            type="button"
            disabled={busy || inspect.deductions.some((d) => !(d.amount >= 1))}
            onClick={() =>
              run(
                'record the return',
                () => receiveRentalReturn(r.id, { condition: inspect.condition, notes: inspect.notes.trim() || undefined, deductions: inspect.deductions.map((d) => ({ type: d.type, amount: d.amount, description: d.description.trim() || undefined })) }),
                'Return recorded'
              )
            }
            className={btnPrimary}
          >
            <ClipboardCheck className="h-3.5 w-3.5" /> Equipment received &amp; inspected
          </button>
        </div>
      );
    } else if (r.status === 'returned') {
      nextStep = (
        <div className="space-y-3">
          <p className="text-xs text-[#5B6B82]">
            Refund the deposit after deductions: <strong className="text-[#12263F]">{formatINR(refundMax)}</strong>.
          </p>
          <RefundFields r={r} refund={refund} setRefund={setRefund} max={refundMax} fe={fe} allowZero />
          <button type="button" disabled={busy || refund.amount > refundMax || (refund.amount > 0 && refund.mode !== 'gateway' && !refund.reference.trim())} onClick={() => setConfirmRefund(true)} className={btnSuccess}>
            <Banknote className="h-3.5 w-3.5" /> {refund.amount > 0 ? `Refund ${formatINR(refund.amount)}` : 'Close without refund'}
          </button>
        </div>
      );
    } else if (r.status === 'cancelled' && r.amounts.paid - r.amounts.refunded > 0) {
      nextStep = (
        <div className="space-y-3">
          <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-3 text-xs text-[#B85A0E]">
            This booking is cancelled but {formatINR(r.amounts.paid - r.amounts.refunded)} has not been refunded yet.
          </p>
          <RefundFields r={r} refund={refund} setRefund={setRefund} max={refundMax} fe={fe} />
          <button type="button" disabled={busy || !(refund.amount >= 1) || (refund.mode !== 'gateway' && !refund.reference.trim())} onClick={() => setConfirmRefund(true)} className={btnSuccess}>
            <Banknote className="h-3.5 w-3.5" /> Refund {formatINR(refund.amount || 0)}
          </button>
        </div>
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/admin/rentals" className="rounded-lg border border-[#DCE6F2] bg-white p-2 text-[#12263F] hover:bg-[#EAF2FC]" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-[#12263F] sm:text-2xl">{r.rentalNumber}</h1>
              <StatusBadge status={r.status} label={r.statusLabel} />
              {r.kyc.required && <StatusBadge status={r.kyc.status === 'approved' ? 'approved' : r.kyc.status === 'rejected' ? 'rejected' : 'pending'} label={`KYC: ${r.kyc.statusLabel}`} />}
            </div>
            <p className="mt-0.5 text-xs text-[#5B6B82]">
              Booked {formatDateTime(r.createdAt)} · {r.product.name} · {r.plan.durationLabel}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {inUse && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await sendRentalReminder(r.id);
                    hydrate(res.rental);
                    showToast({ title: res.sent.length ? `Reminder sent by ${res.sent.join(', ')}` : 'No channel is set up to send the reminder', variant: res.sent.length ? 'success' : 'warning' });
                  } catch (err) {
                    showToast({ title: 'Could not send the reminder', description: errText(err), variant: 'error' });
                  } finally {
                    setBusy(false);
                  }
                }}
                className={btnSecondary}
              >
                <BellRing className="h-3.5 w-3.5" /> {r.status === 'overdue' ? 'Send overdue reminder' : 'Send due-date reminder'}
              </button>
            )}
            {['pending_payment', 'pending_approval', 'approved'].includes(r.status) && (
              <button type="button" onClick={() => setCancelOpen(true)} className={btnDanger}>
                <XCircle className="h-3.5 w-3.5" /> Cancel booking
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className={`${card} !py-4`}>
        <ol className="flex items-start">
          {r.steps.map((s, i) => (
            <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
              {i < r.steps.length - 1 && <span aria-hidden className={`absolute left-1/2 top-3 h-0.5 w-full ${r.steps[i + 1].done ? 'bg-emerald-500' : 'bg-[#DCE6F2]'}`} />}
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                  s.key === 'cancelled' ? 'bg-red-500 text-white' : s.done ? 'bg-emerald-500 text-white' : 'border-2 border-[#DCE6F2] bg-white'
                } ${s.current ? 'ring-4 ring-emerald-500/15' : ''}`}
              >
                {s.done && (s.key === 'cancelled' ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />)}
              </span>
              <span className={`mt-1.5 text-[11px] ${s.done ? 'font-semibold text-[#12263F]' : 'text-[#5B6B82]'}`}>{s.label}</span>
              {s.at && <span className="text-[10px] text-[#5B6B82]">{formatShortDate(s.at)}</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {nextStep && (
            <section className="space-y-3 rounded-xl border-2 border-[#1D5FAF]/20 bg-[#F6F9FD] p-5">
              <h2 className={`${h2} flex items-center gap-2`}>
                <ShieldCheck className="h-4 w-4 text-[#1D5FAF]" /> Next step
              </h2>
              {nextStep}
            </section>
          )}

          {r.status === 'overdue' && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <strong>{r.overdueDays} day(s) overdue</strong> (due {r.endDate && formatShortDate(r.endDate)}). Late fee so far: {formatINR(r.lateFeeAccrued)} — deducted from the deposit at return.
            </p>
          )}

          {/* KYC */}
          {r.kyc.required && (
            <section className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className={h2}>KYC documents</h2>
                {r.kyc.statusLabel && <StatusBadge status={r.kyc.status === 'approved' ? 'approved' : r.kyc.status === 'rejected' ? 'rejected' : 'pending'} label={r.kyc.statusLabel} />}
              </div>
              {r.kyc.note && r.kyc.status === 'rejected' && <p className="mt-2 text-xs text-red-700">Asked to re-upload: {r.kyc.note}</p>}
              <ul className="mt-3 divide-y divide-[#DCE6F2] rounded-lg border border-[#DCE6F2]">
                {r.kyc.requirements.map((q) => {
                  const d = q.document;
                  const decision = d ? kycDecisions[d.id] : undefined;
                  return (
                    <li key={q.key} className="space-y-2 px-3.5 py-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {d ? (
                            <KycThumb rentalId={r.id} doc={d} onOpen={setPreview} />
                          ) : (
                            <span className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-[#DCE6F2] text-[#5B6B82]">
                              <FileText className="h-5 w-5" />
                            </span>
                          )}
                          <div>
                            <p className="font-semibold text-[#12263F]">{q.label}</p>
                            {d ? (
                              <p className="text-[11px] text-[#5B6B82]">
                                {Math.ceil(d.size / 1024)} KB · uploaded {formatDateTime(d.uploadedAt)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-[#5B6B82]">Not uploaded yet</p>
                            )}
                          </div>
                        </div>
                        {d && <StatusBadge status={d.status === 'uploaded' ? 'pending' : d.status} label={d.status === 'uploaded' ? 'To review' : d.status === 'approved' ? 'Verified' : 'Rejected'} />}
                      </div>
                      {d?.status === 'rejected' && d.rejectReason && <p className="text-[11px] text-red-700">Reason: {d.rejectReason}</p>}
                      {canEdit && d?.status === 'uploaded' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setKycDecisions((s) => ({ ...s, [d.id]: { status: 'approved', reason: '' } }))}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${decision?.status === 'approved' ? 'bg-emerald-600 text-white' : 'border border-[#DCE6F2] text-[#5B6B82]'}`}
                          >
                            Verified
                          </button>
                          <button
                            type="button"
                            onClick={() => setKycDecisions((s) => ({ ...s, [d.id]: { status: 'rejected', reason: s[d.id]?.reason || '' } }))}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${decision?.status === 'rejected' ? 'bg-red-600 text-white' : 'border border-[#DCE6F2] text-[#5B6B82]'}`}
                          >
                            Reject
                          </button>
                          {decision?.status === 'rejected' && (
                            <input
                              value={decision.reason}
                              onChange={(e) => setKycDecisions((s) => ({ ...s, [d.id]: { status: 'rejected', reason: e.target.value } }))}
                              placeholder="Reason shown to the customer, e.g. photo is blurry"
                              className={`${inputClass} !py-1 text-xs sm:max-w-xs`}
                            />
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {canEdit && reviewable.length > 0 && (
                <button
                  type="button"
                  disabled={busy || reviewable.some((d) => !kycDecisions[d.id] || (kycDecisions[d.id].status === 'rejected' && kycDecisions[d.id].reason.trim().length < 3))}
                  onClick={() =>
                    run(
                      'save the KYC review',
                      () => reviewKyc(r.id, reviewable.map((d) => ({ docId: d.id, status: kycDecisions[d.id].status, reason: kycDecisions[d.id].reason.trim() || null }))),
                      reviewable.every((d) => kycDecisions[d.id]?.status === 'approved') ? 'KYC verified' : 'Customer asked to re-upload'
                    )
                  }
                  className={`${btnPrimary} mt-3`}
                >
                  Save review
                </button>
              )}
            </section>
          )}

          {/* Money */}
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={h2}>Payments</h2>
              {canEdit && r.amounts.balanceDue > 0 && !['cancelled', 'deposit_refunded'].includes(r.status) && !nextStep && (
                <button type="button" onClick={() => setShowPayment((v) => !v)} className={btnSecondary}>
                  <Banknote className="h-3.5 w-3.5" /> Record payment
                </button>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-4">
              {[
                ['Rent', r.amounts.rent],
                ['Delivery & pickup', r.amounts.delivery],
                ['GST', r.amounts.gst],
                ['Deposit (refundable)', r.amounts.deposit],
                ['Total', r.amounts.total],
                [`Advance (${r.amounts.advancePercent}%)`, r.amounts.advance],
                ['Paid', r.amounts.paid],
                ['Balance due', r.amounts.balanceDue],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-[#5B6B82]">{k}</dt>
                  <dd className={`font-semibold tabular-nums ${k === 'Balance due' && (v as number) > 0 ? 'text-[#B85A0E]' : 'text-[#12263F]'}`}>{formatINR(v as number)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] text-[#5B6B82]">Balance due {r.balanceDuePolicy === 'on_delivery' ? 'on delivery' : 'before dispatch'}.</p>
            {showPayment && <div className="mt-3">{paymentForm}</div>}
            {r.payments.length > 0 && (
              <ul className="mt-3 divide-y divide-[#DCE6F2] rounded-lg border border-[#DCE6F2] text-xs">
                {r.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span>
                      <span className="font-semibold tabular-nums text-[#12263F]">{formatINR(p.amount)}</span> · {p.purpose} · {p.method}
                      {p.reference && <span className="ml-1 font-mono text-[#5B6B82]">{p.reference}</span>}
                    </span>
                    <span className="tabular-nums text-[#5B6B82]">{formatDateTime(p.paidAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            {r.refunds.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B6B82]">Refunds</p>
                {r.refunds.map((x) => (
                  <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#DCE6F2] px-3 py-2 text-xs">
                    <span>
                      <span className="font-semibold tabular-nums">{formatINR(x.amount)}</span> · {x.reason === 'deposit_refund' ? 'Deposit' : x.reason === 'cancel' ? 'Cancellation' : 'Other'} · {x.methodLabel}
                      <span className="ml-1 font-mono text-[#5B6B82]">{x.reference || x.gatewayRefundId || ''}</span>
                      {x.failureReason && <span className="block text-[11px] text-red-700">{x.failureReason}</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <StatusBadge status={x.status} />
                      {canEdit && x.status === 'processing' && x.method === 'gateway' && (
                        <button type="button" onClick={() => run('refresh the refund', () => syncRentalRefund(r.id, x.id), 'Refund status refreshed')} className="rounded p-1 text-[#5B6B82] hover:bg-[#EAF2FC]" title="Check with Razorpay">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {(r.deductions.length > 0 || r.returnCondition) && (
              <div className="mt-3 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-3 text-xs">
                <p className="font-semibold text-[#12263F]">
                  Returned in {r.returnCondition?.replace('_', ' ')} condition{r.amounts.depositRefund != null ? ` · deposit refund ${formatINR(r.amounts.depositRefund)}` : ''}
                </p>
                {r.returnNotes && <p className="text-[#5B6B82]">{r.returnNotes}</p>}
                {r.deductions.map((d) => (
                  <p key={d.id} className="text-[#5B6B82]">
                    − {formatINR(d.amount)} {DEDUCTION_LABEL[d.type]}
                    {d.description ? ` (${d.description})` : ''}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section className={card}>
            <h2 className={h2}>History</h2>
            <ol className="mt-3 space-y-0 border-l-2 border-[#DCE6F2] pl-4">
              {(r.history || []).map((h) => (
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

        {/* Right column */}
        <div className="space-y-5">
          <section className={`${card} space-y-2 text-xs`}>
            <div className="flex items-center justify-between">
              <h2 className={h2}>Customer</h2>
              <Link to={`/admin/customers/${r.customer.id}`} className="font-semibold text-[#1D5FAF] hover:underline">
                Profile
              </Link>
            </div>
            <p className="text-sm font-semibold text-[#12263F]">{r.customer.name}</p>
            {r.customer.phone && <p className="tabular-nums">{r.customer.phone}</p>}
            {r.customer.email && <p className="text-[#5B6B82]">{r.customer.email}</p>}
            {r.deliveryAddress && (
              <div className="border-t border-[#DCE6F2] pt-2">
                <p className="text-[10px] font-semibold uppercase text-[#5B6B82]">Delivery address</p>
                <p className="text-[#12263F]">
                  {r.deliveryAddress.organisation && <>{r.deliveryAddress.organisation}, </>}
                  {r.deliveryAddress.name} · {r.deliveryAddress.phone}
                  <br />
                  {[r.deliveryAddress.line1, r.deliveryAddress.line2, r.deliveryAddress.landmark].filter(Boolean).join(', ')}
                  <br />
                  {r.deliveryAddress.city}, {r.deliveryAddress.state} – {r.deliveryAddress.pincode}
                </p>
              </div>
            )}
          </section>

          <section className={`${card} space-y-2 text-xs`}>
            <h2 className={h2}>Equipment</h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2]">
                <SafeImage src={r.product.image} alt={r.product.name} />
              </div>
              <div>
                <p className="font-semibold text-[#12263F]">{r.product.name}</p>
                <p className="text-[#5B6B82]">
                  {r.plan.periodLabel} · {formatINR(r.plan.rate)}/{r.plan.unit} · {r.plan.durationLabel}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-1 border-t border-[#DCE6F2] pt-2">
              <dt className="text-[#5B6B82]">Requested start</dt>
              <dd className="tabular-nums">{r.requestedStartDate ? formatShortDate(r.requestedStartDate) : '—'}</dd>
              <dt className="text-[#5B6B82]">Rental period</dt>
              <dd className="tabular-nums">{r.startDate && r.endDate ? `${formatShortDate(r.startDate)} → ${formatShortDate(r.endDate)}` : 'Starts on delivery'}</dd>
              <dt className="text-[#5B6B82]">Unit</dt>
              <dd>
                {r.unit ? (
                  <Link to={`/admin/rental-units/${r.unit.id}`} className="font-mono font-semibold text-[#1D5FAF] hover:underline">
                    {r.unit.unitCode}
                  </Link>
                ) : (
                  'Not assigned'
                )}
              </dd>
              {r.unit && (
                <>
                  <dt className="text-[#5B6B82]">Serial number</dt>
                  <dd className="font-mono">{r.unit.serialNumber}</dd>
                </>
              )}
            </dl>
            {canEdit && r.status === 'approved' && r.unit && (r.availableUnits?.length ?? 0) > 0 && (
              <details className="pt-1">
                <summary className="cursor-pointer font-semibold text-[#1D5FAF]">Change unit</summary>
                <div className="mt-2 flex gap-2">
                  <UnitPicker r={r} unitId={unitId} setUnitId={setUnitId} compact />
                  <button type="button" disabled={busy || unitId === r.unit.id} onClick={() => run('change the unit', () => assignRentalUnit(r.id, unitId), 'Unit changed')} className={btnSecondary}>
                    Save
                  </button>
                </div>
              </details>
            )}
            {r.extensions.filter((e) => e.status !== 'rejected' && e.status !== 'requested').length > 0 && (
              <div className="border-t border-[#DCE6F2] pt-2">
                <p className="text-[10px] font-semibold uppercase text-[#5B6B82]">Extensions</p>
                {r.extensions
                  .filter((e) => e.status !== 'rejected' && e.status !== 'requested')
                  .map((e) => (
                    <p key={e.id}>
                      +{e.extraPeriods} {r.plan.unit}(s) · {formatINR(e.amount)} · till {e.newEndDate && formatShortDate(e.newEndDate)}
                      {e.status === 'approved' && <span className="text-[#B85A0E]"> (unpaid)</span>}
                    </p>
                  ))}
              </div>
            )}
          </section>

          {(r.delivery || r.returnPickup) && (
            <section className={`${card} space-y-3 text-xs`}>
              <h2 className={h2}>Logistics</h2>
              {[
                ['Delivery', r.delivery],
                ['Pickup', r.returnPickup],
              ].map(([title, s]) =>
                s && typeof s === 'object' ? (
                  <div key={title as string} className="rounded-lg border border-[#DCE6F2] p-3">
                    <p className="font-semibold text-[#12263F]">
                      {title as string} · {s.courier}
                    </p>
                    {s.awb && <p className="font-mono text-[#5B6B82]">AWB {s.awb}</p>}
                    {s.pickupDate && <p className="text-[#5B6B82]">On {formatShortDate(s.pickupDate)}</p>}
                    {s.deliveredAt && <p className="text-emerald-700">Completed {formatShortDate(s.deliveredAt)}</p>}
                    {s.trackingUrl && (
                      <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1D5FAF] hover:underline">
                        Track <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : null
              )}
            </section>
          )}

          <section className={`${card} space-y-3`}>
            <h2 className={h2}>Internal notes</h2>
            {canEdit && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!noteInput.trim()) return;
                  if (await run('add the note', () => addRentalNote(r.id, noteInput.trim()), 'Note added')) setNoteInput('');
                }}
                className="space-y-2"
              >
                <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Technician visit, customer call, anything the team should know…" className={textareaClass} />
                <button type="submit" disabled={busy || !noteInput.trim()} className="w-full rounded-lg bg-[#0B2545] px-3 py-2 text-xs font-semibold text-white hover:bg-[#11335E] disabled:opacity-50">
                  Add note
                </button>
              </form>
            )}
            {r.internalNotes.length === 0 ? (
              <p className="text-xs text-[#5B6B82]">No notes yet.</p>
            ) : (
              <ul className="space-y-2">
                {r.internalNotes.map((n, i) => (
                  <li key={i} className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-2 text-xs">
                    <p className="text-[#12263F]">{n.text}</p>
                    <p className="mt-0.5 text-[11px] text-[#5B6B82]">
                      {n.by} · {formatDateTime(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Cancel */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-[#DCE6F2] bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-[#12263F]">Cancel {r.rentalNumber}?</h3>
            {r.amounts.paid > 0 && (
              <p className="rounded-lg border border-[#F28C38]/35 bg-[#F28C38]/10 p-3 text-xs text-[#12263F]">
                {formatINR(r.amounts.paid)} has been paid. It is refunded automatically to the original payment method where possible; otherwise refund it from this page afterwards.
              </p>
            )}
            <FormField label="Reason (shown to the customer)" required error={fe.reason}>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={textareaClass} placeholder="e.g. Equipment not available in your city yet" />
            </FormField>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCancelOpen(false)} className={btnSecondary}>
                Keep booking
              </button>
              <button
                type="button"
                disabled={busy || cancelReason.trim().length < 3}
                onClick={async () => {
                  if (await run('cancel', () => cancelRental(r.id, cancelReason.trim()), 'Booking cancelled — customer notified')) setCancelOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Cancel booking
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)} role="dialog" aria-modal="true">
          <div className="relative flex max-h-full w-full max-w-4xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex w-full items-center justify-between text-sm text-white">
              <span className="font-semibold">{preview.label}</span>
              <span className="flex gap-2">
                <a href={preview.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">
                  Open in new tab <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button type="button" onClick={() => setPreview(null)} className="rounded-lg bg-white/15 p-1.5 hover:bg-white/25" aria-label="Close">
                  <XCircle className="h-4 w-4" />
                </button>
              </span>
            </div>
            {preview.isPdf ? (
              <iframe src={preview.url} title={preview.label} className="h-[80vh] w-full rounded-lg bg-white" />
            ) : (
              <img src={preview.url} alt={preview.label} className="max-h-[80vh] w-auto rounded-lg bg-white object-contain" />
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRefund}
        title={refund.amount > 0 ? `Refund ${formatINR(refund.amount)}?` : 'Close this rental?'}
        description={
          refund.amount === 0
            ? 'Nothing is left to refund after deductions. The rental will be marked completed.'
            : refund.mode === 'gateway'
              ? `Razorpay sends ${formatINR(refund.amount)} back to the customer's original payment method. This cannot be undone.`
              : `This records that ${formatINR(refund.amount)} was already sent by ${refund.mode === 'upi' ? 'UPI' : 'bank transfer'} (ref ${refund.reference || '—'}).`
        }
        confirmLabel={refund.amount > 0 ? 'Refund' : 'Close rental'}
        variant="primary"
        loading={busy}
        onCancel={() => setConfirmRefund(false)}
        onConfirm={async () => {
          const input = { amount: refund.amount, mode: refund.mode, reference: refund.reference.trim() || undefined, note: refund.note.trim() || undefined };
          await run('refund', () => (r.status === 'returned' ? refundRentalDeposit(r.id, input) : refundRental(r.id, input)), refund.amount > 0 ? 'Refund issued — customer notified' : 'Rental closed');
          setConfirmRefund(false);
        }}
      />
    </div>
  );
}

function UnitPicker({ r, unitId, setUnitId, compact }: { r: AdminRental; unitId: string; setUnitId: (v: string) => void; compact?: boolean }) {
  const units = r.availableUnits || [];
  const options = r.unit ? [{ id: r.unit.id, unitCode: r.unit.unitCode, serialNumber: r.unit.serialNumber, condition: r.unit.condition, nextServiceDue: null }, ...units] : units;
  if (options.length === 0) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        No unit of this product is available. Add one or finish servicing a unit under{' '}
        <Link to="/admin/rental-units" className="font-semibold underline">
          Rental Units
        </Link>
        .
      </p>
    );
  }
  return (
    <FormField label={compact ? '' : 'Unit'} className={compact ? 'flex-1' : ''}>
      <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={selectClass}>
        {!compact && <option value="">Assign later</option>}
        {options.map((u) => (
          <option key={u.id} value={u.id}>
            {u.unitCode} · S/N {u.serialNumber} · {u.condition}
            {u.nextServiceDue ? ` · service due ${u.nextServiceDue}` : ''}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function RefundFields({
  r,
  refund,
  setRefund,
  max,
  fe,
  allowZero,
}: {
  r: AdminRental;
  refund: { amount: number; mode: RefundMode; reference: string; note: string };
  setRefund: React.Dispatch<React.SetStateAction<{ amount: number; mode: RefundMode; reference: string; note: string }>>;
  max: number;
  fe: Record<string, string>;
  allowZero?: boolean;
}) {
  const online = r.payments.some((p) => p.method.startsWith('Online'));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <FormField label="Amount (₹)" required error={fe.amount} hint={`Max ${formatINR(max)}`}>
        <input type="number" min={allowZero ? 0 : 1} max={max} step="0.01" value={Number.isFinite(refund.amount) ? refund.amount : ''} onChange={(e) => setRefund((f) => ({ ...f, amount: Number(e.target.value) }))} className={`${inputClass} tabular-nums`} />
      </FormField>
      <FormField label="Refund to" required error={fe.mode}>
        <select value={refund.mode} onChange={(e) => setRefund((f) => ({ ...f, mode: e.target.value as RefundMode }))} className={selectClass}>
          {online && <option value="gateway">Original payment (Razorpay)</option>}
          <option value="bank_transfer">Bank transfer — already sent</option>
          <option value="upi">UPI — already sent</option>
        </select>
      </FormField>
      {refund.mode !== 'gateway' && refund.amount > 0 && (
        <FormField label={refund.mode === 'upi' ? 'UPI transaction id' : 'UTR'} required error={fe.reference}>
          <input value={refund.reference} onChange={(e) => setRefund((f) => ({ ...f, reference: e.target.value }))} className={`${inputClass} font-mono`} />
        </FormField>
      )}
    </div>
  );
}

/** Private KYC file loaded with the staff session; images show as a thumbnail, PDFs as a card. */
function KycThumb({
  rentalId,
  doc,
  onOpen,
}: {
  rentalId: string;
  doc: { id: string; label: string; mimeType: string; fileName: string };
  onOpen: (p: { url: string; label: string; isPdf: boolean }) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isPdf = doc.mimeType === 'application/pdf';

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    openKycDocument(rentalId, doc.id)
      .then((u) => {
        objectUrl = u;
        if (alive) setUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [rentalId, doc.id]);

  const box = 'relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]';
  if (failed) return <span className={`${box} text-[10px] text-red-600`}>Could not load</span>;
  if (!url) return <span className={`${box} animate-pulse`} />;
  return (
    <button type="button" onClick={() => onOpen({ url, label: doc.label, isPdf })} className={`${box} group hover:ring-2 hover:ring-[#1D5FAF]/40`} title={`View ${doc.label}`}>
      {isPdf ? (
        <span className="flex flex-col items-center gap-1 text-[#1D5FAF]">
          <FileText className="h-6 w-6" />
          <span className="text-[10px] font-bold">PDF</span>
        </span>
      ) : (
        <img src={url} alt={doc.label} className="h-full w-full object-cover" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        View
      </span>
    </button>
  );
}
