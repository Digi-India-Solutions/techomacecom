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
  accentColor?: string;
}

export const FeaturedCategoriesBento: React.FC = () => {
  const topRowItems: BentoItem[] = [
    {
      id: 'oxygen',
      firstWord: 'OXYGEN',
      secondWord: 'CONCENTRATORS',
      tagline: 'High-Purity 5L & 10L Life Support',
      href: '/category/respiratory-care',
      image: '/images/bento_oxygen_conc_1793803384593.jpg'
    },
    {
      id: 'cpap',
      firstWord: 'CPAP &',
      secondWord: 'BIPAP DEVICES',
      tagline: 'Sleep Apnea & Non-Invasive Ventilation',
      href: '/category/sleep-apnea-therapy',
      image: '/images/bento_cpap_bipap_1793803386703.jpg'
    }
  ];

  const bottomRowItems: BentoItem[] = [
    {
      id: 'dental',
      firstWord: 'DENTAL',
      secondWord: 'OPERATORY',
      tagline: 'Precision Handpieces & Clinic Units',
      href: '/category/dental-handpieces-motors',
      image: '/images/bento_dental_equip_1793803387280.jpg'
    },
    {
      id: 'monitoring',
      firstWord: 'PATIENT',
      secondWord: 'MONITORS',
      tagline: 'Multipara Vital Signs & ECG Tracking',
      href: '/category/diagnostic-monitoring',
      image: '/images/bento_monitoring_vitals_1793803410618.jpg'
    }
  ];

  const tallItem: BentoItem = {
    id: 'homecare',
    firstWord: 'HOME CARE',
    secondWord: '& MOBILITY',
    tagline: 'Hospital Beds, Wheelchairs & Suction Units',
    href: '/category/hospital-furniture',
    image: '/images/bento_homecare_mobility_1793803387668.jpg'
  };

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold text-slate-900 font-heading relative inline-block">
              Featured Categories
              <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#0F766E] rounded-full" />
            </h2>
            <p className="text-xs text-slate-500 font-body mt-1.5">
              Curated clinical, operatory and respiratory essentials from trusted healthcare manufacturers
            </p>
          </div>
          <Link
            href="/category/respiratory-care"
            className="text-xs sm:text-sm font-semibold text-[#0F766E] hover:text-[#0B5F58] flex items-center gap-1 font-heading"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dentalkart style Bento Grid: 2x2 on left, 1 tall banner spanning 2 rows on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
          {/* Left 8 columns: 2 rows of 2 banners */}
          <div className="lg:col-span-8 flex flex-col gap-3.5 sm:gap-4">
            {/* Top row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {topRowItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative rounded-2xl bg-gradient-to-r from-white via-white to-slate-50 border border-slate-200 hover:border-[#0F766E] p-4 sm:p-5 flex items-center justify-between overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 min-h-[170px]"
                >
                  <div className="z-10 max-w-[62%] space-y-1.5">
                    <h3 className="font-heading font-bold text-base sm:text-lg leading-tight">
                      <span className="text-[#1E293B] block">{item.firstWord}</span>
                      <span className="text-[#0F766E] block">{item.secondWord}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-body line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>
                    <div className="pt-1.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1E293B] group-hover:bg-[#0F766E] text-white text-[11px] font-bold font-heading rounded-md transition-colors shadow-xs">
                        SHOP NOW
                      </span>
                    </div>
                  </div>

                  {/* Right product image */}
                  <div className="relative w-28 sm:w-36 h-28 sm:h-36 shrink-0 transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={item.image}
                      alt={`${item.firstWord} ${item.secondWord}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 120px, 150px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {bottomRowItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative rounded-2xl bg-gradient-to-r from-white via-white to-slate-50 border border-slate-200 hover:border-[#0F766E] p-4 sm:p-5 flex items-center justify-between overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 min-h-[170px]"
                >
                  <div className="z-10 max-w-[62%] space-y-1.5">
                    <h3 className="font-heading font-bold text-base sm:text-lg leading-tight">
                      <span className="text-[#1E293B] block">{item.firstWord}</span>
                      <span className="text-[#0F766E] block">{item.secondWord}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-body line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>
                    <div className="pt-1.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1E293B] group-hover:bg-[#0F766E] text-white text-[11px] font-bold font-heading rounded-md transition-colors shadow-xs">
                        SHOP NOW
                      </span>
                    </div>
                  </div>

                  {/* Right product image */}
                  <div className="relative w-28 sm:w-36 h-28 sm:h-36 shrink-0 transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={item.image}
                      alt={`${item.firstWord} ${item.secondWord}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 120px, 150px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right 4 columns: Tall banner spanning both rows */}
          <div className="lg:col-span-4">
            <Link
              href={tallItem.href}
              className="group relative h-full rounded-2xl bg-gradient-to-b from-white via-white to-teal-50/40 border border-slate-200 hover:border-[#0F766E] p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 min-h-[300px] lg:min-h-full"
            >
              <div className="z-10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#E6F4F3] px-2 py-0.5 rounded border border-[#0F766E]/20 font-heading inline-block">
                  Long-Term Patient Care
                </span>
                <h3 className="font-heading font-bold text-xl sm:text-2xl leading-tight">
                  <span className="text-[#1E293B] block">{tallItem.firstWord}</span>
                  <span className="text-[#0F766E] block">{tallItem.secondWord}</span>
                </h3>
                <p className="text-xs text-slate-500 font-body leading-relaxed max-w-[280px]">
                  {tallItem.tagline}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#1E293B] group-hover:bg-[#0F766E] text-white text-xs font-bold font-heading rounded-md transition-colors shadow-xs">
                    SHOP NOW
                  </span>
                </div>
              </div>

              {/* Bottom image standing tall */}
              <div className="relative w-full h-44 sm:h-56 mt-4 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={tallItem.image}
                  alt={`${tallItem.firstWord} ${tallItem.secondWord}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 380px"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesBento;
