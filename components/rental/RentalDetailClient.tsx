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

interface RentalDetailClientProps {
  product: Product;
}

export default function RentalDetailClient({ product }: RentalDetailClientProps) {
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
      message: `Proceeding to KYC verification and booking for ${product.name.slice(0, 30)}...`
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
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
        <span>/</span>
        <Link href="/rent" className="hover:text-[#FF6B00]">Rent Medical Equipment</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid: Gallery & Rental Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery & Specifications (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Gallery */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="relative w-full aspect-4/3 rounded-2xl bg-[#FBFBFB] overflow-hidden flex items-center justify-center p-4">
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                <span className="bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5" />
                  <span>Available on Rent</span>
                </span>
                <span className="bg-[#2B2B2B] text-white text-[10px] font-semibold px-2 py-0.5 rounded">
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
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-[#FBFBFB] transition-all cursor-pointer ${
                        activeImage === imgUrl ? 'border-[#0F766E] shadow-sm' : 'border-gray-200 hover:border-gray-300'
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {product.brandName} • {product.categoryName}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                {product.name}
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Key Clinical Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
                  <span>Clinical Highlights & Safety Features</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF6B00]" />
                  <span>Technical Specifications</span>
                </h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-3 p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}`}
                    >
                      <span className="font-bold text-gray-700 col-span-1">{key}</span>
                      <span className="text-gray-600 col-span-2">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Also Available to Buy Notice */}
            <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-gray-900">Prefer owning this equipment permanently?</span>
                <p className="text-gray-600">Buy brand new with full manufacturer warranty and GST invoice.</p>
              </div>
              <Link
                href={`/product/${product.slug}`}
                className="px-4 py-2 bg-[#2B2B2B] hover:bg-black text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-xs"
              >
                Buy for ₹{product.price.toLocaleString('en-IN')} →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Rental Plan Selector & Live Price Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-lg space-y-6 sticky top-24">
            {/* Header: Plan Selection */}
            <div className="space-y-1 border-b border-gray-100 pb-4">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#16A34A] font-bold">
                <Bed className="w-4 h-4" />
                <span>Pan-India Rental Program</span>
              </div>
              <h2 className="text-xl font-black text-gray-900">
                Configure Rental Plan
              </h2>
              <p className="text-xs text-gray-500">
                Select your required tenure, delivery date, and review transparent price breakdown.
              </p>
            </div>

            {/* 1. Plan Selector Tabs (Daily / Weekly / Monthly - show only plans that exist) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                1. Select Rental Billing Plan:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
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
                          ? 'bg-[#FF6B00] text-white shadow-sm'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <div>{label}</div>
                      <div className="text-[10px] opacity-90 mt-0.5">
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
                <label className="font-bold text-gray-800">
                  2. Duration ({planUnitLabel(activePlan.type)}):
                </label>
                <span className="text-gray-500 text-[11px]">
                  Min: {activePlan.minDuration} · Max: {activePlan.maxDuration} {planUnitLabel(activePlan.type)}
                </span>
              </div>

              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.max(activePlan.minDuration, d - 1))}
                  disabled={validDuration <= activePlan.minDuration}
                  className="px-4 py-2.5 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  -
                </button>
                <div className="flex-1 text-center font-black text-sm text-gray-900">
                  {validDuration} {planUnitLabel(activePlan.type)}
                </div>
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.min(maxDuration, d + 1))}
                  disabled={validDuration >= maxDuration}
                  className="px-4 py-2.5 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. Start Date Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                3. Desired Delivery / Start Date:
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={defaultStartDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                <span>Start: <strong>{startDate}</strong></span>
                <span>Calculated End: <strong>{calculatedEndDate}</strong></span>
              </div>
            </div>

            {/* 4. Pincode Serviceability Check */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Check Delivery PIN</span>
                </span>
                {pinResult && pinResult.serviceable && (
                  <span className="text-[10px] text-green-600 font-bold">
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
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6B00] font-semibold tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isCheckingPin}
                  className="px-4 py-2 bg-[#2B2B2B] hover:bg-black text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors"
                >
                  {isCheckingPin ? 'Checking...' : 'Verify'}
                </button>
              </form>
            </div>

            {/* 5. Live Price Breakdown */}
            <div className="space-y-3 pt-3 border-t border-gray-100 bg-[#F9F9F9] p-4 rounded-2xl border border-gray-200">
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Price Breakdown</span>
                <span className="text-[10px] text-green-700 bg-green-100/80 px-2 py-0.5 rounded font-bold">
                  Zero Maintenance
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-700">
                {/* Rent × Duration */}
                <div className="flex justify-between items-center">
                  <span>
                    Rental Charge ({validDuration} {planUnitLabel(activePlan.type)} × ₹{activePlan.price.toLocaleString('en-IN')})
                  </span>
                  <span className="font-bold text-gray-900">₹{rentAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Refundable Security Deposit */}
                <div className="flex justify-between items-center text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Refundable Security Deposit</span>
                  </div>
                  <span>₹{securityDeposit.toLocaleString('en-IN')}</span>
                </div>

                {/* Delivery & Pickup Charge */}
                <div className="flex justify-between items-center">
                  <span>Two-Way Sanitized Delivery & Return Pickup</span>
                  <span className="font-semibold text-gray-900">₹{deliveryPickupCharge.toLocaleString('en-IN')}</span>
                </div>

                {/* GST */}
                <div className="flex justify-between items-center text-gray-500">
                  <span>GST (12% on Rental Amount)</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Total Payable Now */}
                <div className="pt-2 border-t border-gray-300 flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-sm text-gray-900 block">Total Payable Now</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Includes ₹{securityDeposit.toLocaleString('en-IN')} 100% refundable deposit
                    </span>
                  </div>
                  <span className="font-black text-xl text-[#FF6B00]">
                    ₹{totalPayableNow.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Rent Now Action Button */}
            <button
              type="button"
              onClick={handleProceedToRentalCheckout}
              className="w-full py-4 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Bed className="w-4 h-4" />
              <span>Rent Now • ₹{totalPayableNow.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Assistance Helpline */}
            <div className="text-center pt-2">
              <a
                href="tel:+919811234567"
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#FF6B00] font-semibold"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Questions? Call our Clinical Rental Desk: +91 98112 34567</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* RENTAL TERMS ACCORDION */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF6B00]" />
            <span>Rental Agreement & Service Terms</span>
          </h3>
          <p className="text-xs text-gray-500">
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
              className="border border-gray-200 rounded-2xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenTerms(openTerms === i ? null : i)}
                className="w-full text-left px-5 py-3.5 font-bold text-xs sm:text-sm text-gray-900 bg-gray-50 hover:bg-gray-100 flex items-center justify-between gap-3 transition-colors"
              >
                <span>{term.title}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    openTerms === i ? 'rotate-180 text-[#FF6B00]' : ''
                  }`}
                />
              </button>
              {openTerms === i && (
                <div className="p-5 text-xs text-gray-600 leading-relaxed bg-white border-t border-gray-100">
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
