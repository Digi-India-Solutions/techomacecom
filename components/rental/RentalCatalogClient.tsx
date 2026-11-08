'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { getProductImageUrl } from '@/lib/utils';
import { 
  Bed, 
  Wind, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  MessageCircle, 
  PhoneCall, 
  RotateCcw, 
  HelpCircle, 
  ChevronDown, 
  Sparkles,
  Truck,
  HeartHandshake,
  Check,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { useToastStore } from '@/lib/store';

interface RentalCatalogClientProps {
  products: Product[];
}

export const RENTAL_CATEGORIES = [
  { id: 'all', name: 'All Equipment', icon: Layers, count: 8 },
  { id: 'oxygen', name: 'Oxygen Concentrator', icon: Wind, query: 'Oxygen Concentrator' },
  { id: 'portable-oxygen', name: 'Portable Oxygen Concentrator', icon: Wind, query: 'Portable Oxygen' },
  { id: 'cpap', name: 'CPAP', icon: Activity, query: 'CPAP' },
  { id: 'bipap', name: 'BiPAP', icon: Activity, query: 'BiPAP' },
  { id: 'hospital-bed', name: 'Hospital Bed', icon: Bed, query: 'Hospital Bed' },
  { id: 'wheelchair', name: 'Wheelchair', icon: Activity, query: 'Wheelchair' },
  { id: 'patient-monitor', name: 'Patient Monitor', icon: Activity, query: 'Monitor' },
  { id: 'suction', name: 'Suction Machine', icon: Wind, query: 'Suction' },
];

const FAQS = [
  {
    q: 'How does the refundable security deposit work?',
    a: 'Every rental item requires a one-time refundable security deposit. When you schedule a return and our logistics team inspects the equipment for operational intactness, 100% of your deposit is credited back to your original payment method (bank account or card) within 48 to 72 business hours.'
  },
  {
    q: 'What KYC documents are required to rent medical equipment?',
    a: 'Under Indian medical safety norms, we require a government ID proof (Aadhaar Card, Passport, or Voter ID), an address proof (electricity bill, rent agreement, or hospital registration), and a doctor’s prescription (mandatory for high-pressure oxygen, CPAP, and BiPAP devices).'
  },
  {
    q: 'How are equipment sanitized before delivery?',
    a: 'All returned equipment undergo hospital-grade 7-step sanitization and biomedical calibration. High-touch surfaces and internal tubing chambers are sterilized using medical autoclaves and virucidal disinfectant solutions, and devices are vacuum-sealed in sterile medical polythene before dispatch.'
  },
  {
    q: 'Can I extend my rental tenure if the patient needs it longer?',
    a: 'Yes, absolutely. You can extend your rental anytime from your Account → My Rentals dashboard with 1 click. Simply choose the additional duration (days, weeks, or months), pay the prorated rent, and the contract updates instantly with zero interruption in equipment usage.'
  },
  {
    q: 'Is installation and demo provided at my doorstep?',
    a: 'Yes. In Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, and 40+ major Indian cities, our certified biomedical engineers deliver, unbox, install, and demonstrate how to operate the machine, set alarms, and replace humidifiers/filters.'
  },
  {
    q: 'What if the machine malfunctions or throws an error during the rental period?',
    a: 'We provide 100% free repair, preventive maintenance, and emergency replacement. If an oxygen concentrator or BiPAP experiences a technical issue, our team provides an on-site technician or a standby replacement unit within 4 to 6 hours.'
  }
];

export default function RentalCatalogClient({ products }: RentalCatalogClientProps) {
  const { addToast } = useToastStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackEquipment, setCallbackEquipment] = useState('Oxygen Concentrator');
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);

  // Filter products by category
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    const cat = RENTAL_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!cat || !cat.query) return true;
    const query = cat.query.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.subCategory.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query)
    );
  });

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone || callbackPhone.length < 10) {
      addToast({ type: 'error', title: 'Invalid Phone', message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setCallbackSubmitted(true);
    addToast({
      type: 'success',
      title: 'Callback Scheduled',
      message: 'Our clinical rental specialist will call you within 15 minutes.'
    });
    setTimeout(() => {
      setIsCallbackOpen(false);
      setCallbackSubmitted(false);
      setCallbackName('');
      setCallbackPhone('');
    }, 2000);
  };

  return (
    <div className="space-y-12">
      {/* 1. HERO BANNER */}
      <section className="relative rounded-3xl bg-[#1E293B] text-white p-6 sm:p-12 overflow-hidden shadow-2xl border border-slate-700">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-[#1E293B]/95 to-slate-900/80 z-0" />
        
        {/* Background visual image */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-20 mix-blend-luminosity z-0">
          <Image
            src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80"
            alt="Medical Equipment Rental"
            fill
            className="object-cover"
            priority
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold uppercase tracking-wider font-heading">
            <Bed className="w-3.5 h-3.5" />
            <span>Pan-India Clinical Rentals</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-heading">
            Rent Medical Equipment <br />
            <span className="text-teal-300">Anywhere in India.</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl">
            Hospital-grade ICU beds, Philips oxygen concentrators, ResMed CPAP/BiPAP, motorized wheelchairs, and suction machines delivered sanitized with free on-site demo, zero maintenance costs, and 100% refundable deposits.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="#equipment-catalog"
              className="px-6 py-3.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-teal-900/30 active:scale-98 flex items-center gap-2 font-heading"
            >
              <span>Browse Rental Equipment</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsCallbackOpen(true)}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl backdrop-blur-md transition-all border border-white/20 flex items-center gap-2 font-heading"
            >
              <PhoneCall className="w-4 h-4 text-teal-300" />
              <span>Request Fast Callback</span>
            </button>

            <a
              href="https://wa.me/919811234567?text=Hello%20Buy%20Denmed,%20I%20would%20like%20to%20inquire%20about%20medical%20equipment%20rental."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Rental Desk</span>
            </a>
          </div>

          {/* Key Quick Facts */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <span>100% Sanitized Units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <span>Refundable Deposit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <span>Free Doorstep Demo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <span>Zero Repair AMC</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFITS STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            icon: ShieldCheck,
            title: 'Sanitised Equipment',
            desc: '7-step hospital sterilization protocol & vacuum sealed'
          },
          {
            icon: RotateCcw,
            title: 'Refundable Deposit',
            desc: '100% returned to your account within 48h of return'
          },
          {
            icon: Truck,
            title: 'Free Installation Demo',
            desc: 'Doorstep setup & training by certified biomedical engineers'
          },
          {
            icon: Clock,
            title: 'Easy Extension',
            desc: '1-click duration extension from your account dashboard'
          }
        ].map((b, i) => {
          const Icon = b.icon;
          return (
            <div
              key={i}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900">{b.title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. RENTAL CATEGORIES GRID */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              Browse Rental Categories
            </h2>
            <p className="text-xs text-gray-500 font-body">
              Select an equipment category to filter instant rental plans across India
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {filteredProducts.length} Equipment Available
          </span>
        </div>

        {/* Categories Pills / Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {RENTAL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'border-[#0F766E] bg-teal-50 text-[#0F766E] shadow-xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0F766E]' : 'text-gray-400'}`} />
                <span className="text-[11px] font-bold line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. RENTAL PRODUCTS GRID */}
      <section id="equipment-catalog" className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Available Equipment for Rent
          </h2>
          <span className="text-xs text-teal-800 font-bold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-heading">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Same-Day Dispatch in Metro Cities
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const primaryPlan = product.rentalPlans?.[0] || {
              type: 'monthly',
              price: product.rentPricePerMonth || 4500,
              minDuration: 1,
              maxDuration: 12
            };
            const deposit = product.securityDeposit || 10000;
            const dailyRate = product.rentalPlans?.find((p) => p.type === 'daily')?.price;
            const weeklyRate = product.rentalPlans?.find((p) => p.type === 'weekly')?.price;
            const monthlyRate = product.rentalPlans?.find((p) => p.type === 'monthly')?.price || product.rentPricePerMonth;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-[#0F766E]/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative w-full aspect-square bg-[#FBFBFB] p-4 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                      <span className="bg-[#0F766E] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs font-heading">
                        Available on Rent
                      </span>
                      {product.rentalKycRequired && (
                        <span className="bg-slate-700 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded font-heading">
                          KYC Required
                        </span>
                      )}
                    </div>

                    <div className="relative w-full h-full">
                      <Image
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-heading">
                      {product.brandName}
                    </div>

                    <Link
                      href={`/rent/${product.slug}`}
                      className="font-bold text-sm text-gray-900 group-hover:text-[#0F766E] transition-colors line-clamp-2 leading-snug font-heading"
                    >
                      {product.name}
                    </Link>

                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-body">
                      {product.shortDescription}
                    </p>

                    {/* Rental Rates Preview */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-[11px]">
                      {dailyRate && (
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-700 font-body">
                          <span className="font-bold text-gray-900">₹{dailyRate}</span>/day
                        </div>
                      )}
                      {weeklyRate && (
                        <div className="bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-700 font-body">
                          <span className="font-bold text-gray-900">₹{weeklyRate.toLocaleString('en-IN')}</span>/week
                        </div>
                      )}
                      {monthlyRate && (
                        <div className="bg-teal-50 px-2 py-1 rounded border border-teal-200 text-[#0F766E] font-body">
                          <span className="font-bold">₹{monthlyRate.toLocaleString('en-IN')}</span>/month
                        </div>
                      )}
                    </div>

                    {/* Refundable Deposit Notice */}
                    <div className="text-[11px] text-emerald-700 bg-emerald-50/70 p-2 rounded-lg flex items-center gap-1.5 border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Security Deposit: <strong>₹{deposit.toLocaleString('en-IN')}</strong> (100% Refundable)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/rent/${product.slug}`}
                    className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 font-heading"
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Configure & Rent Now</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. "HOW RENTING WORKS" 4 STEPS */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <div className="text-xs font-bold text-[#0F766E] uppercase tracking-widest font-heading">
            Hassle-Free Process
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-heading">
            How Renting Works in 4 Simple Steps
          </h2>
          <p className="text-xs text-gray-500 font-body">
            From patient diagnosis to doorstep biomedical setup in under 24 hours
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Choose Equipment',
              desc: 'Select from our certified catalog of oxygen, sleep therapy, ICU beds, wheelchairs, and monitors.',
              icon: Layers
            },
            {
              step: '02',
              title: 'Select Plan & Dates',
              desc: 'Choose daily, weekly, or monthly tenure. View live pricing with transparent refundable deposit.',
              icon: Calendar
            },
            {
              step: '03',
              title: 'Upload KYC & Pay',
              desc: 'Provide basic ID and clinic/address proof, then pay rent + refundable deposit securely via Razorpay.',
              icon: FileCheck
            },
            {
              step: '04',
              title: 'Doorstep Setup & Demo',
              desc: 'Biomedical engineer delivers sanitized machine, performs calibration check, and trains family/staff.',
              icon: Truck
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative bg-[#F9F9F9] p-6 rounded-2xl border border-gray-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-gray-300 font-heading">{item.step}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 font-heading">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-body">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FAQS ACCORDION */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#0F766E] uppercase tracking-widest font-heading">
            Common Questions
          </div>
          <h2 className="text-2xl font-black text-gray-900 font-heading">
            Frequently Asked Rental Questions
          </h2>
          <p className="text-xs text-gray-500 font-body">
            Everything you need to know about deposits, KYC, sanitization, and returns
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-5 py-4 font-bold text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-4 bg-gray-50 hover:bg-gray-100 transition-colors font-heading"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-[#0F766E]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 py-4 text-xs text-gray-600 leading-relaxed bg-white border-t border-gray-100 font-body">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. WHATSAPP & CALLBACK CTA BOX */}
      <section className="p-8 sm:p-10 bg-gradient-to-r from-[#1E293B] via-[#1E293B] to-slate-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs text-teal-300 font-bold font-heading">
            <HeartHandshake className="w-4 h-4" />
            <span>Dedicated Clinical Rental Desk</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-heading">
            Need Equipment for Urgent Patient Discharge?
          </h3>
          <p className="text-xs text-slate-300 max-w-xl font-body">
            Our biomedical support team is active 24/7. Speak directly with a clinical equipment specialist for emergency ICU bed setup, high-flow oxygen concentrators, or customized hospital packages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsCallbackOpen(true)}
            className="px-5 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 font-heading"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Request Instant Callback</span>
          </button>
          <a
            href="https://wa.me/919811234567?text=Hello%20Buy%20Denmed,%20I%20urgently%20need%20medical%20equipment%20on%20rent."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 font-heading"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp (+91 98112 34567)</span>
          </a>
        </div>
      </section>

      {/* FAST CALLBACK MODAL */}
      {isCallbackOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => setIsCallbackOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="text-xs font-bold text-[#0F766E] uppercase tracking-wider font-heading">
                Emergency Support
              </div>
              <h3 className="text-lg font-black text-gray-900 font-heading">
                Request a Rental Callback
              </h3>
              <p className="text-xs text-gray-500 font-body">
                We will call you back within 15 minutes to verify stock and expedite delivery.
              </p>
            </div>

            {callbackSubmitted ? (
              <div className="p-6 bg-teal-50 text-center rounded-2xl border border-teal-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
                <h4 className="font-bold text-sm text-teal-900 font-heading">Request Received!</h4>
                <p className="text-xs text-teal-700 font-body">A biomedical coordinator is dialing your number.</p>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Your Name / Doctor Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rohan Sharma"
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-[#0F766E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    10-Digit Mobile Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600 font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-r-xl focus:border-[#0F766E] focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Equipment Required
                  </label>
                  <select
                    value={callbackEquipment}
                    onChange={(e) => setCallbackEquipment(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-xl focus:border-[#0F766E] focus:outline-none bg-white font-medium"
                  >
                    <option value="Oxygen Concentrator">Oxygen Concentrator (5L / 10L)</option>
                    <option value="Portable Oxygen Concentrator">Portable Oxygen Concentrator (POC)</option>
                    <option value="CPAP Machine">CPAP Machine (ResMed AutoSet)</option>
                    <option value="BiPAP Machine">BiPAP Machine (ResMed VAuto)</option>
                    <option value="Hospital Bed">Hospital ICU Bed (Electric 5-Function)</option>
                    <option value="Wheelchair">Motorized / Reclining Wheelchair</option>
                    <option value="Patient Monitor">5-Para Vital Signs Monitor</option>
                    <option value="Suction Machine">Portable Suction Machine</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-2 font-heading"
                >
                  Confirm Request Call
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
