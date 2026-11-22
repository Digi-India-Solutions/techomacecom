'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Category, PageBanner } from '@/types';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import SkeletonImage from '@/components/common/SkeletonImage';
import { Search, ChevronRight, X, Layers, ArrowRight, Package } from 'lucide-react';

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

const FALLBACK_IMAGES = [
  '/images/bento_oxygen_conc_1793803384593.jpg',
  '/images/bento_cpap_bipap_1793803386703.jpg',
  '/images/prod_dental_chair_1793803541905.jpg',
  '/images/bento_monitoring_vitals_1793803410618.jpg',
  '/images/bento_homecare_mobility_1793803387668.jpg',
  '/images/prod_autoclave_main.jpg',
  '/images/prod_wheelchair_main.jpg',
];

function resolveCatImage(cat: Category, index: number): string {
  if (cat.image && cat.image.trim()) return cat.image.trim();
  if (cat.icon && cat.icon.trim()) return cat.icon.trim();
  if (cat.bannerDesktop && cat.bannerDesktop.trim()) return cat.bannerDesktop.trim();

  const slug = (cat.slug || '').toLowerCase();
  for (const [key, img] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (slug.includes(key) || key.includes(slug)) return img;
  }

  const name = (cat.name || '').toLowerCase();
  if (name.includes('oxygen') || name.includes('respiratory')) return '/images/bento_oxygen_conc_1793803384593.jpg';
  if (name.includes('cpap') || name.includes('bipap')) return '/images/bento_cpap_bipap_1793803386703.jpg';
  if (name.includes('dental') || name.includes('chair')) return '/images/prod_dental_chair_1793803541905.jpg';
  if (name.includes('autoclave')) return '/images/prod_autoclave_main.jpg';
  if (name.includes('monitor')) return '/images/bento_monitoring_vitals_1793803410618.jpg';
  if (name.includes('bed') || name.includes('wheelchair')) return '/images/bento_homecare_mobility_1793803387668.jpg';

  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

interface CategoriesDirectoryClientProps {
  initialCategories: Category[];
  banners?: PageBanner[];
}

export default function CategoriesDirectoryClient({
  initialCategories,
  banners = [],
}: CategoriesDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    let list = [...initialCategories];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesSub = (c.subCategories || []).some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.children || []).some((ch) => ch.name.toLowerCase().includes(q))
        );
        return matchesName || matchesSub;
      });
    }
    return list;
  }, [initialCategories, searchQuery]);

  const totalProducts = useMemo(() => {
    return initialCategories.reduce((sum, c) => sum + (c.itemCount || 0), 0);
  }, [initialCategories]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-8 font-body">
      {/* 1. Page Banners if available */}
      {banners && banners.length > 0 && (
        <PageBannerSlider banners={banners} className="mb-2" />
      )}

      {/* 2. Header & Instant Search Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#5B6B82] mb-2 font-medium">
              <Link href="/" className="hover:text-[#1D5FAF] transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#12263F] font-semibold">Categories</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#12263F] font-heading flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-[#1D5FAF]" />
              <span>All Medical & Clinical Categories</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6B82] mt-1">
              Browse genuine clinical equipment, hospital furniture, dental operatories & homecare devices across {initialCategories.length} departments.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF2FC] text-[#174E90] text-xs font-semibold rounded-lg font-heading">
              <Package className="w-4 h-4" />
              {initialCategories.length} Departments
            </span>
            {totalProducts > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg font-heading border border-emerald-200">
                {totalProducts}+ Products Listed
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#8A97A8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories, departments, or clinical specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-[#F6F9FD] border border-[#DCE6F2] focus:border-[#1D5FAF] focus:bg-white rounded-xl text-sm text-[#12263F] placeholder-[#8A97A8] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A97A8] hover:text-[#12263F] p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCategories.map((cat, idx) => {
            const img = resolveCatImage(cat, idx);
            const subList = cat.subCategories || [];

            return (
              <div
                key={cat.id || cat.slug}
                className="group bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Category Image Header */}
                  <Link
                    href={`/category/${cat.slug || cat.id}`}
                    className="block relative aspect-[16/10] bg-[#F6F9FD] overflow-hidden"
                  >
                    <SkeletonImage
                      src={img}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    {/* Item count tag */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#174E90] shadow-xs">
                      {cat.itemCount ? `${cat.itemCount} Products` : 'Available'}
                    </div>

                    {/* Category Title floating on image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h2 className="text-base font-bold text-white font-heading drop-shadow-sm truncate">
                        {cat.name}
                      </h2>
                    </div>
                  </Link>

                  {/* Subcategories list */}
                  <div className="p-4 space-y-3">
                    {subList.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold text-[#8A97A8] uppercase tracking-wider mb-2">
                          Popular Sub-Departments
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {subList.slice(0, 4).map((sub) => (
                            <Link
                              key={sub.id || sub.slug}
                              href={`/category/${sub.slug || sub.id}`}
                              className="text-xs px-2.5 py-1 bg-[#F6F9FD] hover:bg-[#EAF2FC] text-[#5B6B82] hover:text-[#174E90] rounded-md font-medium border border-[#DCE6F2] transition-colors truncate max-w-[150px]"
                            >
                              {sub.name}
                            </Link>
                          ))}
                          {subList.length > 4 && (
                            <Link
                              href={`/category/${cat.slug || cat.id}`}
                              className="text-xs px-2 py-1 text-[#1D5FAF] font-bold hover:underline"
                            >
                              +{subList.length - 4} more
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#5B6B82] line-clamp-2">
                        {cat.description || 'Full range of clinical units, instruments, and certified accessories.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/category/${cat.slug || cat.id}`}
                    className="w-full inline-flex items-center justify-between px-4 py-2.5 bg-[#F6F9FD] group-hover:bg-[#1D5FAF] text-[#174E90] group-hover:text-white rounded-xl text-xs font-bold font-heading transition-colors"
                  >
                    <span>View Category Products</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-[#DCE6F2] text-center space-y-3">
          <Layers className="w-10 h-10 text-[#8A97A8] mx-auto" />
          <h3 className="text-lg font-bold text-[#12263F] font-heading">
            No matching categories found
          </h3>
          <p className="text-sm text-[#5B6B82] max-w-md mx-auto">
            We couldn’t find any category matching "{searchQuery}". Try searching with a different term like "Dental", "Oxygen", or "Beds".
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D5FAF] text-white rounded-lg text-xs font-semibold hover:bg-[#174D8F] transition-colors"
          >
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
}

