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
    <div className="bg-white border-b border-gray-200 py-4 sm:py-5 px-4 sm:px-6">
      <div className="max-w-[1280px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {pillars.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-50 group-hover:bg-[#FF6B00] text-[#FF6B00] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-semibold text-[11px] sm:text-xs text-gray-900 group-hover:text-[#FF6B00] transition-colors leading-tight truncate">
                  {item.title}
                </h4>
                <p className="font-body text-[10px] text-gray-500 leading-tight mt-0.5 truncate">
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
