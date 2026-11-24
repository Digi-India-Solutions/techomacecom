'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Wind, Stethoscope, Building2, ArrowRight } from 'lucide-react';

interface NeedItem {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge: string;
}

interface ShopByNeedProps {
  title?: string;
}

export const ShopByNeed: React.FC<ShopByNeedProps> = ({ title = 'Shop by Medical Need' }) => {
  const needs: NeedItem[] = [
    {
      id: 'homecare',
      title: 'Home Patient Care',
      subtitle: 'Post-Surgery & Elderly Support',
      desc: 'Motorized hospital beds, oxygen support, electric wheelchairs, and air mattresses for home recovery.',
      icon: Home,
      href: '/category/hospital-furniture',
      badge: 'Home Diagnostics'
    },
    {
      id: 'respiratory',
      title: 'Respiratory & Pulmonology',
      subtitle: 'Continuous Airway & Oxygen',
      desc: 'Philips & ResMed 5L/10L concentrators, AutoSet CPAP/BiPAP units, and hospital nebulizers.',
      icon: Wind,
      href: '/category/respiratory-care',
      badge: 'Critical Care'
    },
    {
      id: 'dental',
      title: 'Dental Operatory & Clinic',
      subtitle: 'Operatory Handpieces & Restoratives',
      desc: 'NSK & Waldent high-speed turbines, European Class B vacuum autoclaves, and light-cure composites.',
      icon: Stethoscope,
      href: '/category/dental-handpieces-motors',
      badge: 'Dental Clinics'
    },
    {
      id: 'turnkey',
      title: 'New Clinic Setup Solutions',
      subtitle: 'Turnkey Packages & Financing',
      desc: 'Comprehensive clinic setup packages, micro-stepper dental chairs, bulk discounts, and GST invoice support.',
      icon: Building2,
      href: '/category/dental-chairs-units',
      badge: 'Turnkey Setup'
    }
  ];

  return (
    <section className="my-6 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6">
        {/* Section Header */}
        <div className="flex items-start sm:items-end justify-between gap-3 mb-3.5 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
              {title || 'Shop by Medical Need'}
              <span className="absolute bottom-[-3px] sm:bottom-[-4px] left-0 w-8 sm:w-10 h-[2.5px] sm:h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-[11px] sm:text-sm text-[#5B6B82] font-body mt-1 sm:mt-2 line-clamp-1 sm:line-clamp-none">
              Tailored equipment selections matched to your clinical specialty or home patient care setup
            </p>
          </div>
        </div>

        {/* Cards: Mobile swipeable horizontal rail (2 cards per view) -> Desktop 4-column grid */}
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
          {needs.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative rounded-xl sm:rounded-2xl bg-white border border-[#DCE6F2] hover:border-[#1D5FAF] p-3.5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 shrink-0 snap-start w-[calc((100%-12px)/2)] sm:w-auto"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3.5 gap-1.5">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#EAF2FC] group-hover:bg-[#1D5FAF] text-[#174E90] group-hover:text-white transition-colors flex items-center justify-center shadow-xs shrink-0">
                      <Icon className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[9.5px] sm:text-[12px] font-bold uppercase tracking-wider text-[#5B6B82] bg-[#F6F9FD] group-hover:bg-[#EAF2FC] group-hover:text-[#174E90] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-colors font-heading border border-[#DCE6F2] truncate max-w-[55%] text-center">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-lg font-bold text-[#12263F] group-hover:text-[#1D5FAF] font-heading transition-colors line-clamp-1 leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-[10px] sm:text-xs font-semibold text-[#5B6B82] font-heading mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </div>

                  <p className="text-[10px] sm:text-sm text-[#5B6B82] font-body leading-relaxed mt-1.5 sm:mt-2.5 line-clamp-2 sm:line-clamp-none">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 sm:pt-4 mt-2.5 sm:mt-4 border-t border-[#DCE6F2] flex items-center justify-between text-[11px] sm:text-sm font-bold text-[#1D5FAF] group-hover:text-[#174E90] font-heading">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByNeed;
