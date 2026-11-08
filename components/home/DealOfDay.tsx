'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { Zap, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

interface DealOfDayProps {
  deals: Product[];
}

export const DealOfDay: React.FC<DealOfDayProps> = ({ deals }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

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
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Deal Header with Live Countdown Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-heading">
                  <Zap className="w-3 h-3 fill-current" />
                  Flash Deals
                </span>
                <span className="text-xs text-gray-400 font-body hidden sm:inline">•</span>
                <span className="text-xs text-gray-500 font-body hidden sm:inline">
                  Limited inventory clinical clearance
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 font-heading relative inline-block mt-1">
                Deals of the Day
                <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#FF6B00] rounded-full" />
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Live Timer Countdown */}
            <div className="flex items-center gap-1.5 bg-[#2B2B2B] text-white px-3 py-1.5 rounded-xl text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
              <span className="text-[11px] text-gray-300 font-body mr-1">Ends in:</span>
              <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="text-gray-400">:</span>
              <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="text-gray-400">:</span>
              <span className="text-[#FF6B00] font-bold">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>

            {/* Slider arrows */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                aria-label="Previous deals"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                aria-label="Next deals"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product row slider: 5-6 cards on desktop, 2 per row on mobile */}
        <div
          ref={scrollRef}
          className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scroll-smooth no-scrollbar"
        >
          {deals.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[46%] min-w-[155px] sm:w-auto sm:min-w-0"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealOfDay;
