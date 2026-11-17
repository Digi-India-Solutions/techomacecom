'use client';

import React from 'react';
import { ShieldCheck, Tag, Truck, CreditCard, Lock, RotateCcw } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const pillars = [
    {
      icon: ShieldCheck,
      title: '100% Genuine Products',
      desc: 'Authorized brand distributor warranties'
    },
    {
      icon: Tag,
      title: 'Best Prices & Bulk B2B',
      desc: 'Wholesale clinic tier rates & GST invoice'
    },
    {
      icon: Truck,
      title: 'Pan-India Fast Delivery',
      desc: 'Doorstep transit to 25,000+ PIN codes'
    },
    {
      icon: CreditCard,
      title: 'Easy EMI Available',
      desc: 'Zero-cost plans across leading bank cards'
    },
    {
      icon: Lock,
      title: '100% Secure Payments',
      desc: 'Protected UPI, cards & netbanking'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns Policy',
      desc: 'Hassle-free replacement for transit damage'
    }
  ];

  return (
    <div className="bg-white border-b border-[#DCE6F2] py-5 px-4 sm:px-8 shadow-2xs">
      <div className="max-w-[1320px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {pillars.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2FC] group-hover:bg-[#1D5FAF] text-[#174E90] group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#12263F] group-hover:text-[#1D5FAF] transition-colors leading-tight truncate">
                  {item.title}
                </h4>
                <p className="font-body text-xs text-[#5B6B82] leading-tight mt-1 truncate">
                  {item.desc}
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
