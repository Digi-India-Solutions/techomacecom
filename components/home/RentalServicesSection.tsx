'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { ShieldCheck, Sparkles, Wrench, RefreshCw, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface RentalServicesSectionProps {
  rentalProducts: Product[];
}

export const RentalServicesSection: React.FC<RentalServicesSectionProps> = ({ rentalProducts }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const highlights = [
    {
      title: 'Sanitised Hospital Equipment',
      desc: '100% UV-C and clinical autoclave sterilization prior to dispatch'
    },
    {
      title: '100% Refundable Security Deposit',
      desc: 'Instant refund upon return inspection without hidden deductions'
    },
    {
      title: 'Free Doorstep Demo & Setup',
      desc: 'Trained biomedical engineer brings device and demonstrates operation'
    },
    {
      title: 'Flexible Monthly Extension',
      desc: 'Extend rental tenure anytime or convert to buyout with credit'
    }
  ];

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Full-Width Graphic Banner Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#162032] to-[#0F172A] text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl border border-slate-700">
          {/* Subtle Teal Glow in Background */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Copy & 4 Highlights */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F766E]/25 text-teal-300 border border-[#0F766E]/40 text-xs font-bold font-heading uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero CapEx • Pan-India Doorstep Rentals</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight leading-tight">
                Rent Critical Medical Equipment <br />
                <span className="text-teal-300">Starting at ₹2,500/Month</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-body leading-relaxed max-w-xl">
                Avoid large upfront purchases for temporary post-surgery care or recovery. Rent hospital-grade 5L/10L oxygen concentrators, ResMed CPAP/BiPAP machines, motorized hospital beds, and patient monitors with zero maintenance hassle.
              </p>

              {/* 4 Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold font-heading text-white">{h.title}</h4>
                      <p className="text-[11px] text-slate-400 font-body leading-tight mt-0.5">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Rent Now + Buy Equipment */}
              <div className="pt-2 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/rent"
                  className="px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm font-heading rounded-xl shadow-lg shadow-teal-950/30 transition-all flex items-center gap-2"
                >
                  <span>Rent Equipment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/category/respiratory-care"
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm font-heading rounded-xl border border-white/20 transition-colors"
                >
                  Buy Brand New Equipment
                </Link>
              </div>
            </div>

            {/* Right Column: High Quality Composed Graphic */}
            <div className="lg:col-span-5 relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-square max-h-[360px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
              <Image
                src="/images/rental_composed_banner_1793803411001.jpg"
                alt="Rent Medical Equipment Pan-India"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-body uppercase">Service Area</div>
                  <div className="font-bold text-white font-heading">Pan-India Express Delivery</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-400 font-bold">Replacement Warranty</div>
                  <div className="text-white font-bold font-heading">Within 4 Hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Rental Equipment Slider below the banner */}
        <div className="mt-8">
          <div className="flex items-end justify-between mb-4 sm:mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2 py-0.5 rounded border border-[#0F766E]/20 font-heading mb-1 inline-block">
                Available On Easy Rentals
              </span>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 font-heading relative inline-block">
                Popular Rental Equipment
                <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#0F766E] rounded-full" />
              </h3>
              <p className="text-xs text-slate-500 font-body mt-1.5">
                Top requested oxygen concentrators, CPAP/BiPAP units, and motorized ICU beds ready for dispatch
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/rent"
                className="text-xs sm:text-sm font-semibold text-[#0F766E] hover:text-[#0B5F58] flex items-center gap-1 font-heading"
              >
                <span>View All Rentals</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={scrollLeft}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                  aria-label="Previous rental products"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollRight}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                  aria-label="Next rental products"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scroll-smooth no-scrollbar"
          >
            {rentalProducts.map((product) => (
              <div
                key={product.id}
                className="shrink-0 w-[46%] min-w-[155px] sm:w-auto sm:min-w-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RentalServicesSection;
