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
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-white border border-[#DCE6F2] p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-3xl font-bold text-[#12263F] font-heading">
              {title || 'Why Doctors & Families Choose Buy Denmed'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2 leading-relaxed">
              We empower clinics, hospitals, and patients with authentic medical technology, verified GST invoicing, and flexible rental options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#F6F9FD] border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-md transition-all duration-300"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#EAF2FC] text-[#174E90] flex items-center justify-center mb-3.5 shadow-xs">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#12263F] font-heading">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#1D5FAF] font-heading mt-1">
                    {stat.label}
                  </div>
                  <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2 leading-relaxed">
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
