'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Brand, PageBanner } from '@/types';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import { Search, ChevronRight, X } from 'lucide-react';

interface BrandsDirectoryClientProps {
  initialBrands: Brand[];
  banners: PageBanner[];
}

export const BrandsDirectoryClient: React.FC<BrandsDirectoryClientProps> = ({
  initialBrands,
  banners
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const alphabet = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Filtered brands based on real-time search and A-Z letter
  const filteredBrands = useMemo(() => {
    let list = [...initialBrands];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    if (selectedLetter !== 'ALL') {
      list = list.filter((b) => b.name.toUpperCase().startsWith(selectedLetter));
    }

    // Sort alphabetically by name
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [initialBrands, searchQuery, selectedLetter]);

  // Available letters set
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    initialBrands.forEach((b) => {
      const char = b.name.charAt(0).toUpperCase();
      if (char >= 'A' && char <= 'Z') letters.add(char);
    });
    return letters;
  }, [initialBrands]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Banner Slider at Top */}
      {banners && banners.length > 0 && (
        <PageBannerSlider banners={banners} className="mb-2" />
      )}

      {/* 2. Header: Title, Product Count, and Search Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 font-heading">
              Shop by Brands
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-body mt-1">
              Browse genuine clinical equipment and consumables from {initialBrands.length} global manufacturers
            </p>
          </div>

          {/* Search box to filter brands in real-time */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full text-xs font-body pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E] focus:bg-white focus:ring-1 focus:ring-[#0F766E] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. A–Z Letter Filter Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 font-heading mr-2 uppercase tracking-wider">
            Filter A–Z:
          </span>
          {alphabet.map((letter) => {
            const isSelected = selectedLetter === letter;
            const isAvailable = letter === 'ALL' || availableLetters.has(letter);

            return (
              <button
                key={letter}
                disabled={!isAvailable}
                onClick={() => setSelectedLetter(letter)}
                className={`min-w-7 h-7 px-1.5 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : isAvailable
                    ? 'bg-slate-100 text-slate-700 hover:bg-[#E6F4F3] hover:text-[#0F766E]'
                    : 'text-slate-300 cursor-not-allowed bg-slate-50'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Clean Grid of Brand Tiles (6 per row desktop, 3 per row mobile) */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 font-body mb-4 px-1">
          <span>Showing {filteredBrands.length} of {initialBrands.length} brands</span>
          {(searchQuery || selectedLetter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLetter('ALL');
              }}
              className="text-[#0F766E] font-semibold hover:underline font-heading cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {filteredBrands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <p className="text-slate-700 font-heading font-semibold text-sm">
              No brands match &quot;{searchQuery || selectedLetter}&quot;
            </p>
            <p className="text-xs text-slate-400 font-body">
              Try searching with another keyword or selecting a different letter from the A–Z bar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brand/${brand.slug}`}
                className="group bg-white rounded-xl border border-slate-200 hover:border-[#0F766E] p-3.5 flex flex-col items-center text-center shadow-2xs hover:shadow-md transition-all duration-200"
              >
                {/* Logo or clean Wordmark in Poppins 600 */}
                <div className="w-full h-16 rounded-lg bg-[#F1F5F9] border border-slate-100 mb-2.5 flex items-center justify-center p-2 overflow-hidden group-hover:scale-105 transition-transform">
                  {brand.logo || brand.logoUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={brand.logoUrl || brand.logo}
                        alt={brand.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 33vw, 16vw"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <span className="font-heading font-semibold text-xs text-slate-700 uppercase tracking-wider truncate px-1">
                      {brand.name}
                    </span>
                  )}
                </div>

                {/* Brand Name (Poppins 600) */}
                <h3 className="font-heading font-semibold text-xs text-slate-800 group-hover:text-[#0F766E] line-clamp-1 transition-colors">
                  {brand.name}
                </h3>

                {/* Product Count */}
                <span className="text-[10px] text-slate-400 font-body mt-0.5">
                  {brand.productCount} Products
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandsDirectoryClient;
