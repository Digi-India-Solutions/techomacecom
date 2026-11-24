'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CardCarousel, { PRODUCT_SLIDE } from '@/components/common/CardCarousel';
import { Zap } from 'lucide-react';

interface DealOfDayProps {
  deals: Product[];
  title?: string;
}

export const DealOfDay: React.FC<DealOfDayProps> = ({ deals, title = "Deals of the Day" }) => {
  if (!deals || deals.length === 0) return null;

  return (
    <section className="my-6 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6">
        {/* Deal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
              <span className="inline-flex items-center gap-1.5 bg-[#EA580C] text-white text-[11px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md uppercase tracking-wider font-heading">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Flash Clearance Deals
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-[#475569] font-medium hidden sm:inline">
                Limited inventory genuine clinical savings
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              {title || "Deal of the Day"}
              <span className="absolute bottom-[-3px] sm:bottom-[-4px] left-0 w-8 sm:w-10 h-[2.5px] sm:h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap">
            <Link
              href="/deals"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#1D5FAF] hover:text-[#174D8F] bg-[#EAF2FC] hover:bg-[#DCE6F2] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-colors font-heading whitespace-nowrap"
            >
              <span>View All Deals</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Deals Cards — individual countdown timer on each card */}
        <CardCarousel ariaLabel="Deals of the day" itemClassName={PRODUCT_SLIDE} rows={1}>
          {deals.slice(0, 16).map((deal) => (
            <ProductCard key={deal.id} product={deal} showDealTimer={true} className="h-full" />
          ))}
        </CardCarousel>
      </div>
    </section>
  );
};

export default DealOfDay;
