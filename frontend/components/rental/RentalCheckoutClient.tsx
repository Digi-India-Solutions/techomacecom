'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bed,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import type { CustomerRental, RentalKycDoc, RentalQuote } from '@/types';
import { useRentalStore, useToastStore, useUserStore } from '@/lib/store';
import DepositModeChooser from '@/components/rental/DepositModeChooser';
import { useHydrated } from '@/hooks/use-hydrated';
import { useSiteSettings } from '@/lib/settings/store';
import { useRentalPincodeCheck } from '@/lib/settings/pincode';
import CustomerAuthForm from '@/components/auth/CustomerAuthForm';
import { AddressForm, blankAddress } from '@/components/account/AddressesTab';
import { errorMessage } from '@/lib/api/backend';
import {
  createRental,
  deleteKycDocument,
  fetchRentalQuote,
  DELIVERY_TIME_SLOTS,
  deliveryTimeLabel,
  type DeliveryTimeSlot,
  openKycDocument,
  startRentalPayment,
  uploadKycDocument,
  verifyRentalPayment,
} from '@/lib/api/rentals';
import { openRazorpay, PaymentCancelled, type RazorpayOrderInfo } from '@/lib/razorpay';
import { CheckoutSkeleton } from '@/components/skeletons/PageSkeletons';

