'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CardCarousel, { PRODUCT_SLIDE } from '@/components/common/CardCarousel';
import { Zap, Clock } from 'lucide-react';

interface DealOfDayProps {
  deals: Product[];
}

export const DealOfDay: React.FC<DealOfDayProps> = ({ deals }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 32,
    seconds: 45
  });


  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!deals || deals.length === 0) return null;

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Deal Header with Live Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 bg-[#EA580C] text-white text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider font-heading">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Flash Clearance Deals
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-[#475569] font-medium hidden sm:inline">
                Limited inventory genuine clinical savings
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              Deals of the Day
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Live Timer Countdown */}
            <div className="flex items-center gap-2 bg-[#0B2545] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-mono shadow-sm">
              <Clock className="w-4 h-4 text-[#EA580C] shrink-0" />
              <span className="text-slate-300 font-body mr-1">Ends in:</span>
              <span className="font-bold bg-white/10 px-1.5 py-0.5 rounded text-white">
                {String(timeLeft.hours).padStart(2, '0')}h
              </span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold bg-white/10 px-1.5 py-0.5 rounded text-white">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold bg-[#EA580C] text-white px-1.5 py-0.5 rounded">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>

          </div>
        </div>

        {/* Deals Cards */}
        <CardCarousel ariaLabel="Deals of the day" itemClassName={PRODUCT_SLIDE}>
          {deals.slice(0, 16).map((deal) => (
            <ProductCard key={deal.id} product={deal} className="h-full" />
          ))}
        </CardCarousel>
      </div>
    </section>
  );
};

export default DealOfDay;
