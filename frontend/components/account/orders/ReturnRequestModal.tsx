'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Banknote,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Info,
  Loader2,
  Minus,
  Package,
  Plus,
  Repeat,
  ShieldCheck,
  Smartphone,
  Undo2,
  X,
} from 'lucide-react';
import type { Order, OrderReturnRequest } from '@/types';
import { requestOrderReturn, uploadReturnPhotos, type RefundAccountInput } from '@/lib/api/orders';
import { ApiClientError, errorMessage } from '@/lib/api/backend';
import { useSiteSettings } from '@/lib/settings/store';
import { formatDay, formatINR } from './returnUi';

interface Props {
  order: Order;
  onClose: () => void;
  onSubmitted: (order: Order, request: OrderReturnRequest) => void;
}

type Step = 1 | 2 | 3 | 'done';
type Photo = { id: string; preview: string; path?: string; uploading: boolean; error?: string };

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI = /^[a-z0-9.\-_]{2,256}@[a-z][a-z0-9]{1,63}$/;

const field =
  'w-full rounded-xl border border-[#D5DEEA] bg-white px-3.5 py-2.5 text-[14px] text-[#12263F] placeholder:text-[#97A3B4] focus:outline-none focus:border-[#1D5FAF] focus:ring-3 focus:ring-[#1D5FAF]/15';

