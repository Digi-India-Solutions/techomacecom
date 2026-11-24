'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SkeletonImage from '@/components/common/SkeletonImage';

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'oxygen-concentrators': '/images/bento_oxygen_conc_1793803384593.jpg',
  'dental-chairs': '/images/prod_dental_chair_1793803541905.jpg',
  'patient-monitors': '/images/bento_monitoring_vitals_1793803410618.jpg',
  'icu-beds': '/images/bento_homecare_mobility_1793803387668.jpg',
  'manual-wheelchairs': '/images/prod_wheelchair_main.jpg',
  'dental-autoclaves': '/images/prod_autoclave_main.jpg',
  'bipap-cpap': '/images/bento_cpap_bipap_1793803386703.jpg',
  'respiratory-care': '/images/bento_oxygen_conc_1793803384593.jpg',
  'dental-equipment': '/images/prod_dental_chair_1793803541905.jpg',
  'hospital-furniture': '/images/bento_homecare_mobility_1793803387668.jpg',
};

const getCategoryImage = (cat: Category): string => {
  if (cat.image && cat.image.trim()) return cat.image;
  if (cat.icon && cat.icon.trim()) return cat.icon;
  const slug = (cat.slug || '').toLowerCase();
  for (const [key, img] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (slug.includes(key) || key.includes(slug)) return img;
  }
  return '/images/bento_oxygen_conc_1793803384593.jpg';
};

interface TopCategoriesGridProps {
  categories: Category[];
  title?: string;
}

export const TopCategoriesGrid: React.FC<TopCategoriesGridProps> = ({ categories, title = 'Top Categories' }) => {
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
    <section className="my-6 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-3 sm:px-6">
        {/* Header */}
        <div className="flex items-start sm:items-end justify-between gap-3 mb-3.5 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              {title || 'Top Categories'}
              <span className="absolute bottom-[-3px] sm:bottom-[-4px] left-0 w-8 sm:w-10 h-[2.5px] sm:h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-[11px] sm:text-sm text-[#475569] font-body mt-1 sm:mt-2 line-clamp-1 sm:line-clamp-none">
              Browse dental operatory, respiratory therapy, diagnostic monitors & clinic consumables
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 pt-0.5 sm:pt-0">
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-0.5 sm:gap-1 font-heading transition-colors whitespace-nowrap"
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

        {/* Categories scroll track — on mobile exactly 4 cards fit in view, on desktop scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-5 overflow-x-auto pb-3 sm:pb-4 pt-1 scroll-smooth snap-x no-scrollbar"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group snap-start shrink-0 min-w-0 w-[calc((100%-24px)/4)] sm:w-44 bg-white rounded-xl sm:rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-1.5 sm:p-3 flex flex-col items-center text-center shadow-2xs"
            >
              {/* Image tile */}
              <div className="relative w-full aspect-square rounded-lg sm:rounded-xl bg-[#EAF2FC] group-hover:bg-[#D6E6F8] overflow-hidden transition-colors">
                <SkeletonImage
                  src={getCategoryImage(cat)}
                  alt={cat.name}
                  fill
                  className="object-contain p-1 sm:p-2 transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 25vw, 176px"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Text */}
              <div className="w-full min-w-0 mt-1.5 sm:mt-3 px-0.5">
                <h3 className="font-heading font-bold text-[9.5px] sm:text-sm text-[#12263F] group-hover:text-[#1D5FAF] leading-tight line-clamp-2 transition-colors break-words">
                  {cat.name}
                </h3>
                <p className="font-body text-[8.5px] sm:text-xs text-[#5B6B82] leading-tight mt-0.5 sm:mt-1 truncate">
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
