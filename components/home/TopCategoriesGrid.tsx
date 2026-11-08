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
      scrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-8 sm:my-10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 font-heading relative inline-block">
              Top Categories
              <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#FF6B00] rounded-full" />
            </h2>
            <p className="text-xs text-gray-500 font-body mt-1.5">
              Browse by dental operatory, respiratory care, emergency and clinical consumables
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/category/respiratory-care"
              className="text-xs sm:text-sm font-semibold text-[#FF6B00] hover:text-[#E65D00] flex items-center gap-1 font-heading"
            >
              <span>All Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                aria-label="Previous categories"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-7 h-7 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                aria-label="Next categories"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal scroll of rounded image icons */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group shrink-0 w-28 sm:w-32 bg-white rounded-2xl border border-gray-200/90 hover:border-[#FF6B00] hover:shadow-md transition-all duration-300 p-2.5 sm:p-3 flex flex-col items-center text-center"
            >
              {/* Rounded circular image icon */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F7F7F7] border border-gray-100 overflow-hidden mb-2 p-1.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-contain p-2"
                  sizes="80px"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Title in Poppins font */}
              <h3 className="font-heading font-medium text-[11px] sm:text-xs text-gray-900 group-hover:text-[#FF6B00] line-clamp-2 leading-tight transition-colors">
                {cat.name}
              </h3>

              <span className="text-[10px] text-gray-400 font-body mt-1">
                {cat.itemCount}+ Items
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCategoriesGrid;
