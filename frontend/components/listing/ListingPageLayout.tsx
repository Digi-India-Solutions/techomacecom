'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Product, Brand, Category, PageBanner } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import { 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Star, 
  Check, 
  Search 
} from 'lucide-react';

export interface ListingPageLayoutProps {
  title: string;
  description?: string;
  ratingScore?: number;
  ratingCount?: number;
  breadcrumbs: Array<{ label: string; href?: string }>;
  banners: PageBanner[];
  products: Product[];
  brands?: Brand[];
  categories?: Category[];
  initialSubCategory?: string;
}

export const ListingPageLayout: React.FC<ListingPageLayoutProps> = ({
  title,
  description,
  ratingScore = 4.8,
  ratingCount = 1240,
  breadcrumbs,
  banners,
  products,
  brands = [],
  categories = [],
  initialSubCategory = ''
}) => {
  // Filters state
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialSubCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(250000);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<
    'recommended' | 'popularity' | 'price-asc' | 'price-desc' | 'newest' | 'discount'
  >('recommended');

  // Popover open states
  const [activePopover, setActivePopover] = useState<
    'brand' | 'category' | 'price' | 'discount' | 'rating' | null
  >(null);
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 12;

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Subcategory filter
    if (selectedSubCategory) {
      list = list.filter((p) => p.subCategorySlug === selectedSubCategory || p.subCategory === selectedSubCategory);
    }

    // Brands filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brandId) || selectedBrands.includes(p.brandName));
    }

    // Price max filter
    list = list.filter((p) => p.price <= priceRange);

    // Discount filter
    if (minDiscount > 0) {
      list = list.filter((p) => p.discountPercentage >= minDiscount);
    }

    // In stock
    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    // Rating
    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case 'discount':
        list.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case 'popularity':
        list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case 'recommended':
      default:
        list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.rating - a.rating);
        break;
    }

    return list;
  }, [
    products,
    selectedSubCategory,
    selectedBrands,
    priceRange,
    minDiscount,
    inStockOnly,
    minRating,
    sortBy
  ]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetAllFilters = () => {
    setSelectedSubCategory('');
    setSelectedBrands([]);
    setPriceRange(250000);
    setMinDiscount(0);
    setInStockOnly(false);
    setMinRating(0);
    setSortBy('recommended');
    setCurrentPage(1);
    setActivePopover(null);
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(selectedSubCategory) ||
    selectedBrands.length > 0 ||
    priceRange < 250000 ||
    minDiscount > 0 ||
    inStockOnly ||
    minRating > 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP BANNER SLIDER (~190px desktop / ~120px mobile) */}
      {banners && banners.length > 0 && (
        <PageBannerSlider banners={banners} className="mb-2" />
      )}

      {/* 2. BREADCRUMBS & META HEADER */}
      <div className="space-y-3">
        {/* Breadcrumb Left & Count Right */}
        <div className="flex items-center justify-between text-xs text-[#5B6B82] font-body flex-wrap gap-2">
          <nav className="flex items-center gap-1.5 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-[#1D5FAF] transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-[#12263F] font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <span className="font-semibold text-[#174E90] bg-[#EAF2FC] px-2.5 py-0.5 rounded-full text-[12px]">
            {filteredProducts.length} Products
          </span>
        </div>

        {/* Page Title & Rating Summary */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1 border-b border-[#DCE6F2] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#12263F] font-heading tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-1.5 max-w-3xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Rating Summary ("4.7 ★★★★☆") */}
          <div className="flex items-center gap-2 bg-amber-50/90 text-[#12263F] border border-amber-200/60 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto font-body text-xs">
            <span className="font-bold text-sm text-[#12263F] font-heading">{ratingScore.toFixed(1)}</span>
            <div className="flex text-[#F5B841]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(ratingScore) ? 'fill-current' : 'fill-[#DCE6F2] text-[#DCE6F2]'
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] text-[#5B6B82] font-medium">({ratingCount.toLocaleString('en-IN')})</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER BAR WITH OUTLINED PILL BUTTONS & SORT DROPDOWN */}
      <div ref={filterBarRef} className="space-y-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE6F2] shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Left: "FILTERS BY" + Pill Buttons (Desktop) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-bold text-[#5B6B82] uppercase tracking-wider font-heading mr-1">
              FILTERS BY:
            </span>

            {/* Brands Popover Pill */}
            {brands.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'brand' ? null : 'brand')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                    selectedBrands.length > 0
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                      : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                  }`}
                >
                  <span>Brands {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'brand' ? 'rotate-180' : ''}`} />
                </button>

                {activePopover === 'brand' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-3 z-30 animate-in fade-in space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#5B6B82] absolute left-2.5 top-2.5" />
                      <input
                        id="listing-brand-search"
                        name="brandSearch"
                        type="search"
                        autoComplete="off"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="Search brands..."
                        className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-[#F6F9FD] border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-body text-xs">
                      {brands
                        .filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase().trim()))
                        .map((b) => (
                          <label
                            key={b.id}
                            className="flex items-center justify-between p-1.5 rounded hover:bg-[#EAF2FC]/60 cursor-pointer text-[#12263F] select-none"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(b.id)}
                                onChange={() => toggleBrand(b.id)}
                                className="w-3.5 h-3.5 rounded text-[#1D5FAF] focus:ring-[#1D5FAF]"
                              />
                              <span className="truncate">{b.name}</span>
                            </span>
                            <span className="text-[11px] text-[#5B6B82]">({b.productCount})</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Range Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'price' ? null : 'price')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                  priceRange < 250000
                    ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                    : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                }`}
              >
                <span>Price {priceRange < 250000 ? `(≤ ₹${(priceRange / 1000).toFixed(0)}k)` : ''}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'price' ? 'rotate-180' : ''}`} />
              </button>

              {activePopover === 'price' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-4 z-30 animate-in fade-in space-y-3 font-body">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#12263F]">Max Price:</span>
                    <span className="font-bold text-[#1D5FAF]">₹{priceRange.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    id="listing-price-range"
                    name="priceRange"
                    type="range"
                    min={500}
                    max={250000}
                    step={2000}
                    value={priceRange}
                    onChange={(e) => {
                      setPriceRange(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-[#1D5FAF] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#5B6B82] font-semibold">
                    <span>₹500</span>
                    <span>₹2.5 Lakh</span>
                  </div>
                </div>
              )}
            </div>

            {/* Availability Pill */}
            <button
              type="button"
              onClick={() => {
                setInStockOnly(!inStockOnly);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                inStockOnly
                  ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                  : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
              }`}
            >
              {inStockOnly && <Check className="w-3.5 h-3.5" />}
              <span>In Stock Only</span>
            </button>

            {/* Discount Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'discount' ? null : 'discount')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                  minDiscount > 0
                    ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                    : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                }`}
              >
                <span>Discount {minDiscount > 0 ? `(${minDiscount}%+)` : ''}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'discount' ? 'rotate-180' : ''}`} />
              </button>

              {activePopover === 'discount' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-2 z-30 animate-in fade-in space-y-1 font-body text-xs">
                  {[0, 10, 20, 30, 40].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => {
                        setMinDiscount(disc);
                        setActivePopover(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        minDiscount === disc
                          ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                          : 'text-[#12263F] hover:bg-[#F6F9FD]'
                      }`}
                    >
                      <span>{disc === 0 ? 'All Discounts' : `${disc}% or more`}</span>
                      {minDiscount === disc && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rating Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'rating' ? null : 'rating')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                  minRating > 0
                    ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                    : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                }`}
              >
                <span>Rating {minRating > 0 ? `(${minRating}★+)` : ''}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'rating' ? 'rotate-180' : ''}`} />
              </button>

              {activePopover === 'rating' && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-2 z-30 animate-in fade-in space-y-1 font-body text-xs">
                  {[0, 4.5, 4.0, 3.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setMinRating(r);
                        setActivePopover(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        minRating === r
                          ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                          : 'text-[#12263F] hover:bg-[#F6F9FD]'
                      }`}
                    >
                      <span>{r === 0 ? 'All Ratings' : `${r}★ & above`}</span>
                      {minRating === r && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: "Sort by" dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto font-body text-xs">
            <span className="text-[#5B6B82] font-semibold hidden md:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-[#F6F9FD] hover:bg-[#EAF2FC] text-[#12263F] font-semibold border border-[#DCE6F2] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#1D5FAF] cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="popularity">Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="discount">Discount: High to Low</option>
            </select>
          </div>
        </div>

        {/* Removable Filter Chips Row */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-xs font-body pt-1">
            <span className="text-[#5B6B82] text-[12px] font-semibold">Active:</span>

            {selectedBrands.map((bId) => {
              const brand = brands.find((b) => b.id === bId);
              return (
                <span
                  key={bId}
                  className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2.5 py-1 rounded-full font-medium"
                >
                  <span>Brand: {brand ? brand.name : bId}</span>
                  <button
                    onClick={() => toggleBrand(bId)}
                    className="hover:text-[#0B2545] cursor-pointer"
                    aria-label="Remove brand filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {priceRange < 250000 && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2.5 py-1 rounded-full font-medium">
                <span>Max: ₹{priceRange.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => setPriceRange(250000)}
                  className="hover:text-[#0B2545] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2.5 py-1 rounded-full font-medium">
                <span>In Stock</span>
                <button
                  onClick={() => setInStockOnly(false)}
                  className="hover:text-[#0B2545] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minDiscount > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2.5 py-1 rounded-full font-medium">
                <span>{minDiscount}%+ Discount</span>
                <button
                  onClick={() => setMinDiscount(0)}
                  className="hover:text-[#0B2545] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2.5 py-1 rounded-full font-medium">
                <span>{minRating}★+ Rating</span>
                <button
                  onClick={() => setMinRating(0)}
                  className="hover:text-[#0B2545] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-[#1D5FAF] font-semibold hover:underline text-[12px] ml-1 cursor-pointer font-heading"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 4. PRODUCT GRID */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCE6F2] p-12 text-center space-y-3">
          <p className="text-[#12263F] font-heading font-semibold text-base">
            No products match the selected criteria.
          </p>
          <p className="text-xs text-[#5B6B82] font-body max-w-md mx-auto">
            Try adjusting your price range, clearing brand selections, or resetting all filters.
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-2 px-5 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white text-xs font-bold rounded-xl font-heading transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {paginatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* 5. PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-6 font-heading text-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3.5 py-2 rounded-xl border border-[#DCE6F2] text-[#12263F] disabled:opacity-40 hover:bg-[#EAF2FC] cursor-pointer"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-9 h-9 rounded-xl font-bold cursor-pointer transition-colors ${
                currentPage === i + 1
                  ? 'bg-[#1D5FAF] text-white shadow-xs'
                  : 'border border-[#DCE6F2] text-[#12263F] hover:bg-[#EAF2FC]'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3.5 py-2 rounded-xl border border-[#DCE6F2] text-[#12263F] disabled:opacity-40 hover:bg-[#EAF2FC] cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingPageLayout;