type StepKey = 'account' | 'address' | 'documents' | 'review';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const day = (d?: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const MAX_MB = 8;

export default function RentalCheckoutClient() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { draft, setDraft, clearDraft } = useRentalStore();
  const depositMode = draft?.depositMode ?? 'online';
  const deliveryTime: DeliveryTimeSlot = DELIVERY_TIME_SLOTS.find((t) => t === draft?.deliveryTime) ?? '10:00';
  const { user, isAuthenticated, setUser } = useUserStore();
  const { addToast } = useToastStore();
  const { store } = useSiteSettings();

  const [quote, setQuote] = useState<RentalQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [step, setStep] = useState<StepKey>('address');
  const [addressId, setAddressId] = useState<string>('');
  const [addingAddress, setAddingAddress] = useState(false);
  const [docs, setDocs] = useState<Record<string, RentalKycDoc>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [pendingRental, setPendingRental] = useState<CustomerRental | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [modalPreview, setModalPreview] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  // Fresh quote for the saved selection (prices / advance % may have changed since the rent page)
  useEffect(() => {
    if (!draft) return;
    let alive = true;
    fetchRentalQuote({ productSlug: draft.productSlug, period: draft.period, periods: draft.periods, startDate: draft.startDate, depositMode: draft.depositMode ?? 'online' })
      .then((q) => alive && setQuote(q))
      .catch((err) => alive && setQuoteError(errorMessage(err, 'This rental is no longer available with these options.')));
    return () => {
      alive = false;
    };
  }, [draft]);

  const needsDocs = Boolean(quote?.kyc.required);
  const steps = useMemo(() => {
    const list: { key: StepKey; label: string }[] = [];
    if (!isAuthenticated) list.push({ key: 'account', label: 'Sign in' });
    list.push({ key: 'address', label: 'Delivery address' });
    if (needsDocs) list.push({ key: 'documents', label: 'Documents' });
    list.push({ key: 'review', label: 'Review & pay' });
    return list;
  }, [isAuthenticated, needsDocs]);
  const current = !isAuthenticated ? 'account' : step;
  const currentIdx = steps.findIndex((s) => s.key === current);

  const addresses = user?.addresses || [];
  const chosenAddressId = addressId || addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || '';
  const chosenAddress = addresses.find((a) => a.id === chosenAddressId);
  const { result: pinCheck, loading: pinChecking } = useRentalPincodeCheck(chosenAddress?.pincode);
  const isPincodeServiceable = pinCheck ? pinCheck.serviceable : true;
  const docsComplete = !needsDocs || (quote?.kyc.documents || []).every((d) => docs[d.key]);

  if (!hydrated) return <CheckoutSkeleton />;

  if (!draft) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-14 h-14 rounded-full bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mx-auto">
          <Bed className="w-7 h-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-[#12263F]">Choose equipment to rent</h1>
        <p className="mt-2 text-[15px] text-[#5B6B82]">Pick a product and plan first, then come back here to book it.</p>
        <Link href="/rent" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D5FAF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#174E90]">
          Browse rental equipment <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const go = (key: StepKey) => {
    setStep(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const next = () => go(steps[Math.min(currentIdx + 1, steps.length - 1)].key);

  const pickFile = async (docType: string, file?: File) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      addToast({ type: 'error', title: 'File too large', message: `Please upload a file under ${MAX_MB} MB.` });
      return;
    }
    setUploading(docType);
    try {
      const old = docs[docType];
      if (file.type.startsWith('image/')) {
        const localBlob = URL.createObjectURL(file);
        setPreviewUrls((prev) => ({ ...prev, [docType]: localBlob }));
      }
      const saved = await uploadKycDocument(docType, file);
      setDocs((d) => ({ ...d, [docType]: saved }));
      if (old) deleteKycDocument(old.id).catch(() => undefined);
    } catch (err) {
      addToast({ type: 'error', title: 'Upload failed', message: errorMessage(err) });
    } finally {
      setUploading(null);
    }
  };

  const getDocPreviewUrl = async (doc: RentalKycDoc) => {
    if (previewUrls[doc.docType]) return previewUrls[doc.docType];
    try {
      const url = await openKycDocument(doc.id);
      setPreviewUrls((prev) => ({ ...prev, [doc.docType]: url }));
      return url;
    } catch (err) {
      addToast({ type: 'error', title: 'Could not load preview', message: errorMessage(err) });
      return null;
    }
  };

  const viewDoc = async (doc: RentalKycDoc) => {
    try {
      const url = await getDocPreviewUrl(doc);
      if (url) {
        const isPdf = doc.mimeType?.includes('pdf') || doc.fileName?.toLowerCase().endsWith('.pdf');
        setModalPreview({ url, title: doc.label || doc.fileName, isPdf });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Could not open the file', message: errorMessage(err) });
    }
  };

  const payFor = async (rental: CustomerRental, order: RazorpayOrderInfo) => {
    const signed = await openRazorpay(order, {
      name: store.brandName,
      description: `Rental ${rental.rentalNumber}`,
      prefill: { name: user?.name, email: user?.email, contact: chosenAddress?.phone || user?.phone },
    });
    const verified = await verifyRentalPayment(rental.id, signed);
    clearDraft();
    router.push(`/rent/success?rental=${encodeURIComponent(verified.rentalNumber)}`);
  };

  const placeBooking = async () => {
    if (!quote || !chosenAddressId) return;
    setPaying(true);
    setPayError('');
    try {
      if (pendingRental) {
        // Booking already created — just retry the payment
        const { razorpay } = await startRentalPayment(pendingRental.id, 'advance');
        await payFor(pendingRental, razorpay);
        return;
      }
      const res = await createRental({
        productSlug: draft.productSlug,
        period: draft.period,
        periods: draft.periods,
        startDate: draft.startDate,
        deliveryTime,
        addressId: chosenAddressId,
        kycDocumentIds: Object.values(docs).map((d) => d.id),
        depositMode,
      });
      setPendingRental(res.rental);
      if (!res.razorpay) throw new Error(res.error || 'Could not start the payment. Please try again.');
      await payFor(res.rental, res.razorpay);
    } catch (err) {
      setPayError(
        err instanceof PaymentCancelled
          ? 'Payment was not completed. Your booking is saved — pay now, or later from My Account → Rentals.'
          : errorMessage(err, 'Something went wrong. Please try again.')
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs text-[#5B6B82] font-medium">
        <Link href="/rent" className="hover:text-[#1D5FAF]">Rent medical equipment</Link>
        <span>/</span>
        <Link href={`/rent/${draft.productSlug}`} className="hover:text-[#1D5FAF] truncate max-w-[200px]">{draft.productName}</Link>
        <span>/</span>
        <span className="text-[#12263F] font-semibold">Checkout</span>
      </nav>

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto bg-white rounded-2xl border border-[#DCE6F2] p-3 sm:p-4">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s.key} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={!done}
                onClick={() => done && go(s.key)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold ${active ? 'text-[#12263F]' : done ? 'text-[#1D5FAF] cursor-pointer hover:bg-[#EAF2FC]' : 'text-[#8A97A8]'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] ${done ? 'bg-[#16A34A] text-white' : active ? 'bg-[#1D5FAF] text-white' : 'bg-[#EEF2F7] text-[#8A97A8]'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <span className="w-6 sm:w-10 h-px bg-[#DCE6F2]" />}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-7 min-w-0">
          {quoteError ? (
            <div className="text-center py-10">
              <AlertTriangle className="w-8 h-8 text-[#F28C38] mx-auto" />
              <p className="mt-3 font-semibold text-[#12263F]">{quoteError}</p>
              <Link href={`/rent/${draft.productSlug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D5FAF] hover:underline">
                <ArrowLeft className="w-4 h-4" /> Change the plan
              </Link>
            </div>
          ) : current === 'account' ? (
            <div className="max-w-md">
              <h2 className="text-xl font-semibold text-[#12263F]">Sign in to book</h2>
              <p className="mt-1 mb-5 text-[14px] text-[#5B6B82]">Your rental, documents and payments are saved to your account.</p>
              <CustomerAuthForm onSuccess={(u) => {
                setUser(u);
                go('address');
              }} />
            </div>
          ) : current === 'address' ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#12263F]">Where should we deliver?</h2>
                <p className="mt-1 text-[14px] text-[#5B6B82]">Our team delivers, installs and later picks up the equipment from this address.</p>
              </div>
              {addingAddress || addresses.length === 0 ? (
                <AddressForm
                  initial={blankAddress(user?.name || '', user?.phone || '', addresses.length === 0)}
                  isEdit={null}
                  onCancel={() => setAddingAddress(false)}
                  onSaved={(u) => {
                    const before = new Set(addresses.map((a) => a.id));
                    setUser(u);
                    const added = u.addresses.find((a) => !before.has(a.id));
                    if (added) setAddressId(added.id);
                    setAddingAddress(false);
                  }}
                />
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {addresses.map((a) => {
                      const selected = a.id === chosenAddressId;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAddressId(a.id)}
                          aria-pressed={selected}
                          className={`text-left rounded-xl border-2 p-4 transition-colors cursor-pointer ${selected ? 'border-[#1D5FAF] bg-[#F3F8FE]' : 'border-[#DCE6F2] hover:border-[#B9CCE6]'}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[14px] font-semibold text-[#12263F]">
                              {a.clinicHospitalName || a.name}
                              <span className="ml-2 rounded bg-[#EEF2F7] px-1.5 py-0.5 text-[11px] font-medium text-[#5B6B82]">{a.type}</span>
                            </span>
                            <span className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#1D5FAF] bg-[#1D5FAF]' : 'border-[#C5CFDC]'}`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </span>
                          </span>
                          <span className="mt-1 block text-[13px] text-[#5B6B82] leading-relaxed">
                            {a.name} · {a.phone}
                            <br />
                            {a.addressLine1}
                            {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                            <br />
                            {a.city}, {a.state} – {a.pincode}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setAddingAddress(true)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer">
                    <Plus className="w-4 h-4" /> Add a new address
                  </button>
                  {chosenAddress && pinCheck && !pinCheck.serviceable && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      Doorstep biomedical delivery &amp; setup is currently not available for PIN {chosenAddress.pincode}. Please select or add an address with a serviceable PIN code.
                    </p>
                  )}
                  {chosenAddress && pinCheck && pinCheck.serviceable && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Serviceable for rental delivery ({pinCheck.deliveryDays || '1-2 days'})
                    </p>
                  )}
                  <div className="flex justify-end pt-2">
                    <button type="button" disabled={!chosenAddressId || !isPincodeServiceable || pinChecking} onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : current === 'documents' && quote ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#12263F]">Upload documents</h2>
                <p className="mt-1 text-[14px] text-[#5B6B82]">{quote.kyc.instructions}</p>
                <p className="mt-1 text-[12px] text-[#8A97A8] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Stored privately and only seen by our verification team. PDF, JPG, PNG or WebP · max {MAX_MB} MB.
                </p>
              </div>
              <ul className="space-y-3">
                {quote.kyc.documents.map((d) => {
                  const doc = docs[d.key];
                  const busy = uploading === d.key;
                  const previewUrl = previewUrls[d.key];
                  const isPdf = doc && (doc.mimeType?.includes('pdf') || doc.fileName?.toLowerCase().endsWith('.pdf'));

                  return (
                    <li key={d.key} className={`rounded-xl border p-4 transition-all ${doc ? 'border-[#16A34A]/40 bg-[#F0FDF4]/60' : 'border-[#DCE6F2]'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Image Thumbnail / Icon Preview */}
                          {doc && previewUrl && !isPdf ? (
                            <button
                              type="button"
                              onClick={() => viewDoc(doc)}
                              className="relative w-14 h-14 rounded-lg border border-[#16A34A]/50 overflow-hidden shrink-0 group cursor-pointer bg-white"
                              title="Click to view full preview"
                            >
                              <img src={previewUrl} alt={d.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-4 h-4" />
                              </span>
                            </button>
                          ) : (
                            <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc ? 'bg-[#16A34A] text-white' : 'bg-[#EAF2FC] text-[#1D5FAF]'}`}>
                              {doc ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#12263F]">{d.label}</p>
                            {doc ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => viewDoc(doc)}
                                  className="text-[12px] font-medium text-[#1D5FAF] hover:underline inline-flex items-center gap-1 cursor-pointer max-w-full"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{doc.fileName}</span>
                                </button>
                                <span className="text-[11px] text-[#16A34A] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                                  Uploaded
                                </span>
                              </div>
                            ) : (
                              <p className="text-[12px] text-[#8A97A8]">{d.hint}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc && !previewUrl && !isPdf && (
                            <button
                              type="button"
                              onClick={() => getDocPreviewUrl(doc)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs text-[#5B6B82] hover:text-[#1D5FAF] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Show preview
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => fileInputs.current[d.key]?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DEEA] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#12263F] hover:border-[#1D5FAF] hover:text-[#1D5FAF] disabled:opacity-50 cursor-pointer shadow-2xs"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {busy ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                          </button>
                        </div>

                        <input
                          ref={(el) => {
                            fileInputs.current[d.key] = el;
                          }}
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          hidden
                          onChange={(e) => {
                            pickFile(d.key, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => go('address')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B6B82] hover:text-[#12263F] cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" disabled={!docsComplete || Boolean(uploading)} onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : quote ? (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-[#12263F]">Review &amp; pay</h2>
              <dl className="grid sm:grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4">
                  <dt className="text-[#8A97A8] mb-1">Rental</dt>
                  <dd className="text-[#12263F]">
                    <span className="font-semibold">{quote.durationLabel}</span> · {inr(quote.rate)}/{quote.period === 'daily' ? 'day' : quote.period === 'weekly' ? 'week' : 'month'}
                    <br />
                    Requested delivery: {day(quote.startDate)}, {deliveryTimeLabel(deliveryTime)}
                    <span className="block text-[12px] text-[#8A97A8]">The period starts on the day we deliver and install it.</span>
                  </dd>
                </div>
                <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4">
                  <dt className="text-[#8A97A8] mb-1 flex items-center justify-between">
                    Deliver to
                    <button type="button" onClick={() => go('address')} className="text-[12px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer">Change</button>
                  </dt>
                  {chosenAddress && (
                    <dd className="text-[#12263F]">
                      <span className="font-semibold">{chosenAddress.clinicHospitalName || chosenAddress.name}</span>
                      <br />
                      {chosenAddress.addressLine1}, {chosenAddress.city} – {chosenAddress.pincode}
                    </dd>
                  )}
                </div>
                {needsDocs && (
                  <div className="rounded-xl bg-[#F8FAFD] border border-[#E8EEF5] p-4 sm:col-span-2">
                    <dt className="text-[#8A97A8] mb-1 flex items-center justify-between">
                      Documents
                      <button type="button" onClick={() => go('documents')} className="text-[12px] font-semibold text-[#1D5FAF] hover:underline cursor-pointer">Change</button>
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {Object.values(docs).map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#DCE6F2] px-2.5 py-1 text-[12px] text-[#12263F]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> {d.label}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="rounded-xl border border-[#E8EEF5] p-4 text-[13px] text-[#5B6B82] space-y-1.5">
                <p className="font-semibold text-[#12263F]">What happens next</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>You pay {quote.advancePercent < 100 ? `the ${quote.advancePercent}% advance of ${inr(quote.payNow)}` : inr(quote.payNow)} now.</li>
                  {quote.depositMode === 'cheque' && (
                    <li>Keep a cheque of {inr(quote.depositByCheque)} ready for the refundable deposit — our team collects it before installation.</li>
                  )}
                  {needsDocs && <li>We verify your documents (usually within a few hours).</li>}
                  <li>We confirm the booking and reserve a sanitised, serial-numbered unit for you.</li>
                  {quote.balance > 0 && (
                    <li>
                      Pay the balance of {inr(quote.balance)} {quote.balanceDue === 'on_delivery' ? 'when the equipment is delivered' : 'from My Account → Rentals before dispatch'}.
                    </li>
                  )}
                  <li>We deliver and install it; the rental period starts on delivery.</li>
                </ol>
              </div>

              <label className="flex items-start gap-2.5 text-[13px] text-[#12263F] cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#1D5FAF]" />
                <span>
                  I agree to the{' '}
                  <Link href="/policies/rental-terms" target="_blank" className="font-semibold text-[#1D5FAF] hover:underline">rental terms</Link>
                  , including the refundable deposit, late-return fees and damage deductions.
                </span>
              </label>

              {payError && (
                <p className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-[13px] text-red-700" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {payError}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <button type="button" onClick={() => go(needsDocs ? 'documents' : 'address')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B6B82] hover:text-[#12263F] cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                {!quote.inStock && !pendingRental && (
                  <p className="text-[13px] text-red-700">All units are booked right now — this booking can&apos;t be placed.</p>
                )}
                <button
                  type="button"
                  disabled={!agree || paying || !chosenAddressId || !isPincodeServiceable || !docsComplete || (!quote.inStock && !pendingRental)}
                  onClick={placeBooking}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-7 py-3.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {paying ? 'Processing…' : `Pay ${inr(quote.payNow)} securely`}
                </button>
              </div>
              {pendingRental && (
                <p className="text-[12px] text-[#8A97A8] text-right">
                  Booking {pendingRental.rentalNumber} is saved.{' '}
                  <Link href={`/account/rentals/${pendingRental.id}`} className="font-semibold text-[#1D5FAF] hover:underline">View it in My Account</Link>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[#F1F5F9] animate-pulse" />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="bg-white rounded-2xl border border-[#DCE6F2] p-5 space-y-4 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-[#F6F9FD] border border-[#E8EEF5] relative overflow-hidden shrink-0">
              {draft.productImage && <Image src={draft.productImage} alt="" fill className="object-contain p-1.5" sizes="64px" referrerPolicy="no-referrer" />}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#12263F] line-clamp-2">{draft.productName}</p>
              <p className="text-[12px] text-[#5B6B82]">{quote ? quote.durationLabel : '…'}</p>
            </div>
          </div>
          {quote && (
            <div className="space-y-2 text-[13px] text-[#12263F] border-t border-[#E8EEF5] pt-3">
              <div className="flex justify-between"><span className="text-[#5B6B82]">Rent</span><span>{inr(quote.rent)}</span></div>
              {quote.delivery > 0 && <div className="flex justify-between"><span className="text-[#5B6B82]">Delivery &amp; pickup</span><span>{inr(quote.delivery)}</span></div>}
              {quote.gst > 0 && <div className="flex justify-between"><span className="text-[#5B6B82]">GST ({quote.gstRate}%)</span><span>{inr(quote.gst)}</span></div>}
              {quote.deposit > 0 && (
                <div className="flex justify-between font-semibold border-t border-[#E8EEF5] pt-2"><span>Rent &amp; charges</span><span>{inr(quote.total - quote.deposit)}</span></div>
              )}
              <DepositModeChooser
                compact
                deposit={quote.deposit}
                value={depositMode}
                disabled={Boolean(pendingRental)}
                onChange={(mode) => draft && setDraft({ ...draft, depositMode: mode })}
              />
              <div className="flex justify-between font-semibold border-t border-[#E8EEF5] pt-2">
                <span>{quote.depositMode === 'cheque' ? 'Total payable online' : 'Booking total'}</span>
                <span>{inr(quote.onlineTotal)}</span>
              </div>
              {quote.depositMode === 'cheque' && (
                <div className="flex justify-between text-[#5B6B82]"><span>+ Deposit by cheque</span><span>{inr(quote.depositByCheque)}</span></div>
              )}
              <div className="flex justify-between items-baseline rounded-xl bg-[#F3F8FE] border border-[#CFE0F5] px-3 py-2.5">
                <span className="font-bold">Pay now{quote.advancePercent < 100 ? ` (${quote.advancePercent}%)` : ''}</span>
                <span className="text-lg font-black text-[#1D5FAF]">{inr(quote.payNow)}</span>
              </div>
              {quote.balance > 0 && (
                <p className="text-[12px] text-[#5B6B82]">
                  Balance {inr(quote.balance)} {quote.balanceDue === 'on_delivery' ? 'payable on delivery' : 'due before dispatch'}.
                </p>
              )}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-[12px] text-[#5B6B82] border-t border-[#E8EEF5] pt-3">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Secure payment by Razorpay · deposit refunded after return
          </p>
          {chosenAddress && current !== 'address' && (
            <p className="flex items-start gap-1.5 text-[12px] text-[#5B6B82]">
              <MapPin className="w-4 h-4 text-[#1D5FAF] shrink-0" /> {chosenAddress.city} – {chosenAddress.pincode}
            </p>
          )}
          <Link href={`/rent/${draft.productSlug}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1D5FAF] hover:underline">
            <X className="w-3.5 h-3.5" /> Change plan or dates
          </Link>
        </aside>
      </div>

      {/* Modal Preview for Documents */}
      {modalPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalPreview(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#DCE6F2]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE6F2] bg-[#F6F9FD]">
              <h3 className="text-sm font-semibold text-[#12263F]">{modalPreview.title}</h3>
              <button
                type="button"
                onClick={() => setModalPreview(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5B6B82] hover:text-[#12263F] hover:bg-[#EAF2FC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] flex items-center justify-center overflow-auto bg-[#0F172A]/5">
              {modalPreview.isPdf ? (
                <iframe src={modalPreview.url} title={modalPreview.title} className="w-full h-[65vh] rounded-lg border border-[#DCE6F2]" />
              ) : (
                <img
                  src={modalPreview.url}
                  alt={modalPreview.title}
                  className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
                />
              )}
            </div>
            <div className="px-5 py-3 border-t border-[#DCE6F2] bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setModalPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