export default function ReturnRequestModal({ order, onClose, onSubmitted }: Props) {
  const { returns: policy } = useSiteSettings();
  const allowedTypes = order.returnPolicy?.types?.length
    ? order.returnPolicy.types
    : ([policy.refundEnabled && 'refund', policy.replacementEnabled && 'replacement'].filter(Boolean) as ('refund' | 'replacement')[]);
  const isCod = order.paymentMethod === 'Cash on Delivery';

  const returnable = order.items.filter((it) => (it.returnableQty ?? 0) > 0 && it.orderItemId);
  const [step, setStep] = useState<Step>(1);
  const [qty, setQty] = useState<Record<string, number>>(() =>
    returnable.length === 1 ? { [returnable[0].orderItemId!]: returnable[0].returnableQty! } : {}
  );
  const [type, setType] = useState<'refund' | 'replacement'>(allowedTypes[0] || 'refund');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [accountMode, setAccountMode] = useState<'bank' | 'upi'>('upi');
  const [account, setAccount] = useState({ accountHolder: '', accountNumber: '', confirmNumber: '', ifsc: '', bankName: '', upiId: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [created, setCreated] = useState<OrderReturnRequest | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, submitting]);

  // Free object URLs
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const selected = useMemo(
    () => order.items.filter((it) => it.orderItemId && (qty[it.orderItemId] || 0) > 0),
    [order.items, qty]
  );
  const itemValue = selected.reduce((sum, it) => sum + (it.totalPrice / it.quantity) * (qty[it.orderItemId!] || 0), 0);
  const needsAccount = type === 'refund' && isCod;
  const uploading = photos.some((p) => p.uploading);

  const toggle = (id: string, max: number) => setQty((q) => ({ ...q, [id]: q[id] ? 0 : max }));
  const changeQty = (id: string, delta: number, max: number) =>
    setQty((q) => ({ ...q, [id]: Math.min(max, Math.max(0, (q[id] || 0) + delta)) }));

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = policy.maxPhotos - photos.length;
    const list = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, Math.max(0, room));
    if (!list.length) return;
    const tooBig = list.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) return setErrors((e) => ({ ...e, photos: `"${tooBig.name}" is larger than 10 MB` }));

    const pending: Photo[] = list.map((f) => ({ id: `${Date.now()}-${f.name}-${Math.random()}`, preview: URL.createObjectURL(f), uploading: true }));
    setPhotos((p) => [...p, ...pending]);
    setErrors((e) => ({ ...e, photos: '' }));
    await Promise.all(
      list.map(async (file, i) => {
        try {
          const [saved] = await uploadReturnPhotos([file]);
          setPhotos((p) => p.map((x) => (x.id === pending[i].id ? { ...x, uploading: false, path: saved.path } : x)));
        } catch (err) {
          setPhotos((p) => p.map((x) => (x.id === pending[i].id ? { ...x, uploading: false, error: errorMessage(err, 'Upload failed') } : x)));
        }
      })
    );
  };

  const removePhoto = (id: string) =>
    setPhotos((p) => {
      const hit = p.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.preview);
      return p.filter((x) => x.id !== id);
    });

  // ---- validation per step ----
  const validate = (s: Step): boolean => {
    const e: Record<string, string> = {};
    if (s === 1 && selected.length === 0) e.items = 'Select at least one item';
    if (s === 2) {
      if (!reason) e.reason = 'Choose what went wrong';
      if (details.trim().length < 10) e.details = 'Please describe the problem in a few words (at least 10 characters)';
      const ok = photos.filter((p) => p.path);
      if (policy.photosRequired && ok.length === 0) e.photos = 'Add at least one photo of the product and its packaging';
      if (photos.some((p) => p.error)) e.photos = 'Remove the photos that failed to upload';
    }
    if (s === 3) {
      if (needsAccount) {
        if (accountMode === 'upi') {
          if (!UPI.test(account.upiId.trim().toLowerCase())) e.upiId = 'Enter a valid UPI id, e.g. name@okhdfcbank';
        } else {
          if (account.accountHolder.trim().length < 2) e.accountHolder = "Enter the account holder's name";
          const num = account.accountNumber.replace(/\s/g, '');
          if (!/^\d{9,18}$/.test(num)) e.accountNumber = 'Account numbers have 9 to 18 digits';
          else if (num !== account.confirmNumber.replace(/\s/g, '')) e.confirmNumber = 'Account numbers do not match';
          if (!IFSC.test(account.ifsc.trim().toUpperCase())) e.ifsc = 'Enter a valid 11-character IFSC, e.g. SBIN0001234';
        }
      }
      if (!agree) e.agree = 'Please confirm to continue';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && validate(1)) setStep(2);
    else if (step === 2 && validate(2)) setStep(3);
  };

  const submit = async () => {
    if (!validate(3)) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      let refundAccount: RefundAccountInput | undefined;
      if (needsAccount) {
        refundAccount =
          accountMode === 'upi'
            ? { mode: 'upi', upiId: account.upiId.trim().toLowerCase() }
            : {
                mode: 'bank',
                accountHolder: account.accountHolder.trim(),
                accountNumber: account.accountNumber.replace(/\s/g, ''),
                ifsc: account.ifsc.trim().toUpperCase(),
                bankName: account.bankName.trim() || undefined,
              };
      }
      const res = await requestOrderReturn(order.id, {
        type,
        reason,
        customerNote: details.trim(),
        photos: photos.filter((p) => p.path).map((p) => p.path!),
        items: selected.map((it) => ({ orderItemId: it.orderItemId!, quantity: qty[it.orderItemId!] })),
        refundAccount,
      });
      setCreated(res.returnRequest);
      setStep('done');
      onSubmitted(res.order, res.returnRequest);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        const f = err.fields;
        if (f.photos) {
          setErrors({ photos: f.photos });
          setStep(2);
        }
      }
      setSubmitError(errorMessage(err, 'Could not submit your request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Select items', 'What went wrong', 'Review & submit'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B2545]/60 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="rr-title">
      <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl border border-[#DCE6F2] overflow-hidden h-[94vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#E8EEF5] px-5 sm:px-6 pt-4 pb-3.5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {step !== 1 && step !== 'done' && (
                <button type="button" onClick={() => setStep((s) => (s === 3 ? 2 : 1))} className="rounded-lg p-1 -ml-1 text-[#5B6B82] hover:bg-[#EAF2FC] cursor-pointer" aria-label="Back">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 id="rr-title" className="text-[17px] font-semibold text-[#12263F]">
                  {step === 'done' ? 'Request submitted' : 'Return or replace items'}
                </h3>
                <p className="text-[13px] text-[#5B6B82]">
                  Order {order.orderNumber}
                  {order.returnPolicy?.windowEndsAt && step !== 'done' && <> · Window open till {formatDay(order.returnPolicy.windowEndsAt)}</>}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg p-1.5 text-[#8A97A8] hover:bg-[#EAF2FC] hover:text-[#12263F] cursor-pointer" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          {step !== 'done' && (
            <ol className="mt-3.5 grid grid-cols-3 gap-2" aria-label="Progress">
              {stepTitles.map((t, i) => {
                const n = (i + 1) as 1 | 2 | 3;
                const done = typeof step === 'number' && step > n;
                const active = step === n;
                return (
                  <li key={t} className="min-w-0">
                    <div className={`h-1 rounded-full ${done || active ? 'bg-[#1D5FAF]' : 'bg-[#E2E8F0]'}`} />
                    <p className={`mt-1.5 text-[12px] truncate ${active ? 'font-semibold text-[#12263F]' : done ? 'text-[#1D5FAF]' : 'text-[#8A97A8]'}`}>
                      {done ? <Check className="inline w-3 h-3 mr-0.5 -mt-0.5" /> : `${n}. `}
                      {t}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[14px] text-[#5B6B82]">Which items have a problem?</p>
              <ul className="space-y-2.5">
                {order.items.map((it, idx) => {
                  const id = it.orderItemId || `${idx}`;
                  const max = it.returnableQty ?? 0;
                  const disabled = max === 0;
                  const q = qty[id] || 0;
                  return (
                    <li
                      key={id}
                      className={`rounded-xl border p-3 sm:p-3.5 transition-colors ${
                        disabled ? 'border-[#E8EEF5] bg-[#FAFBFD]' : q > 0 ? 'border-[#1D5FAF] bg-[#F3F8FE]' : 'border-[#DCE6F2] hover:border-[#B9CCE6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={q > 0}
                          onChange={() => toggle(id, max)}
                          className="w-[18px] h-[18px] accent-[#1D5FAF] shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          aria-label={`Select ${it.productName}`}
                        />
                        <div className="w-14 h-14 rounded-lg bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
                          {it.image ? (
                            <Image src={it.image} alt="" fill className="object-contain p-1" sizes="56px" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-6 h-6 m-auto mt-4 text-[#C5CFDC]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[14px] font-semibold leading-snug line-clamp-2 ${disabled ? 'text-[#8A97A8]' : 'text-[#12263F]'}`}>{it.productName}</p>
                          <p className="text-[12px] text-[#8A97A8] mt-0.5">
                            {it.variantName ? `${it.variantName} · ` : ''}
                            {formatINR(it.unitPrice)} each · ordered {it.quantity}
                          </p>
                          {disabled && (
                            <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {it.nonReturnable ? 'Not returnable' : (it.returnedQty ?? 0) > 0 ? 'Already in a return request' : 'Not eligible'}
                            </span>
                          )}
                        </div>
                        {!disabled && max > 1 && q > 0 && (
                          <div className="flex items-center rounded-lg border border-[#D5DEEA] bg-white shrink-0" aria-label="Quantity">
                            <button type="button" onClick={() => changeQty(id, -1, max)} className="p-2 text-[#5B6B82] hover:text-[#1D5FAF] cursor-pointer" aria-label="Decrease">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-[14px] font-semibold tabular-nums">{q}</span>
                            <button type="button" onClick={() => changeQty(id, 1, max)} disabled={q >= max} className="p-2 text-[#5B6B82] hover:text-[#1D5FAF] disabled:opacity-30 cursor-pointer" aria-label="Increase">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {errors.items && <p className="text-[13px] text-red-600">{errors.items}</p>}
              <p className="flex items-start gap-2 text-[12px] text-[#8A97A8] pt-1">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Requests can be raised within {order.returnPolicy?.windowDays ?? policy.returnWindowDays} days of delivery.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {allowedTypes.length > 0 && (
                <fieldset>
                  <legend className="text-[14px] font-semibold text-[#12263F] mb-2.5">What would you like?</legend>
                  <div className={`grid gap-2.5 ${allowedTypes.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                    {allowedTypes.map((t) => {
                      const active = type === t;
                      const Icon = t === 'refund' ? Undo2 : Repeat;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          aria-pressed={active}
                          className={`text-left rounded-xl border-2 p-3.5 transition-colors cursor-pointer ${active ? 'border-[#1D5FAF] bg-[#F3F8FE]' : 'border-[#DCE6F2] hover:border-[#B9CCE6]'}`}
                        >
                          <span className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-[15px] font-semibold text-[#12263F]">
                              <Icon className="w-[18px] h-[18px] text-[#1D5FAF]" />
                              {t === 'refund' ? 'Return for a refund' : 'Replace the item'}
                            </span>
                            <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${active ? 'border-[#1D5FAF] bg-[#1D5FAF]' : 'border-[#C5CFDC]'}`}>
                              {active && <Check className="w-3 h-3 text-white" />}
                            </span>
                          </span>
                          <span className="block text-[13px] text-[#5B6B82] mt-1.5 leading-snug">
                            {t === 'refund'
                              ? `We pick it up and refund ${isCod ? 'to your bank account or UPI' : 'to your original payment method'}.`
                              : 'We pick it up and send you the same item again, at no extra cost.'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <fieldset>
                <legend className="text-[14px] font-semibold text-[#12263F] mb-2.5">What went wrong?</legend>
                <div className="flex flex-wrap gap-2">
                  {policy.returnReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      aria-pressed={reason === r}
                      className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                        reason === r ? 'border-[#1D5FAF] bg-[#1D5FAF] text-white' : 'border-[#D5DEEA] text-[#12263F] hover:border-[#1D5FAF]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {errors.reason && <p className="mt-2 text-[13px] text-red-600">{errors.reason}</p>}
              </fieldset>

              <div>
                <label htmlFor="rr-details" className="block text-[14px] font-semibold text-[#12263F] mb-1.5">
                  Describe the problem
                </label>
                <textarea
                  id="rr-details"
                  rows={4}
                  maxLength={1000}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. The display stays blank after charging overnight. The outer box was dented on delivery."
                  className={field}
                />
                <div className="mt-1 flex justify-between text-[12px]">
                  <span className="text-red-600">{errors.details}</span>
                  <span className="text-[#8A97A8] tabular-nums">{details.length}/1000</span>
                </div>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-[#12263F]">
                  Photos {policy.photosRequired ? <span className="text-red-500">*</span> : <span className="font-normal text-[#8A97A8]">(optional)</span>}
                </p>
                <p className="text-[12px] text-[#8A97A8] mb-2.5">
                  Show the product, the problem and the outer box — up to {policy.maxPhotos} photos. Clear photos get approved faster.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {photos.map((p) => (
                    <div key={p.id} className={`relative w-[88px] h-[88px] rounded-xl overflow-hidden border ${p.error ? 'border-red-300' : 'border-[#DCE6F2]'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" className={`w-full h-full object-cover ${p.uploading ? 'opacity-50' : ''}`} />
                      {p.uploading && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-[#1D5FAF]" />
                        </span>
                      )}
                      {p.error && (
                        <span className="absolute inset-x-0 bottom-0 bg-red-600/90 px-1 py-0.5 text-[10px] text-white text-center" title={p.error}>
                          Failed
                        </span>
                      )}
                      {!p.uploading && (
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          className="absolute top-1 right-1 rounded-full bg-white/95 p-1 shadow text-[#12263F] hover:text-red-600 cursor-pointer"
                          aria-label="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {photos.length < policy.maxPhotos && (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        addFiles(e.dataTransfer.files);
                      }}
                      className="w-[88px] h-[88px] rounded-xl border-2 border-dashed border-[#B9CCE6] bg-[#F8FAFD] text-[#1D5FAF] flex flex-col items-center justify-center gap-1 text-[12px] font-semibold hover:bg-[#EAF2FC] cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      Add photo
                    </button>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                {errors.photos && <p className="mt-2 text-[13px] text-red-600">{errors.photos}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="rounded-xl border border-[#DCE6F2] overflow-hidden">
                <div className="flex items-center justify-between bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E8EEF5]">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-[#12263F]">
                    {type === 'refund' ? <Undo2 className="w-4 h-4 text-[#1D5FAF]" /> : <Repeat className="w-4 h-4 text-[#1D5FAF]" />}
                    {type === 'refund' ? 'Return for a refund' : 'Replacement'}
                  </span>
                  <button type="button" onClick={() => setStep(2)} className="text-[13px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer">
                    Edit
                  </button>
                </div>
                <ul className="divide-y divide-[#EEF2F7]">
                  {selected.map((it) => (
                    <li key={it.orderItemId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                      <span className="text-[#12263F] line-clamp-1">
                        {it.productName} <span className="text-[#8A97A8]">× {qty[it.orderItemId!]}</span>
                      </span>
                      <span className="tabular-nums text-[#5B6B82] shrink-0">{formatINR((it.totalPrice / it.quantity) * qty[it.orderItemId!])}</span>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-[#E8EEF5] text-[13px] text-[#5B6B82] space-y-0.5">
                  <p>
                    <span className="font-semibold text-[#12263F]">Reason:</span> {reason}
                  </p>
                  <p>
                    <span className="font-semibold text-[#12263F]">Photos:</span> {photos.filter((p) => p.path).length}
                  </p>
                </div>
              </div>

              {/* Where the money goes */}
              {type === 'refund' && !isCod && (
                <div className="flex gap-3 rounded-xl border border-[#CFE0F5] bg-[#F3F8FE] p-3.5 text-[13px] text-[#12263F]">
                  <Banknote className="w-5 h-5 text-[#1D5FAF] shrink-0" />
                  <p>
                    Refund of up to <strong>{formatINR(itemValue)}</strong> goes back to your <strong>original payment method</strong> after we receive and
                    inspect the item. Banks usually credit it within {policy.refundProcessingDays} business days.
                  </p>
                </div>
              )}

              {type === 'replacement' && (
                <div className="flex gap-3 rounded-xl border border-[#CFE0F5] bg-[#F3F8FE] p-3.5 text-[13px] text-[#12263F]">
                  <Repeat className="w-5 h-5 text-[#1D5FAF] shrink-0" />
                  <p>
                    We’ll collect the item from your delivery address and ship the same product again once it passes inspection. If it is out of stock, we’ll
                    refund you instead.
                  </p>
                </div>
              )}

              {needsAccount && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#12263F]">Where should we send your refund?</p>
                    <p className="text-[12px] text-[#8A97A8]">
                      You paid cash on delivery, so we refund up to {formatINR(itemValue)} by UPI or bank transfer. Details are stored encrypted.
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl border border-[#D5DEEA] p-1 bg-[#F8FAFD]">
                    {(['upi', 'bank'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAccountMode(m)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer ${
                          accountMode === m ? 'bg-white text-[#1D5FAF] shadow-sm' : 'text-[#5B6B82]'
                        }`}
                      >
                        {m === 'upi' ? <Smartphone className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                        {m === 'upi' ? 'UPI' : 'Bank account'}
                      </button>
                    ))}
                  </div>
                  {accountMode === 'upi' ? (
                    <Input id="rr-upi" label="UPI id" value={account.upiId} error={errors.upiId} placeholder="name@okhdfcbank" onChange={(v) => setAccount((a) => ({ ...a, upiId: v }))} />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input id="rr-holder" label="Account holder name" value={account.accountHolder} error={errors.accountHolder} onChange={(v) => setAccount((a) => ({ ...a, accountHolder: v }))} />
                      <Input id="rr-bank" label="Bank name (optional)" value={account.bankName} onChange={(v) => setAccount((a) => ({ ...a, bankName: v }))} />
                      <Input
                        id="rr-acc"
                        label="Account number"
                        inputMode="numeric"
                        value={account.accountNumber}
                        error={errors.accountNumber}
                        onChange={(v) => setAccount((a) => ({ ...a, accountNumber: v.replace(/[^\d\s]/g, '') }))}
                      />
                      <Input
                        id="rr-acc2"
                        label="Confirm account number"
                        inputMode="numeric"
                        value={account.confirmNumber}
                        error={errors.confirmNumber}
                        onChange={(v) => setAccount((a) => ({ ...a, confirmNumber: v.replace(/[^\d\s]/g, '') }))}
                      />
                      <Input
                        id="rr-ifsc"
                        label="IFSC code"
                        value={account.ifsc}
                        error={errors.ifsc}
                        placeholder="SBIN0001234"
                        onChange={(v) => setAccount((a) => ({ ...a, ifsc: v.toUpperCase() }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Conditions */}
              <div className="rounded-xl border border-[#E8EEF5] bg-[#F8FAFD] p-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#12263F]">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Before you submit
                </p>
                <p className="mt-1 text-[13px] text-[#5B6B82] leading-relaxed">{policy.conditions}</p>
                <label className="mt-3 flex items-start gap-2.5 text-[13px] text-[#12263F] cursor-pointer">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#1D5FAF]" />
                  I confirm the item(s) will be handed over in this condition, with all accessories and documents.
                </label>
                {errors.agree && <p className="mt-1.5 text-[12px] text-red-600">{errors.agree}</p>}
              </div>

              {submitError && (
                <p className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-[13px] text-red-700" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {submitError}
                </p>
              )}
            </div>
          )}

          {step === 'done' && created && (
            <div className="text-center py-4 sm:py-6">
              <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="mt-4 text-[18px] font-semibold text-[#12263F]">We’ve got your request</h4>
              <p className="mt-1 text-[14px] text-[#5B6B82]">
                Request number <span className="font-semibold text-[#12263F] font-mono">{created.returnNumber}</span>
              </p>
              <ol className="mt-6 max-w-sm mx-auto text-left space-y-3">
                {[
                  'Our team reviews your request — usually within 1–2 working days.',
                  'Once approved, a courier collects the item from your delivery address.',
                  created.type === 'refund'
                    ? `After inspection we issue your refund. It reaches you in ${policy.refundProcessingDays} business days.`
                    : 'After inspection we ship your replacement.',
                ].map((t, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-[#12263F]">
                    <span className="w-6 h-6 rounded-full bg-[#EAF2FC] text-[#1D5FAF] text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-[13px] text-[#8A97A8]">We’ll keep you updated by SMS and email. Track it any time under My Orders.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E8EEF5] px-5 sm:px-6 py-3.5 shrink-0 flex items-center justify-between gap-3 bg-white">
          {step === 'done' ? (
            <button type="button" onClick={onClose} className="ml-auto rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-6 py-2.5 text-[14px] font-semibold text-white cursor-pointer">
              Done
            </button>
          ) : (
            <>
              <p className="text-[13px] text-[#5B6B82] hidden sm:block">
                {selected.length > 0 ? (
                  <>
                    {selected.reduce((n, it) => n + (qty[it.orderItemId!] || 0), 0)} item(s) · <span className="font-semibold text-[#12263F]">{formatINR(itemValue)}</span>
                  </>
                ) : (
                  'No items selected'
                )}
              </p>
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button type="button" onClick={onClose} disabled={submitting} className="flex-1 sm:flex-none rounded-xl border border-[#D5DEEA] px-5 py-2.5 text-[14px] font-semibold text-[#12263F] hover:bg-[#F8FAFD] cursor-pointer">
                  Cancel
                </button>
                {step === 3 ? (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting || uploading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-6 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Submitting…' : 'Submit request'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    disabled={uploading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-6 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? 'Uploading photos…' : 'Continue'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: 'numeric' | 'text';
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#12263F] mb-1">
        {label}
      </label>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={`${field} ${error ? '!border-red-400' : ''}`}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
