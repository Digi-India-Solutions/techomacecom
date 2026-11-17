'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TopCategoriesGridProps {
  categories: Category[];
}

export const TopCategoriesGrid: React.FC<TopCategoriesGridProps> = ({ categories }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              Top Categories
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-body mt-2">
              Browse dental operatory, respiratory therapy, diagnostic monitors & clinic consumables
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/category/respiratory-care"
              className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-1 font-heading transition-colors"
            >
              <span>All Categories</span>
              <span className="tracking-tighter">&gt;&gt;</span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-8 h-8 rounded-full border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 hover:text-[#1D5FAF] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                aria-label="Previous categories"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-8 h-8 rounded-full border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 hover:text-[#1D5FAF] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                aria-label="Next categories"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories scroll track */}
        <div
          ref={scrollRef}
          className="grid grid-flow-col grid-rows-2 auto-cols-max gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth no-scrollbar"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group shrink-0 w-72 sm:w-80 bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-md transition-all duration-300 p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs"
            >
              {/* Icon tile */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#EAF2FC] group-hover:bg-[#D6E6F8] overflow-hidden shrink-0 transition-colors shadow-2xs">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                  sizes="96px"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-xs sm:text-sm text-[#12263F] group-hover:text-[#1D5FAF] leading-tight truncate transition-colors">
                  {cat.name}
                </h3>
                <p className="font-body text-xs text-[#5B6B82] leading-tight mt-1 truncate">
                  {cat.description || `${cat.itemCount}+ Products`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCategoriesGrid;
