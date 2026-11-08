'use client';

import React from 'react';
import { PackageCheck, Building, Truck, Headphones, ShieldCheck } from 'lucide-react';

export const WhyBuyDenmed: React.FC = () => {
  const stats = [
    {
      icon: PackageCheck,
      number: '1,000+',
      label: 'Clinical Products',
      desc: 'Hospital-grade respiratory, dental operatory & diagnostic equipment'
    },
    {
      icon: Building,
      number: '100+',
      label: 'Authorized Brands',
      desc: 'Direct manufacturer warranties from Philips, ResMed, NSK & Waldent'
    },
    {
      icon: Truck,
      number: 'Pan-India',
      label: 'Express Delivery',
      desc: 'Fast doorstep shipping & cold-chain transit to 25,000+ pin codes'
    },
    {
      icon: Headphones,
      number: '24x7',
      label: 'Clinical Support',
      desc: 'Biomedical engineers on-call for equipment demo, setup & rental swaps'
    }
  ];

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-white border border-gray-200/90 p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 font-heading inline-block mb-1">
              India&apos;s Trusted Healthcare Marketplace
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 font-heading">
              Why Doctors &amp; Families Choose Buy Denmed
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-body mt-2 leading-relaxed">
              We empower clinics, hospitals, and patients with authentic medical technology, verified GST invoicing, and flexible rental options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#F7F7F7] border border-gray-100 hover:border-orange-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center mb-3 shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#2B2B2B] font-heading">
                    {stat.number}
                  </div>
                  <div className="text-xs font-bold text-[#FF6B00] font-heading mt-0.5">
                    {stat.label}
                  </div>
                  <p className="text-xs text-gray-500 font-body mt-2 leading-relaxed">
                    {stat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyBuyDenmed;
