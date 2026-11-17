'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ShopByBrandSliderProps {
  brands: Brand[];
}

export const ShopByBrandSlider: React.FC<ShopByBrandSliderProps> = ({ brands }) => {
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
            <h2 className="text-xl sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
              Shop by Brands
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2">
              Explore equipment, handpieces and critical consumables by trusted clinical manufacturers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/brands"
              className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#174E90] flex items-center gap-1 font-heading transition-colors"
            >
              <span>All Brands</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-8 h-8 rounded-full border border-[#DCE6F2] bg-white hover:bg-[#EAF2FC] text-[#12263F] hover:text-[#1D5FAF] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Previous brands"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-8 h-8 rounded-full border border-[#DCE6F2] bg-white hover:bg-[#EAF2FC] text-[#12263F] hover:text-[#1D5FAF] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Next brands"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Brand tiles slider */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth no-scrollbar"
        >
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brand/${brand.slug}`}
              className="group shrink-0 w-44 sm:w-52 bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] p-3 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              {/* Brand Logo surface */}
              <div className="w-full h-28 sm:h-32 rounded-xl bg-[#F6F9FD] border border-[#DCE6F2] mb-2.5 flex items-center justify-center p-1.5 overflow-hidden group-hover:scale-105 transition-transform">
                {brand.logo || brand.logoUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={brand.logoUrl || brand.logo}
                      alt={brand.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 160px, 200px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <span className="font-heading font-bold text-sm text-[#12263F] uppercase tracking-wider truncate px-1">
                    {brand.name.slice(0, 10)}
                  </span>
                )}
              </div>

              {/* Brand Name */}
              <h3 className="font-heading font-semibold text-xs sm:text-sm text-[#12263F] group-hover:text-[#1D5FAF] transition-colors line-clamp-1 w-full">
                {brand.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByBrandSlider;
