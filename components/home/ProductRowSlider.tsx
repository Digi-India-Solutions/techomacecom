'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductRowSliderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  products: Product[];
  accentBadge?: string;
}

export const ProductRowSlider: React.FC<ProductRowSliderProps> = ({
  title,
  subtitle,
  viewAllLink,
  products,
  accentBadge
}) => {
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

  if (!products || products.length === 0) return null;

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Section Header: Poppins 600 with small orange underline accent & View All > */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            {accentBadge && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-heading mb-1 inline-block">
                {accentBadge}
              </span>
            )}
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 font-heading relative inline-block">
              {title}
              <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#FF6B00] rounded-full" />
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 font-body mt-1.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-xs sm:text-sm font-semibold text-[#FF6B00] hover:text-[#E65D00] flex items-center gap-1 font-heading"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Desktop Navigation Slider Arrows */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Row: 5-6 cards on desktop, 2 per row on mobile */}
        <div
          ref={scrollRef}
          className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scroll-smooth no-scrollbar"
        >
          {products.map((product) => (
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

export default ProductRowSlider;
