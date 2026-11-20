'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CardCarousel, { PRODUCT_SLIDE } from '@/components/common/CardCarousel';
import { ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';

interface RentalServicesSectionProps {
  rentalProducts: Product[];
}

export const RentalServicesSection: React.FC<RentalServicesSectionProps> = ({ rentalProducts }) => {

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
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Full-Width Graphic Banner Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#0B2545] to-[#13335E] text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl border border-[#13335E]">
          {/* Subtle Blue Glow in Background */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#1D5FAF]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Column: Copy & 4 Highlights */}
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight leading-tight">
                Rent Critical Medical Equipment <br />
                <span className="text-[#93C5FD]">Starting at ₹2,500/Month</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 font-body leading-relaxed max-w-xl">
                Avoid large upfront purchases for temporary post-surgery care or recovery. Rent hospital-grade 5L/10L oxygen concentrators, ResMed CPAP/BiPAP machines, motorized hospital beds, and patient monitors with zero maintenance hassle.
              </p>

              {/* 4 Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#13335E]/70 border border-white/10 backdrop-blur-xs">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#4ADE80] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold font-heading text-white">{h.title}</h4>
                      <p className="text-xs text-slate-300 font-body leading-relaxed mt-0.5">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Rent Now + Buy Equipment */}
              <div className="pt-2 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/rent"
                  className="px-6 py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm font-heading rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <span>Rent Equipment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/search"
                  className="px-5 py-3.5 bg-white hover:bg-[#EAF2FC] text-[#1D5FAF] font-semibold text-xs sm:text-sm font-heading rounded-xl border border-[#1D5FAF] transition-colors"
                >
                  Buy Brand New Equipment
                </Link>
              </div>
            </div>

            {/* Right Column: High Quality Composed Graphic */}
            <div className="lg:col-span-5 relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-square max-h-[380px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#13335E]">
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
        <div className="mt-10">
          <div className="flex items-end justify-between mb-5 sm:mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
                Popular Rental Equipment
                <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
              </h3>
              <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2">
                Top requested oxygen concentrators, CPAP/BiPAP units, and motorized ICU beds ready for dispatch
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/rent"
                className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-1 font-heading transition-colors"
              >
                <span>View All Rentals</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <CardCarousel ariaLabel="Popular rental equipment" itemClassName={PRODUCT_SLIDE}>
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
