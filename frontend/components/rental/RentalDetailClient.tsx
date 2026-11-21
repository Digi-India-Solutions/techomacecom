'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, RentalPlan, RentalPlanType } from '@/types';
import { useRentalStore, useToastStore, usePincodeStore } from '@/lib/store';
import { checkPincodeServiceability } from '@/lib/api';
import { getProductImageUrl } from '@/lib/utils';
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
  const { pincode: storedPin, city: storedCity, deliveryDays: storedEstimate, setPincode } = usePincodeStore();

  // Image gallery state
  const [activeImage, setActiveImage] = useState(getProductImageUrl(product.images?.[0] || product.thumbnail));

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

  // Start date (defaults to tomorrow)
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);

  // Calculated End Date
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    const d = new Date(startDate);
    if (activePlan.type === 'daily') {
      d.setDate(d.getDate() + validDuration);
    } else if (activePlan.type === 'weekly') {
      d.setDate(d.getDate() + validDuration * 7);
    } else {
      d.setMonth(d.getMonth() + validDuration);
    }
    return d.toISOString().split('T')[0];
  }, [startDate, activePlan.type, validDuration]);

  // Pricing breakdown calculations
  const rentAmount = (activePlan.price ?? activePlan.pricePerMonth ?? 1000) * validDuration;
  const securityDeposit = product.securityDeposit || 10000;
  const deliveryPickupCharge = product.deliveryPickupCharge || 500;
  const gstAmount = Math.round(rentAmount * 0.12);
  const totalPayableNow = rentAmount + securityDeposit + deliveryPickupCharge + gstAmount;

  // Pincode checking state
  const [inputPincode, setInputPincode] = useState(storedPin || '110001');
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [pinResult, setPinResult] = useState<{
    serviceable: boolean;
    city?: string;
    deliveryDays?: string;
  } | null>(
    storedPin ? { serviceable: true, city: storedCity, deliveryDays: storedEstimate } : null
  );

  // Accordion state
  const [openTerms, setOpenTerms] = useState<number | null>(0);

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPincode || inputPincode.trim().length !== 6) {
      addToast({ type: 'error', title: 'Invalid PIN', message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }
    setIsCheckingPin(true);
    try {
      const res = await checkPincodeServiceability(inputPincode.trim());
      setPinResult(res);
      if (res.serviceable) {
        setPincode(inputPincode.trim(), res.city, res.state, res.deliveryDays);
        addToast({
          type: 'success',
          title: 'Location Serviceable',
          message: `Delivery & installation available in ${res.city}: ${res.deliveryDays}`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Not Serviceable',
          message: 'Doorstep biomedical setup is currently not available for this pincode.'
        });
      }
    } finally {
      setIsCheckingPin(false);
    }
  };

  const handleProceedToRentalCheckout = () => {
    // Save draft into useRentalStore
    setDraft({
      product,
      plan: activePlan,
      duration: validDuration,
      startDate,
      endDate: calculatedEndDate,
      deposit: securityDeposit,
      rentAmount,
      deliveryPickupCharge,
      gstAmount,
      totalPayable: totalPayableNow
    });

    addToast({
      type: 'info',
      title: 'Rental Plan Configured',
      message: `Proceeding to booking for ${product.name.slice(0, 30)}...`
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery & Specifications (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Gallery */}
          <div className="bg-white rounded-3xl p-6 border border-[#DCE6F2] shadow-xs space-y-4">
            <div className="relative w-full aspect-4/3 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-4">
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                <span className="bg-[#1D5FAF] text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5" />
                  <span>Available on Rent</span>
                </span>
                <span className="bg-[#0B2545] text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                  SKU: {product.sku}
                </span>
              </div>

              <div className="relative w-full h-full">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Thumbnail Row */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => {
                  const imgUrl = typeof img === 'string' ? img : img.url;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-white transition-all cursor-pointer ${
                        activeImage === imgUrl ? 'border-[#1D5FAF] shadow-sm' : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        className="object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Description & Specs */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#5B6B82] uppercase tracking-wider">
                {product.brandName} • {product.categoryName}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#12263F] leading-snug">
                {product.name}
              </h1>
              <p className="text-xs text-[#5B6B82] leading-relaxed">
                {product.description}
              </p>
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
        <div className="lg:col-span-5 space-y-6">
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
                3. Desired Delivery / Start Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={defaultStartDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-[#DCE6F2] text-[#12263F] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF]"
                />
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#5B6B82] px-1">
                <span>Start: <strong>{startDate}</strong></span>
                <span>Calculated End: <strong>{calculatedEndDate}</strong></span>
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
                    ✓ Available in {pinResult.city}
                  </span>
                )}
              </div>

              <form onSubmit={handlePincodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputPincode}
                  onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit PIN"
                  className="flex-1 text-xs px-3 py-2 border border-[#DCE6F2] text-[#12263F] rounded-xl focus:outline-none focus:border-[#1D5FAF] font-semibold tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isCheckingPin}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors"
                >
                  {isCheckingPin ? 'Checking...' : 'Verify'}
                </button>
              </form>
            </div>

            {/* 5. Live Price Breakdown */}
            <div className="space-y-3 pt-3 border-t border-[#DCE6F2] bg-[#F6F9FD] p-4 rounded-2xl border border-[#DCE6F2]">
              <div className="text-xs font-bold text-[#12263F] uppercase tracking-wider flex items-center justify-between">
                <span>Price Breakdown</span>
                <span className="text-[11px] text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded font-bold">
                  Zero Maintenance
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#12263F]">
                {/* Rent × Duration */}
                <div className="flex justify-between items-center">
                  <span>
                    Rental Charge ({validDuration} {planUnitLabel(activePlan.type)} × ₹{activePlan.price.toLocaleString('en-IN')})
                  </span>
                  <span className="font-bold text-[#12263F]">₹{rentAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Refundable Security Deposit */}
                <div className="flex justify-between items-center text-[#16A34A] font-semibold bg-[#16A34A]/5 p-2 rounded-lg border border-[#16A34A]/20">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>Refundable Security Deposit</span>
                  </div>
                  <span>₹{securityDeposit.toLocaleString('en-IN')}</span>
                </div>

                {/* Delivery & Pickup Charge */}
                <div className="flex justify-between items-center">
                  <span>Two-Way Sanitized Delivery & Return Pickup</span>
                  <span className="font-semibold text-[#12263F]">₹{deliveryPickupCharge.toLocaleString('en-IN')}</span>
                </div>

                {/* GST */}
                <div className="flex justify-between items-center text-[#5B6B82]">
                  <span>GST (12% on Rental Amount)</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Total Payable Now */}
                <div className="pt-2 border-t border-[#DCE6F2] flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-sm text-[#12263F] block">Total Payable Now</span>
                    <span className="text-[11px] text-[#5B6B82] font-normal">
                      Includes ₹{securityDeposit.toLocaleString('en-IN')} 100% refundable deposit
                    </span>
                    {rentalRules.lateFeePerDay > 0 && (
                      <span className="text-[11px] text-[#5B6B82] font-normal block">
                        Late return: ₹{rentalRules.lateFeePerDay.toLocaleString('en-IN')}/day
                        {rentalRules.gracePeriodDays > 0 ? ` after ${rentalRules.gracePeriodDays} grace day${rentalRules.gracePeriodDays === 1 ? '' : 's'}` : ''}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-xl text-[#1D5FAF]">
                    ₹{totalPayableNow.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Rent Now Action Button */}
            <button
              type="button"
              onClick={handleProceedToRentalCheckout}
              className="w-full py-4 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#1D5FAF]/20 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Bed className="w-4 h-4" />
              <span>Rent Now • ₹{totalPayableNow.toLocaleString('en-IN')}</span>
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
