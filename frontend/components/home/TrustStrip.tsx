'use client';

import React from 'react';
import { ShieldCheck, Tag, Truck, CreditCard, Lock, RotateCcw } from 'lucide-react';
import { useSiteSettings } from '@/lib/settings/store';

export const TrustStrip: React.FC = () => {
  const { returns } = useSiteSettings();
  const pillars = [
    {
      icon: ShieldCheck,
      title: '100% Genuine Products',
      desc: 'Authorized brand distributor warranties',
      mobileTitle: '100% Genuine',
      mobileDesc: 'Brand warranty'
    },
    {
      icon: Tag,
      title: 'Best Prices & Bulk B2B',
      desc: 'Wholesale clinic tier rates & GST invoice',
      mobileTitle: 'Best Prices',
      mobileDesc: 'Wholesale B2B'
    },
    {
      icon: Truck,
      title: 'Pan-India Fast Delivery',
      desc: 'Doorstep transit to 25,000+ PIN codes',
      mobileTitle: 'Fast Delivery',
      mobileDesc: '25,000+ PINs'
    },
    {
      icon: CreditCard,
      title: 'Easy EMI Available',
      desc: 'Zero-cost plans across leading bank cards',
      mobileTitle: 'Easy EMI',
      mobileDesc: 'Zero-cost plans'
    },
    {
      icon: Lock,
      title: '100% Secure Payments',
      desc: 'Protected UPI, cards & netbanking',
      mobileTitle: 'Secure Pay',
      mobileDesc: '100% Protected'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns Policy',
      desc: returns.returnsEnabled
        ? `${returns.returnWindowDays}-day ${returns.replacementEnabled ? 'replacement' : 'returns'} for damaged or faulty items`
        : 'Dedicated support for damaged or faulty items',
      mobileTitle: 'Easy Returns',
      mobileDesc: returns.returnsEnabled
        ? `${returns.returnWindowDays}-day replacement`
        : 'Dedicated support'
    }
  ];

  return (
    <div className="bg-white border-b border-[#DCE6F2] py-2.5 sm:py-5 px-2.5 sm:px-8 shadow-2xs">
      <div className="max-w-[1320px] mx-auto flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-6 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scroll-smooth snap-x no-scrollbar">
        {pillars.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="shrink-0 snap-start min-w-0 w-[calc((100%-24px)/4)] sm:w-auto flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 bg-[#F8FAFC] sm:bg-transparent rounded-xl sm:rounded-none border border-[#E2E8F0] sm:border-0 p-1.5 sm:p-0 group transition-all shadow-2xs sm:shadow-none text-center sm:text-left"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#EAF2FC] group-hover:bg-[#1D5FAF] text-[#174E90] group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs mb-0.5 sm:mb-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
              </div>
              <div className="min-w-0 w-full">
                <h4 className="font-heading font-bold text-[9.5px] sm:text-sm text-[#12263F] group-hover:text-[#1D5FAF] transition-colors leading-tight line-clamp-1 sm:truncate">
                  <span className="sm:hidden">{item.mobileTitle}</span>
                  <span className="hidden sm:inline">{item.title}</span>
                </h4>
                <p className="font-body text-[8px] sm:text-xs text-[#5B6B82] leading-tight mt-0.5 sm:mt-1 line-clamp-1 sm:truncate">
                  <span className="sm:hidden">{item.mobileDesc}</span>
                  <span className="hidden sm:inline">{item.desc}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrustStrip;
