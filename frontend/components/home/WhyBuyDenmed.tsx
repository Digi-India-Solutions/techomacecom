'use client';

import React from 'react';
import { PackageCheck, Building, Truck, Headphones } from 'lucide-react';

interface WhyBuyDenmedProps {
  title?: string;
}

export const WhyBuyDenmed: React.FC<WhyBuyDenmedProps> = ({ title = 'Why Doctors & Families Choose Buy Denmed' }) => {
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
    <section className="my-6 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6">
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DCE6F2] p-4 sm:p-8 lg:p-10 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#12263F] font-heading">
              {title || 'Why Doctors & Families Choose Buy Denmed'}
            </h2>
            <p className="text-[11px] sm:text-sm text-[#5B6B82] font-body mt-1 sm:mt-2 leading-relaxed">
              We empower clinics, hospitals, and patients with authentic medical technology, verified GST invoicing, and flexible rental options.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-[#F6F9FD] border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-md transition-all duration-300"
                >
                  <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-[#EAF2FC] text-[#174E90] flex items-center justify-center mb-2 sm:mb-3.5 shadow-2xs">
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div className="text-base sm:text-2xl lg:text-3xl font-black text-[#12263F] font-heading leading-tight">
                    {stat.number}
                  </div>
                  <div className="text-[11px] sm:text-sm font-bold text-[#1D5FAF] font-heading mt-0.5 sm:mt-1 leading-tight">
                    {stat.label}
                  </div>
                  <p className="text-[9.5px] sm:text-sm text-[#5B6B82] font-body mt-1 sm:mt-2 leading-relaxed line-clamp-2 sm:line-clamp-none">
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
