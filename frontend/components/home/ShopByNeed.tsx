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

export const ShopByNeed: React.FC = () => {
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
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
              Shop by Medical Need
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2">
              Tailored equipment selections matched to your clinical specialty or home patient care setup
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {needs.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative rounded-2xl bg-white border border-[#DCE6F2] hover:border-[#1D5FAF] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#EAF2FC] group-hover:bg-[#1D5FAF] text-[#174E90] group-hover:text-white transition-colors flex items-center justify-center shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#5B6B82] bg-[#F6F9FD] group-hover:bg-[#EAF2FC] group-hover:text-[#174E90] px-2.5 py-1 rounded-md transition-colors font-heading border border-[#DCE6F2]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#12263F] group-hover:text-[#1D5FAF] font-heading transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#5B6B82] font-heading mt-0.5">
                    {item.subtitle}
                  </div>

                  <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed mt-2.5">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#DCE6F2] flex items-center justify-between text-xs sm:text-sm font-bold text-[#1D5FAF] group-hover:text-[#174E90] font-heading">
                  <span>Explore Equipment</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
