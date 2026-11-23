'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, RentalDepositMode, RentalPlanType, RentalQuote } from '@/types';
import DepositModeChooser from '@/components/rental/DepositModeChooser';
import { fetchRentalQuote, DELIVERY_TIME_SLOTS, deliveryTimeLabel, type DeliveryTimeSlot } from '@/lib/api/rentals';
import { errorMessage } from '@/lib/api/backend';
import { useRentalStore, useToastStore, usePincodeStore, useWishlistStore } from '@/lib/store';
import ProductGallery from '@/components/product/ProductGallery';
import { useHydrated } from '@/hooks/use-hydrated';
import { checkRentalPincodeServiceability as checkPincodeServiceability } from '@/lib/api';
import { getProductImageUrl, getProductImages } from '@/lib/utils';
import { 
  Bed, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  RotateCcw, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronDown, 
  ArrowRight, 
  PhoneCall, 
  MessageCircle, 
  Check, 
  AlertCircle, 
  Info,
  Layers,
  FileText
} from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/store';

interface RentalDetailClientProps {
  product: Product;
}

export default function RentalDetailClient({ product }: RentalDetailClientProps) {
  const { store, rental: rentalRules } = useSiteSettings();
  const router = useRouter();
  const { setDraft } = useRentalStore();
  const { addToast } = useToastStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const hydrated = useHydrated();
  const isFavorited = hydrated ? isInWishlist(product.id) : false;
  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: 'info', title: 'Link Copied', message: 'Rental product link copied to clipboard.' });
    }
  };
  const { pincode: storedPin, city: storedCity, deliveryDays: storedEstimate, setPincode } = usePincodeStore();

  // Image gallery state
  const [activeImage] = useState(getProductImageUrl(product.images?.[0] || product.thumbnail));

  // Available plans from product
  const plans = useMemo(() => {
    if (product.rentalPlans && product.rentalPlans.length > 0) {
      return product.rentalPlans;
    }
    // Fallback default plans if not specified
    return [
      { type: 'monthly' as RentalPlanType, price: product.rentPricePerMonth || 4500, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ];
  }, [product]);

  // Selected plan type
  const [selectedPlanType, setSelectedPlanType] = useState<RentalPlanType>((plans[0].type as RentalPlanType) || 'monthly');

  // The active plan
  const activePlan = useMemo(() => {
    return plans.find((p) => p.type === selectedPlanType) || plans[0];
  }, [plans, selectedPlanType]);

  const minDuration = activePlan.minDuration || 1;
  const maxDuration = activePlan.maxDuration || 12;

  // Duration in the active plan units (days, weeks, or months)
  const [duration, setDuration] = useState<number>(minDuration);

  // Update duration if activePlan changes and current duration is outside min/max
  const validDuration = Math.max(minDuration, Math.min(maxDuration, duration));

  // Start date — earliest allowed comes from admin → Settings → Rental ("earliest start")
  const [openedAt] = useState(() => Date.now());
  const earliestStart = useMemo(
    () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(openedAt + (rentalRules.minLeadDays || 0) * 86_400_000)),
    [openedAt, rentalRules.minLeadDays]
  );
  const [pickedStart, setStartDate] = useState<string>('');
  const startDate = pickedStart && pickedStart >= earliestStart ? pickedStart : earliestStart;
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTimeSlot>('10:00');

  // Live price from the API (GST, deposit, delivery and the advance % are all decided server-side)
  const [quote, setQuote] = useState<RentalQuote | null>(null);
  const [depositMode, setDepositMode] = useState<RentalDepositMode>('online');
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(true);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      setQuoting(true);
      fetchRentalQuote({ productSlug: product.slug, period: activePlan.type as 'daily' | 'weekly' | 'monthly', periods: validDuration, startDate, depositMode })
        .then((q) => {
          if (!alive) return;
          setQuote(q);
          setQuoteError('');
        })
        .catch((err) => alive && setQuoteError(errorMessage(err, 'Could not calculate the price. Please try again.')))
        .finally(() => alive && setQuoting(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [product.slug, activePlan.type, validDuration, startDate, depositMode]);

  const calculatedEndDate = quote?.endDate || '';
  const formatDay = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // Pincode checking state
  const [inputPincode, setInputPincode] = useState(storedPin || '');
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [pinResult, setPinResult] = useState<{
    serviceable: boolean;
    city?: string;
    deliveryDays?: string;
  } | null>(null);

  // Synchronize with storedPin when user sets location elsewhere or rehydrates
  useEffect(() => {
    if (storedPin) {
      setInputPincode(storedPin);
    }
  }, [storedPin]);

  // Automatically verify the PIN against the rental serviceable list
  useEffect(() => {
    const pin = (inputPincode || '').trim();
    if (/^[1-9]\d{5}$/.test(pin)) {
      let alive = true;
      checkPincodeServiceability(pin)
        .then((res) => {
          if (alive) setPinResult(res);
        })
        .catch(() => {
          if (alive) setPinResult({ serviceable: false, city: '', deliveryDays: '' });
        });
      return () => {
        alive = false;
      };
    } else {
      setPinResult(null);
    }
  }, [inputPincode]);

  // Accordion state
  const [openTerms, setOpenTerms] = useState<number | null>(0);

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = inputPincode.trim();
    if (!pin || pin.length !== 6 || !/^[1-9]\d{5}$/.test(pin)) {
      addToast({ type: 'error', title: 'Invalid PIN', message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }
    setIsCheckingPin(true);
    try {
      const res = await checkPincodeServiceability(pin);
      setPinResult(res);
      if (res.serviceable) {
        setPincode(pin, res.city, res.state, res.deliveryDays);
        addToast({
          type: 'success',
          title: 'Location Serviceable',
          message: `Delivery & installation available in ${res.city}: ${res.deliveryDays}`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Not Serviceable',
          message: 'Doorstep biomedical setup is currently not available for this pincode.',
        });
      }
    } catch {
      setPinResult({ serviceable: false, city: '', deliveryDays: '' });
      addToast({
        type: 'error',
        title: 'Not Serviceable',
        message: 'Doorstep biomedical setup is currently not available for this pincode.',
      });
    } finally {
      setIsCheckingPin(false);
    }
  };

  const handleProceedToRentalCheckout = () => {
    if (!quote) return;
    if (pinResult && !pinResult.serviceable) {
      addToast({
        type: 'error',
        title: 'Location Not Serviceable',
        message: 'Doorstep biomedical setup is currently not available for this pincode. Please enter a serviceable PIN code to proceed.',
      });
      return;
    }
    setDraft({
      productSlug: product.slug,
      productName: product.name,
      productImage: activeImage,
      period: activePlan.type as 'daily' | 'weekly' | 'monthly',
      periods: validDuration,
      startDate,
      deliveryTime,
      depositMode,
    });
    router.push('/rent/checkout');
  };

  const planUnitLabel = (type?: RentalPlanType) => {
    switch (type) {
      case 'daily':
        return 'Day(s)';
      case 'weekly':
        return 'Week(s)';
      case 'monthly':
      default:
        return 'Month(s)';
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#5B6B82] font-medium">
        <Link href="/" className="hover:text-[#1D5FAF]">Home</Link>
        <span>/</span>
        <Link href="/rent" className="hover:text-[#1D5FAF]">Rent Medical Equipment</Link>
        <span>/</span>
        <span className="text-[#12263F] font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid: Gallery & Rental Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] gap-6 xl:gap-8 items-start">
        {/* Left Column: Gallery & Specifications (7 cols) */}
        <div className="space-y-6">
          {/* Main Photo Gallery (shared with product page) */}
          <ProductGallery
            images={getProductImages(product)}
            productName={product.name}
            badges={[{ text: 'AVAILABLE ON RENT', type: 'deal' }]}
            isWishlisted={isFavorited}
            onToggleWishlist={() => toggleWishlist(product)}
            onShare={handleShare}
          />

          {/* Product Description & Specs */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#5B6B82] uppercase tracking-wider">
                {product.brandName} • {product.categoryName}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#12263F] leading-snug">
                {product.name}
              </h1>
              {/<[a-z][\s\S]*>/i.test(product.description || '') ? (
                <div
                  className="text-xs text-[#5B6B82] leading-relaxed rich-description"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              ) : (
                <p className="text-xs text-[#5B6B82] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              )}
            </div>

            {/* Key Clinical Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#DCE6F2]">
                <h3 className="font-bold text-sm text-[#12263F] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1D5FAF]" />
                  <span>Clinical Highlights & Safety Features</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#12263F] bg-[#F6F9FD] p-2.5 rounded-xl border border-[#DCE6F2]">
                      <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#DCE6F2]">
                <h3 className="font-bold text-sm text-[#12263F] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1D5FAF]" />
                  <span>Technical Specifications</span>
                </h3>
                <div className="border border-[#DCE6F2] rounded-2xl overflow-hidden divide-y divide-[#DCE6F2] text-xs">
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-3 p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F6F9FD]'}`}
                    >
                      <span className="font-bold text-[#12263F] col-span-1">{key}</span>
                      <span className="text-[#5B6B82] col-span-2">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Also Available to Buy Notice */}
            <div className="p-4 bg-[#EAF2FC] rounded-2xl border border-[#DCE6F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-[#12263F]">Prefer owning this equipment permanently?</span>
                <p className="text-[#5B6B82]">Buy brand new with full manufacturer warranty and GST invoice.</p>
              </div>
              <Link
                href={`/product/${product.slug}`}
                className="px-4 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-xs"
              >
                Buy for ₹{product.price.toLocaleString('en-IN')} →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Rental Plan Selector & Live Price Breakdown (5 cols) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DCE6F2] shadow-lg space-y-6 sticky top-24">
            {/* Header: Plan Selection */}
            <div className="space-y-1 border-b border-[#DCE6F2] pb-4">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#174E90] font-bold">
                <Bed className="w-4 h-4 text-[#1D5FAF]" />
                <span>Pan-India Rental Program</span>
              </div>
              <h2 className="text-xl font-black text-[#12263F]">
                Configure Rental Plan
              </h2>
              <p className="text-xs text-[#5B6B82]">
                Select your required tenure, delivery date, and review transparent price breakdown.
              </p>
            </div>

            {/* 1. Plan Selector Tabs (Daily / Weekly / Monthly - show only plans that exist) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#12263F]">
                1. Select Rental Billing Plan:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#F6F9FD] border border-[#DCE6F2] rounded-2xl">
                {plans.map((p, idx) => {
                  const planType = (p.type || 'monthly') as RentalPlanType;
                  const isSelected = selectedPlanType === planType;
                  const label = planType.charAt(0).toUpperCase() + planType.slice(1);
                  const price = p.price ?? p.pricePerMonth ?? 0;
                  return (
                    <button
                      key={p.type || idx}
                      type="button"
                      onClick={() => {
                        setSelectedPlanType(planType);
                        setDuration(p.minDuration || 1);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-[#1D5FAF] text-white shadow-sm'
                          : 'text-[#12263F] hover:text-[#1D5FAF] hover:bg-[#EAF2FC]'
                      }`}
                    >
                      <div>{label}</div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        ₹{price.toLocaleString('en-IN')}/{planType === 'daily' ? 'day' : planType === 'weekly' ? 'wk' : 'mo'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Duration Stepper limited by min/max */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-[#12263F]">
                  2. Duration ({planUnitLabel(activePlan.type)}):
                </label>
                <span className="text-[#5B6B82] text-[12px]">
                  Min: {activePlan.minDuration} · Max: {activePlan.maxDuration} {planUnitLabel(activePlan.type)}
                </span>
              </div>

              <div className="flex items-center border border-[#DCE6F2] rounded-xl overflow-hidden bg-[#F6F9FD]">
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.max(activePlan.minDuration, d - 1))}
                  disabled={validDuration <= activePlan.minDuration}
                  className="px-4 py-2.5 hover:bg-[#EAF2FC] text-[#12263F] font-bold transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  -
                </button>
                <div className="flex-1 text-center font-black text-sm text-[#12263F]">
                  {validDuration} {planUnitLabel(activePlan.type)}
                </div>
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.min(maxDuration, d + 1))}
                  disabled={validDuration >= maxDuration}
                  className="px-4 py-2.5 hover:bg-[#EAF2FC] text-[#12263F] font-bold transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. Start Date Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#12263F]">
                3. Desired Delivery / Start Date &amp; Time:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
                <input
                  type="date"
                  aria-label="Delivery date"
                  min={earliestStart}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#DCE6F2] text-[#12263F] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF]"
                />
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1D5FAF] pointer-events-none" />
                  <select
                    aria-label="Delivery time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value as DeliveryTimeSlot)}
                    className="w-full appearance-none text-xs font-semibold pl-8 pr-8 py-2.5 border border-[#DCE6F2] text-[#12263F] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF] cursor-pointer"
                  >
                    {DELIVERY_TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{deliveryTimeLabel(t)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5B6B82] pointer-events-none" />
                </div>
              </div>
              <p className="text-[11px] text-[#5B6B82] px-1">Delivery &amp; installation between 10 AM and 4 PM.</p>
              <div className="flex items-center justify-between text-[12px] text-[#5B6B82] px-1">
                <span>From <strong>{formatDay(startDate)}, {deliveryTimeLabel(deliveryTime)}</strong></span>
                <span>Return by <strong>{calculatedEndDate ? formatDay(calculatedEndDate) : '…'}</strong></span>
              </div>
            </div>

            {/* 4. Pincode Serviceability Check */}
            <div className="space-y-2 pt-2 border-t border-[#DCE6F2]">
              <div className="flex items-center justify-between text-xs font-bold text-[#12263F]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1D5FAF]" />
                  <span>Check Delivery PIN</span>
                </span>
                {pinResult && pinResult.serviceable && (
                  <span className="text-[11px] text-[#16A34A] font-bold">
                    ✓ Available in {pinResult.city || inputPincode}
                  </span>
                )}
                {pinResult && !pinResult.serviceable && (
                  <span className="text-[11px] text-red-600 font-bold">
                    ✕ Not serviceable
                  </span>
                )}
              </div>

              <form onSubmit={handlePincodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputPincode}
                  onChange={(e) => {
                    setInputPincode(e.target.value.replace(/\D/g, ''));
                    setPinResult(null);
                  }}
                  placeholder="6-Digit PIN"
                  className="flex-1 text-xs px-3 py-2 border border-[#DCE6F2] text-[#12263F] rounded-xl focus:outline-none focus:border-[#1D5FAF] font-semibold tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isCheckingPin || inputPincode.trim().length !== 6}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors"
                >
                  {isCheckingPin ? 'Checking...' : 'Verify'}
                </button>
              </form>
              {pinResult && !pinResult.serviceable && (
                <p className="text-[11px] text-red-600 font-medium">
                  Doorstep biomedical delivery &amp; setup is currently not available for PIN {inputPincode}.
                </p>
              )}
            </div>

            {/* 5. Live Price Breakdown (from the API) */}
            <div className="space-y-3 bg-[#F6F9FD] p-4 rounded-2xl border border-[#DCE6F2]" aria-live="polite" aria-busy={quoting}>
              <div className="text-xs font-bold text-[#12263F] uppercase tracking-wider flex items-center justify-between">
                <span>Price Breakdown</span>
                {quoting && <span className="text-[11px] font-semibold normal-case text-[#5B6B82]">Updating…</span>}
              </div>

              {quoteError ? (
                <p className="flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {quoteError}
                </p>
              ) : !quote ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-4 rounded bg-[#E2E8F0] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className={`space-y-2 text-xs text-[#12263F] transition-opacity ${quoting ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span>Rent ({quote.durationLabel} × {inr(quote.rate)})</span>
                    <span className="font-bold">{inr(quote.rent)}</span>
                  </div>
                  {quote.delivery > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Delivery, installation &amp; pickup</span>
                      <span className="font-semibold">{inr(quote.delivery)}</span>
                    </div>
                  )}
                  {quote.gst > 0 && (
                    <div className="flex justify-between items-center text-[#5B6B82]">
                      <span>GST ({quote.gstRate}% on rent &amp; delivery)</span>
                      <span>{inr(quote.gst)}</span>
                    </div>
                  )}
                  {quote.deposit > 0 && (
                    <div className="pt-2 border-t border-[#DCE6F2] flex justify-between items-baseline">
                      <span className="font-bold">Rent &amp; charges</span>
                      <span className="font-bold">{inr(quote.total - quote.deposit)}</span>
                    </div>
                  )}
                  <DepositModeChooser deposit={quote.deposit} value={depositMode} onChange={setDepositMode} />
                  <div className="pt-2 border-t border-[#DCE6F2] flex justify-between items-baseline">
                    <span className="font-bold">{quote.depositMode === 'cheque' ? 'Total payable online' : 'Booking total'}</span>
                    <span className="font-bold">{inr(quote.onlineTotal)}</span>
                  </div>
                  {quote.depositMode === 'cheque' && (
                    <div className="flex justify-between items-baseline text-[#5B6B82]">
                      <span>+ Deposit by cheque</span>
                      <span>{inr(quote.depositByCheque)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline rounded-xl bg-white border border-[#CFE0F5] px-3 py-2.5">
                    <div>
                      <span className="font-black text-sm block">Pay now{quote.advancePercent < 100 ? ` (${quote.advancePercent}% advance)` : ''}</span>
                      {quote.balance > 0 && (
                        <span className="text-[11px] text-[#5B6B82]">
                          Balance {inr(quote.balance)} {quote.balanceDue === 'on_delivery' ? 'payable on delivery' : 'due before dispatch'}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-xl text-[#1D5FAF]">{inr(quote.payNow)}</span>
                  </div>
                  {rentalRules.lateFeePerDay > 0 && (
                    <p className="text-[11px] text-[#5B6B82]">
                      Late return: {inr(rentalRules.lateFeePerDay)}/day
                      {rentalRules.gracePeriodDays > 0 ? ` after ${rentalRules.gracePeriodDays} grace day${rentalRules.gracePeriodDays === 1 ? '' : 's'}` : ''}, deducted from the deposit.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Documents needed */}
            {quote?.kyc.required && (
              <div className="rounded-2xl border border-[#F28C38]/30 bg-[#FFF7EF] p-4 text-xs text-[#12263F] space-y-1.5">
                <p className="flex items-center gap-1.5 font-bold">
                  <FileText className="w-4 h-4 text-[#F28C38]" /> Documents needed at checkout
                </p>
                <ul className="list-disc pl-5 text-[#5B6B82] space-y-0.5">
                  {quote.kyc.documents.map((d) => (
                    <li key={d.key}>
                      <span className="text-[#12263F] font-semibold">{d.label}</span> — {d.hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quote && !quote.inStock && (
              <p className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                All units of this equipment are booked right now. Call us on {store.supportPhone} and we&apos;ll tell you when one is free.
              </p>
            )}

            {/* Rent Now Action Button */}
            <button
              type="button"
              onClick={handleProceedToRentalCheckout}
              disabled={!quote || quoting || Boolean(quoteError) || !quote.inStock || Boolean(pinResult && !pinResult.serviceable)}
              className="w-full py-4 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#1D5FAF]/20 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Bed className="w-4 h-4" />
              <span>{!quote ? 'Calculating price…' : !quote.inStock ? 'Currently unavailable' : `Book now • Pay ${inr(quote.payNow)}`}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Assistance Helpline */}
            <div className="text-center pt-2">
              <a
                href={store.supportPhoneHref}
                className="inline-flex items-center gap-1.5 text-xs text-[#5B6B82] hover:text-[#1D5FAF] font-semibold"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#1D5FAF]" />
                <span>Questions? Call our Clinical Rental Desk: {store.supportPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* RENTAL TERMS ACCORDION */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DCE6F2] shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-[#12263F] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1D5FAF]" />
            <span>Rental Agreement & Service Terms</span>
          </h3>
          <p className="text-xs text-[#5B6B82]">
            Transparent policies governing equipment security deposits, free maintenance, and returns
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            {
              title: '1. 100% Refundable Security Deposit Policy',
              content:
                'The security deposit is held in a dedicated client escrow account during your active rental duration. When the rental expires or you initiate a return, our biomedical logistics partner collects the device, conducts an immediate functional check, and issues an inspection report. 100% of your deposit is refunded directly to your original payment method within 48 to 72 business hours.'
            },
            {
              title: '2. Zero Maintenance & Free Emergency Standby Replacement',
              content:
                'All equipment comes with comprehensive maintenance coverage. If any device experiences a technical breakdown, error code, or pressure drop, our biomedical service network provides an on-site engineer visit or delivers a calibrated standby replacement unit within 4 to 6 hours at zero extra charge.'
            },
            {
              title: '3. Easy Tenure Extensions & Early Returns',
              content:
                'Need the equipment for another month? You can extend your rental anytime from your Account → My Rentals dashboard by paying the prorated monthly charge with zero penalty. If a patient recovers early, you can schedule a return pickup and receive deposit return without complicated lock-in clauses.'
            },
            {
              title: '4. Biomedical Sanitization & Hygiene Standards',
              content:
                'Every device is sterilized following strict hospital infection control protocols (EN 13060). All accessories (oxygen cannulas, masks, tubing, and filters) are 100% brand new, single-patient sterile packaged units that you keep permanently.'
            }
          ].map((term, i) => (
            <div
              key={i}
              className="border border-[#DCE6F2] rounded-2xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenTerms(openTerms === i ? null : i)}
                className="w-full text-left px-5 py-3.5 font-bold text-xs sm:text-sm text-[#12263F] bg-[#F6F9FD] hover:bg-[#EAF2FC] flex items-center justify-between gap-3 transition-colors"
              >
                <span>{term.title}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#5B6B82] transition-transform ${
                    openTerms === i ? 'rotate-180 text-[#1D5FAF]' : ''
                  }`}
                />
              </button>
              {openTerms === i && (
                <div className="p-5 text-xs text-[#5B6B82] leading-relaxed bg-white border-t border-[#DCE6F2]">
                  {term.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
