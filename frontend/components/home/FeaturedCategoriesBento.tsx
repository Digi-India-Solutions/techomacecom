'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface BentoItem {
  id: string;
  firstWord: string;
  secondWord: string;
  tagline: string;
  href: string;
  image: string;
}

export const FeaturedCategoriesBento: React.FC = () => {
  const topRowItems: BentoItem[] = [
    {
      id: 'oxygen',
      firstWord: 'OXYGEN',
      secondWord: 'CONCENTRATORS',
      tagline: 'High-Purity 5L & 10L Continuous Medical Oxygen',
      href: '/category/respiratory-care',
      image: '/images/bento_oxygen_conc_1793803384593.jpg'
    },
    {
      id: 'cpap',
      firstWord: 'CPAP &',
      secondWord: 'BIPAP DEVICES',
      tagline: 'AutoSet Sleep Apnea & Non-Invasive Ventilation',
      href: '/category/sleep-apnea-therapy',
      image: '/images/bento_cpap_bipap_1793803386703.jpg'
    }
  ];

  const bottomRowItems: BentoItem[] = [
    {
      id: 'dental',
      firstWord: 'DENTAL',
      secondWord: 'OPERATORY',
      tagline: 'Precision Turbines, Handpieces & Clinic Units',
      href: '/category/dental-handpieces-motors',
      image: '/images/bento_dental_equip_1793803387280.jpg'
    },
    {
      id: 'monitoring',
      firstWord: 'PATIENT',
      secondWord: 'MONITORS',
      tagline: 'Multipara Vital Signs, Pulse Oximeters & ECG',
      href: '/category/diagnostic-monitoring',
      image: '/images/bento_monitoring_vitals_1793803410618.jpg'
    }
  ];

  const tallItem: BentoItem = {
    id: 'homecare',
    firstWord: 'HOME CARE',
    secondWord: '& MOBILITY',
    tagline: 'Motorized Hospital Beds, Wheelchairs, Suction Units & Anti-Decubitus Mattresses',
    href: '/category/hospital-furniture',
    image: '/images/bento_homecare_mobility_1793803387668.jpg'
  };

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              Featured Clinical Solutions
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-body mt-2">
              Curated dental operatory units, respiratory life support & hospital furniture from certified global manufacturers
            </p>
          </div>
          <Link
            href="/category/respiratory-care"
            className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-1 font-heading transition-colors"
          >
            <span>Explore All</span>
            <span className="tracking-tighter">&gt;&gt;</span>
          </Link>
        </div>

        {/* Bento Grid: 2x2 on left, 1 tall banner on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Left 8 columns: 2 rows of 2 banners */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-5">
            {/* Top row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {topRowItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative rounded-2xl bg-gradient-to-r from-white via-white to-[#EBF4FB] border border-[#E2E8F0] hover:border-[#1D5FAF] p-5 sm:p-6 flex items-stretch justify-between gap-4 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 min-h-[200px] hover:-translate-y-0.5"
                >
                  <div className="relative z-10 flex-1 min-w-0 self-center space-y-2">
                    <div>
                      <div className="text-lg font-black text-[#0B2545] tracking-tight leading-tight font-heading">
                        {item.firstWord}
                      </div>
                      <div className="text-lg font-black text-[#1D5FAF] tracking-tight leading-tight font-heading">
                        {item.secondWord}
                      </div>
                    </div>
                    <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5FAF] group-hover:text-[#0B2545] font-heading">
                        <span>Shop Now</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>

                  <div className="relative w-[44%] shrink-0 rounded-xl overflow-hidden bg-[#F6F9FD] shadow-2xs">
                    <Image
                      src={item.image}
                      alt={`${item.firstWord} ${item.secondWord}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 45vw, 280px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {bottomRowItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative rounded-2xl bg-gradient-to-r from-white via-white to-[#EBF4FB] border border-[#E2E8F0] hover:border-[#1D5FAF] p-5 sm:p-6 flex items-stretch justify-between gap-4 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 min-h-[200px] hover:-translate-y-0.5"
                >
                  <div className="relative z-10 flex-1 min-w-0 self-center space-y-2">
                    <div>
                      <div className="text-lg font-black text-[#0B2545] tracking-tight leading-tight font-heading">
                        {item.firstWord}
                      </div>
                      <div className="text-lg font-black text-[#1D5FAF] tracking-tight leading-tight font-heading">
                        {item.secondWord}
                      </div>
                    </div>
                    <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5FAF] group-hover:text-[#0B2545] font-heading">
                        <span>Shop Now</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>

                  <div className="relative w-[44%] shrink-0 rounded-xl overflow-hidden bg-[#F6F9FD] shadow-2xs">
                    <Image
                      src={item.image}
                      alt={`${item.firstWord} ${item.secondWord}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 45vw, 280px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right 4 columns: Tall Featured Card */}
          <div className="lg:col-span-4 flex">
            <Link
              href={tallItem.href}
              className="group relative w-full rounded-2xl bg-gradient-to-b from-white via-[#EBF4FB]/60 to-[#EBF4FB] border border-[#E2E8F0] hover:border-[#1D5FAF] p-6 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 min-h-[380px] hover:-translate-y-0.5"
            >
              <div className="space-y-2.5 relative z-10">
                <span className="text-[12px] font-black uppercase tracking-wider text-[#1D5FAF] bg-white px-2.5 py-1 rounded-md border border-[#CBD5E1] font-heading shadow-2xs inline-block">
                  Featured Category
                </span>
                <div>
                  <div className="text-2xl font-black text-[#0B2545] tracking-tight font-heading">
                    {tallItem.firstWord}
                  </div>
                  <div className="text-2xl font-black text-[#1D5FAF] tracking-tight font-heading">
                    {tallItem.secondWord}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  {tallItem.tagline}
                </p>
              </div>

              <div className="relative w-full flex-1 min-h-[280px] my-5 rounded-xl overflow-hidden bg-[#F6F9FD] shadow-2xs">
                <Image
                  src={tallItem.image}
                  alt={`${tallItem.firstWord} ${tallItem.secondWord}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 360px"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10 pt-2">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B2545] group-hover:bg-[#1D5FAF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs">
                  <span>Explore Furniture & Mobility</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesBento;
