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
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 font-heading relative inline-block">
              Shop by Medical Need
              <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#FF6B00] rounded-full" />
            </h2>
            <p className="text-xs text-gray-500 font-body mt-1.5">
              Tailored equipment selections matched to your clinical specialty or home patient care setup
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {needs.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative rounded-2xl bg-white border border-gray-200/90 hover:border-[#FF6B00] p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 group-hover:bg-[#FF6B00] text-[#FF6B00] group-hover:text-white transition-colors flex items-center justify-center shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 group-hover:bg-orange-50 group-hover:text-[#FF6B00] px-2 py-0.5 rounded transition-colors font-heading">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#FF6B00] font-heading transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-gray-400 font-heading mt-0.5">
                    {item.subtitle}
                  </div>

                  <p className="text-xs text-gray-500 font-body leading-relaxed mt-2.5">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#FF6B00] font-heading">
                  <span>Explore Catalog</span>
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
