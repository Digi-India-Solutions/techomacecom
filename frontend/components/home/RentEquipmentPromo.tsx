'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Check, ArrowRight, Clock, Wrench } from 'lucide-react';

export const RentEquipmentPromo: React.FC = () => {
  const rentalBenefits = [
    'Zero CapEx: Start with low monthly rental instead of huge upfront expense',
    'Free Regular Maintenance & Filter Replacements included',
    'Same-Day Delivery & Demonstration by biomedical engineers in Delhi NCR, Mumbai, Bengaluru',
    'Option to buy out equipment anytime with rental credit adjustment'
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-[#EAF2FC] via-white to-[#EAF2FC]/50 border-y border-[#DCE6F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Text */}
          <div className="space-y-5">
            <h2 className="text-3xl sm:text-4xl font-black text-[#12263F] tracking-tight leading-tight">
              Hospital-Grade Equipment On Rent. <br />
              <span className="text-[#1D5FAF]">Starting at ₹2,500/Month.</span>
            </h2>

            <p className="text-sm text-[#5B6B82] leading-relaxed">
              Don&apos;t lock up your clinic capital or worry about patient post-discharge care. Rent genuine 5L/10L oxygen concentrators, ResMed CPAP/BiPAP units, motorized ICU beds, and electric wheelchairs with 100% free breakdown coverage.
            </p>

            <div className="space-y-2.5">
              {rentalBenefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-[#12263F]">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/rent"
                className="px-6 py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <span>View All Rentable Equipment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:+919811234567"
                className="px-5 py-3.5 bg-white border border-[#1D5FAF] hover:bg-[#EAF2FC] text-[#1D5FAF] font-semibold text-xs sm:text-sm rounded-xl transition-colors"
              >
                Speak with Rental Coordinator
              </a>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#DCE6F2] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F2]">
                <div className="font-bold text-sm text-[#12263F]">Featured Rental Packages</div>
                <span className="text-xs text-[#16A34A] font-bold bg-green-50 px-2.5 py-0.5 rounded-full">
                  Sanitized & Calibrated
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Philips EverFlo 5 LPM Oxygen Generator',
                    rent: '₹4,000 / mo',
                    deposit: '₹10,000 deposit',
                    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80'
                  },
                  {
                    name: 'ResMed AirSense 10 AutoSet CPAP + Mask',
                    rent: '₹4,500 / mo',
                    deposit: '₹12,000 deposit',
                    img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80'
                  },
                  {
                    name: 'KosmoCare Motorized Electric Wheelchair',
                    rent: '₹5,200 / mo',
                    deposit: '₹15,000 deposit',
                    img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=300&q=80'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F9FD] border border-[#DCE6F2] hover:border-[#1D5FAF] transition-colors"
                  >
                    <div className="w-14 h-14 rounded-lg bg-white relative overflow-hidden shrink-0 border border-[#DCE6F2]">
                      <Image
                        src={item.img}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-[#12263F] truncate">{item.name}</h4>
                      <div className="text-[12px] text-[#5B6B82]">{item.deposit}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[#1D5FAF] text-xs sm:text-sm">{item.rent}</div>
                      <Link
                        href="/rent"
                        className="text-[11px] text-[#5B6B82] hover:text-[#1D5FAF] font-semibold underline"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#EAF2FC] rounded-xl flex items-center justify-between text-xs text-[#174E90]">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#1D5FAF]" />
                  <span className="font-medium">Free swap within 4 hours if device requires service</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RentEquipmentPromo;
