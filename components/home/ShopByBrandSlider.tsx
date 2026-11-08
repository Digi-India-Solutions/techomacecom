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
      scrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-semibold text-slate-900 font-heading relative inline-block">
              Shop by Brands
              <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#0F766E] rounded-full" />
            </h2>
            <p className="text-xs text-slate-500 font-body mt-1.5">
              Explore equipment and consumables by trusted clinical manufacturers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/brands"
              className="text-xs sm:text-sm font-semibold text-[#0F766E] hover:text-[#0B5F58] flex items-center gap-1 font-heading"
            >
              <span>All Brands</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Previous brands"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Next brands"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Brand tiles slider */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar"
        >
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brand/${brand.slug}`}
              className="group shrink-0 w-28 sm:w-36 bg-white rounded-xl border border-slate-200/90 hover:border-[#0F766E] p-3 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all duration-200"
            >
              {/* Logo or clean Wordmark in Poppins 600 */}
              <div className="w-16 h-12 rounded-lg bg-[#F1F5F9] border border-slate-100 mb-2 flex items-center justify-center p-1.5 overflow-hidden group-hover:scale-105 transition-transform">
                {brand.logo || brand.logoUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={brand.logoUrl || brand.logo}
                      alt={brand.name}
                      fill
                      className="object-contain"
                      sizes="64px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <span className="font-heading font-semibold text-xs text-slate-700 uppercase tracking-wider truncate px-1">
                    {brand.name.slice(0, 8)}
                  </span>
                )}
              </div>

              <h4 className="font-heading font-semibold text-xs text-slate-800 group-hover:text-[#0F766E] line-clamp-1 transition-colors">
                {brand.name}
              </h4>
              <span className="text-[10px] text-slate-400 font-body mt-0.5">
                {brand.productCount} Products
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByBrandSlider;
