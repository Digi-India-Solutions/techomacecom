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

const getCategoryImage = (cat: Category | any): string => {
  if (cat.image && typeof cat.image === 'string' && cat.image.trim()) return cat.image.trim();
  if (cat.icon && typeof cat.icon === 'string' && cat.icon.trim()) return cat.icon.trim();
  const slug = (cat.slug || '').toLowerCase();
  for (const [key, img] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (slug.includes(key) || key.includes(slug)) return img;
  }
  const name = (cat.name || '').toLowerCase();
  if (name.includes('oxygen') || name.includes('respiratory')) return '/images/bento_oxygen_conc_1793803384593.jpg';
  if (name.includes('cpap') || name.includes('bipap') || name.includes('sleep')) return '/images/bento_cpap_bipap_1793803386703.jpg';
  if (name.includes('chair') || name.includes('dental')) return '/images/prod_dental_chair_1793803541905.jpg';
  if (name.includes('autoclave') || name.includes('steril')) return '/images/prod_autoclave_main.jpg';
  if (name.includes('monitor') || name.includes('diagnostic')) return '/images/bento_monitoring_vitals_1793803410618.jpg';
  if (name.includes('bed') || name.includes('wheelchair') || name.includes('mobility') || name.includes('furniture')) return '/images/prod_wheelchair_main.jpg';
  return '/images/bento_oxygen_conc_1793803384593.jpg';
};

export interface BentoCategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  bannerDesktop?: string;
  description?: string;
  itemCount?: number;
}

interface FeaturedCategoriesBentoProps {
  title?: string;
  subtitle?: string;
  categories?: Category[] | BentoCategoryItem[] | any[];
  banners?: any[];
  showButton?: boolean;
}

export const FeaturedCategoriesBento: React.FC<FeaturedCategoriesBentoProps> = ({
  title = 'Clinical & Homecare Essentials',
  subtitle = 'Curated dental operatory units, respiratory life support & hospital furniture from certified global manufacturers',
  categories = [],
}) => {
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

  if (!categories || categories.length === 0) return null;

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading relative inline-block">
              {title || 'Clinical & Homecare Essentials'}
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-body mt-2">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-bold text-[#1D5FAF] hover:text-[#0B2545] flex items-center gap-1 font-heading transition-colors"
            >
              <span>Explore All</span>
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

        {/* Categories scroll track — same clean category UI as TopCategoriesGrid (4 cards in mobile view) */}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-5 overflow-x-auto pb-3 sm:pb-4 pt-1 scroll-smooth snap-x no-scrollbar"
        >
          {categories.map((cat: any) => (
            <Link
              key={cat.id || cat.slug}
              href={`/category/${cat.slug || cat.id}`}
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
                  {cat.description || `${cat.itemCount || 1}+ Products`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesBento;
