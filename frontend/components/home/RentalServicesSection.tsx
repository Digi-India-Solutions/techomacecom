'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CardCarousel, { PRODUCT_SLIDE } from '@/components/common/CardCarousel';
import { ArrowRight, ChevronRight, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';

interface RentalServicesSectionProps {
  rentalProducts: Product[];
  title?: string;
}

export const RentalServicesSection: React.FC<RentalServicesSectionProps> = ({ rentalProducts, title = 'Popular Rental Equipment' }) => {

  const highlights = [
    {
      title: 'Sanitised Equipment',
      fullTitle: 'Sanitised Hospital Equipment',
      desc: '100% UV-C and clinical autoclave sterilization prior to dispatch',
      shortDesc: '100% UV-C & autoclave sterilised'
    },
    {
      title: '100% Refundable',
      fullTitle: '100% Refundable Security Deposit',
      desc: 'Instant refund upon return inspection without hidden deductions',
      shortDesc: 'Instant refund upon return'
    },
    {
      title: 'Free Doorstep Demo',
      fullTitle: 'Free Doorstep Demo & Setup',
      desc: 'Trained biomedical engineer brings device and demonstrates operation',
      shortDesc: 'Trained engineer demonstration'
    },
    {
      title: 'Flexible Extension',
      fullTitle: 'Flexible Monthly Extension',
      desc: 'Extend rental tenure anytime or convert to buyout with credit',
      shortDesc: 'Extend tenure anytime or buyout'
    }
  ];

  return (
    <section className="my-8 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6">
        {/* Full-Width Graphic Banner Card */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#081B33] via-[#0B2545] to-[#13335E] text-white p-4 sm:p-8 lg:p-12 overflow-hidden shadow-xl border border-[#13335E]">
          {/* Subtle Blue Glow in Background */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#1D5FAF]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center relative z-10">
            {/* Left Column: Copy & Highlights */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                <span>Pan-India Medical Rental</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight leading-tight">
                  Rent Critical Medical Equipment <br className="hidden sm:inline" />
                  <span className="text-[#93C5FD] block sm:inline mt-1 sm:mt-0">Starting at ₹2,500/Month</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-200 font-body leading-relaxed max-w-xl mt-2">
                  Avoid large upfront purchases for temporary post-surgery care or recovery. Rent hospital-grade 5L/10L oxygen concentrators, ResMed CPAP/BiPAP machines, motorized hospital beds, and patient monitors with zero maintenance hassle.
                </p>
              </div>

              {/* Mobile Graphic Banner (Visible only on < lg) */}
              <div className="lg:hidden relative w-full aspect-[16/9] max-h-[220px] rounded-xl overflow-hidden border border-white/15 shadow-md bg-[#13335E]">
                <Image
                  src="/images/rental_composed_banner_1793803411001.jpg"
                  alt="Rent Medical Equipment Pan-India"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 480px"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/90 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 bg-[#0B2545]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-white font-medium">
                    <Truck className="w-3.5 h-3.5 text-[#93C5FD]" />
                    <span className="font-bold">Express Delivery</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#4ADE80] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>4-Hr Replacement</span>
                  </div>
                </div>
              </div>

              {/* 4 Highlights Grid: 2 columns on mobile (compact & clean) and 2 columns on desktop (detailed) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-0.5">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-white/[0.07] sm:bg-[#13335E]/70 border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-sm font-bold font-heading text-white leading-tight">
                        <span className="sm:hidden">{h.title}</span>
                        <span className="hidden sm:inline">{h.fullTitle}</span>
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-300 font-body leading-tight mt-0.5 sm:mt-1">
                        <span className="sm:hidden">{h.shortDesc}</span>
                        <span className="hidden sm:inline">{h.desc}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Rent Now + Buy Equipment */}
              <div className="pt-1.5 flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                <Link
                  href="/rent"
                  className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm font-heading rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Rent Equipment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/search"
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-3.5 bg-white/10 hover:bg-white/20 sm:bg-white sm:hover:bg-[#EAF2FC] text-white sm:text-[#1D5FAF] font-semibold text-xs sm:text-sm font-heading rounded-xl border border-white/20 sm:border-[#1D5FAF] transition-colors text-center"
                >
                  Buy Brand New Equipment
                </Link>
              </div>
            </div>

            {/* Right Column: High Quality Composed Graphic (Desktop Only >= lg) */}
            <div className="hidden lg:block lg:col-span-5 relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-square max-h-[380px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#13335E]">
              <Image
                src="/images/rental_composed_banner_1793803411001.jpg"
                alt="Rent Medical Equipment Pan-India"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-[#0B2545]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-300 font-body uppercase">Service Area</div>
                  <div className="font-bold text-white font-heading text-xs sm:text-sm">Pan-India Express Delivery</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#4ADE80] font-bold">Replacement Warranty</div>
                  <div className="text-white font-bold font-heading text-xs sm:text-sm">Within 4 Hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Rental Equipment Slider below the banner */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-end justify-between mb-3.5 sm:mb-6">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
                {title || 'Popular Rental Equipment'}
                <span className="absolute bottom-[-3px] sm:bottom-[-4px] left-0 w-8 sm:w-10 h-[2.5px] sm:h-[3px] bg-[#1D5FAF] rounded-full" />
              </h3>
              <p className="text-[11px] sm:text-sm text-[#5B6B82] font-body mt-1 sm:mt-2 line-clamp-1 sm:line-clamp-none">
                Top requested oxygen concentrators, CPAP/BiPAP units, and motorized ICU beds ready for dispatch
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/rent"
                className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-1 font-heading transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <CardCarousel ariaLabel="Popular rental equipment" itemClassName={PRODUCT_SLIDE} rows={1}>
            {rentalProducts.slice(0, 16).map((product) => (
              <ProductCard key={product.id} product={product} className="h-full" />
            ))}
          </CardCarousel>
        </div>
      </div>
    </section>
  );
};

export default RentalServicesSection;
