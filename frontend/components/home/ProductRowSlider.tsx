'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CardCarousel, { PRODUCT_SLIDE } from '@/components/common/CardCarousel';

interface ProductRowSliderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  products: Product[];
}

export const ProductRowSlider: React.FC<ProductRowSliderProps> = ({
  title,
  subtitle,
  viewAllLink,
  products
}) => {

  if (!products || products.length === 0) return null;

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              {title}
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#475569] font-body mt-2 leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-1 font-heading transition-colors"
              >
                <span>View All</span>
                <span className="tracking-tighter">&gt;&gt;</span>
              </Link>
            )}
          </div>
        </div>

        {/* Product Cards Grid / Scroll Row — 2 cards on mobile, 5 on desktop */}
        <CardCarousel ariaLabel={title} itemClassName={PRODUCT_SLIDE} rows={1}>
          {products.slice(0, 16).map((product) => (
            <ProductCard key={product.id} product={product} className="h-full" />
          ))}
        </CardCarousel>
      </div>
    </section>
  );
};

export default ProductRowSlider;
