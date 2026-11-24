'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Product, Brand, Category, SubCategory, PageBanner } from '@/types';
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
  Search,
  FolderTree,
  Layers
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
  subCategories?: SubCategory[];
  currentCategorySlug?: string;
  parentCategory?: { name: string; slug: string } | null;
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
  subCategories = [],
  currentCategorySlug = '',
  parentCategory = null,
  initialSubCategory = ''
}) => {
  // Filters state
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialSubCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  // Slider ceiling follows the real catalog (at least ₹2.5L), rounded up to the next ₹10k
  const priceCeiling = useMemo(
    () => Math.max(250000, Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 10000) * 10000),
    [products]
  );
  const [priceRange, setPriceRange] = useState<number>(priceCeiling);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<
    'recommended' | 'popularity' | 'price-asc' | 'price-desc' | 'newest' | 'discount'
  >('recommended');

  // Popover open states
  const [activePopover, setActivePopover] = useState<
    'subcategory' | 'brand' | 'category' | 'price' | 'discount' | 'rating' | null
  >(null);
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
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
      list = list.filter(
        (p) =>
          p.subCategorySlug === selectedSubCategory ||
          p.subCategory === selectedSubCategory ||
          p.leafCategoryId === selectedSubCategory ||
          (p.categoryPath || []).some(
            (c) =>
              c.slug === selectedSubCategory ||
              c.id === selectedSubCategory ||
              c.name.toLowerCase() === selectedSubCategory.toLowerCase()
          )
      );
    }

    // Brands filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brandId) || selectedBrands.includes(p.brandName));
    }

    // Price max filter
    if (priceRange < priceCeiling) list = list.filter((p) => p.price <= priceRange);

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
    priceCeiling,
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
    setPriceRange(priceCeiling);
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
    priceRange < priceCeiling ||
    minDiscount > 0 ||
    inStockOnly ||
    minRating > 0;

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6">
      {/* 1. TOP BANNER SLIDER (~190px desktop / ~120px mobile) */}
      {banners && banners.length > 0 && (
        <PageBannerSlider banners={banners} className="mb-2" />
      )}

      {/* 2. BREADCRUMBS & META HEADER */}
      <div className="space-y-2.5 sm:space-y-3">
        {/* Breadcrumb Left & Count Right */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#5B6B82] font-body flex-wrap gap-2">
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

          <span className="font-semibold text-[#174E90] bg-[#EAF2FC] px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-[12px]">
            {filteredProducts.length} Products
          </span>
        </div>

        {/* Page Title, Clamped Description & Rating Summary */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1 border-b border-[#DCE6F2] pb-3 sm:pb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl sm:text-3xl font-bold sm:font-semibold text-[#12263F] font-heading tracking-tight">
                {title}
              </h1>

              {/* Mobile Rating Pill (Compact, right aligned on mobile title row) */}
              <div className="flex sm:hidden items-center gap-1 bg-amber-50/90 text-[#12263F] border border-amber-200/60 px-2 py-0.5 rounded-lg shrink-0 font-body text-xs">
                <span className="font-bold text-xs text-[#12263F] font-heading">{ratingScore.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-[#F5B841] text-[#F5B841]" />
                <span className="text-[10px] text-[#5B6B82] font-medium">({ratingCount.toLocaleString('en-IN')})</span>
              </div>
            </div>

            {description && (
              <div className="mt-1">
                <p className={`text-xs sm:text-sm text-[#5B6B82] font-body max-w-3xl leading-relaxed ${
                  !isDescExpanded ? 'line-clamp-2 sm:line-clamp-none' : ''
                }`}>
                  {description}
                </p>
                {description.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-[11px] font-bold text-[#1D5FAF] hover:underline sm:hidden mt-0.5 inline-block cursor-pointer font-heading"
                  >
                    {isDescExpanded ? 'Show less ▲' : 'Read more ▼'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Rating Summary ("4.7 ★★★★☆ (1,240)") */}
          <div className="hidden sm:flex items-center gap-2 bg-amber-50/90 text-[#12263F] border border-amber-200/60 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto font-body text-xs">
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

      {/* 2.5 SUBCATEGORIES STRIP */}
      {subCategories && subCategories.length > 0 && (
        <div className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-2.5 sm:space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1D5FAF]" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-xs sm:text-base text-[#12263F]">
                  {parentCategory ? `Subcategories in ${parentCategory.name}` : `Subcategories in ${title}`}
                </h2>
                <p className="text-[11px] sm:text-xs text-[#5B6B82] font-body hidden sm:block">
                  Select a subcategory to browse specific equipment & instruments
                </p>
              </div>
            </div>

            <span className="text-[11px] sm:text-xs font-semibold text-[#174E90] bg-[#EAF2FC] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-heading">
              {subCategories.length} {subCategories.length === 1 ? 'Subcategory' : 'Subcategories'}
            </span>
          </div>

          {/* Cards: Horizontal scroll rail on mobile, multi-column grid on sm+ */}
          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 pt-0.5 snap-x">
            {/* "All" Card */}
            {parentCategory ? (
              <Link
                href={`/category/${parentCategory.slug}`}
                className={`group w-[105px] xs:w-[120px] sm:w-auto shrink-0 snap-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex flex-col items-center text-center cursor-pointer ${
                  !selectedSubCategory && currentCategorySlug === parentCategory.slug
                    ? 'border-[#1D5FAF] bg-white ring-2 ring-[#1D5FAF]/30 shadow-xs'
                    : 'border-[#DCE6F2] bg-white hover:border-[#1D5FAF] hover:shadow-xs'
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D5FAF]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#12263F] group-hover:text-[#1D5FAF] font-heading line-clamp-1">
                  All {parentCategory.name}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#5B6B82] font-body mt-0.5">
                  View All
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubCategory('');
                  setCurrentPage(1);
                }}
                className={`group w-[105px] xs:w-[120px] sm:w-auto shrink-0 snap-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex flex-col items-center text-center cursor-pointer ${
                  !selectedSubCategory
                    ? 'border-[#1D5FAF] bg-white ring-2 ring-[#1D5FAF]/30 shadow-xs'
                    : 'border-[#DCE6F2] bg-white hover:border-[#1D5FAF] hover:shadow-xs'
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D5FAF]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#12263F] group-hover:text-[#1D5FAF] font-heading line-clamp-1">
                  All Products
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#5B6B82] font-body mt-0.5">
                  {products.length} Products
                </span>
              </button>
            )}

            {/* Subcategories list */}
            {subCategories.map((sub) => {
              const isActive = selectedSubCategory === sub.slug || currentCategorySlug === sub.slug;
              const subImg = sub.image || sub.icon;

              return (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className={`group w-[105px] xs:w-[120px] sm:w-auto shrink-0 snap-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex flex-col items-center text-center cursor-pointer ${
                    isActive
                      ? 'border-[#1D5FAF] bg-white ring-2 ring-[#1D5FAF]/30 shadow-xs'
                      : 'border-[#DCE6F2] bg-white hover:border-[#1D5FAF] hover:shadow-xs'
                  }`}
                >
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center mb-1.5 overflow-hidden group-hover:scale-105 transition-transform">
                    {subImg ? (
                      <img
                        src={subImg}
                        alt={sub.name}
                        className="w-full h-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <FolderTree className="w-5 h-5 sm:w-6 sm:h-6 text-[#1D5FAF]" />
                    )}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-bold font-heading line-clamp-1 ${
                    isActive ? 'text-[#1D5FAF]' : 'text-[#12263F] group-hover:text-[#1D5FAF]'
                  }`}>
                    {sub.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#5B6B82] font-body mt-0.5">
                    {sub.itemCount !== undefined ? `${sub.itemCount} Products` : 'Browse'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FILTER BAR WITH OUTLINED PILL BUTTONS & SORT DROPDOWN */}
      <div ref={filterBarRef} className="space-y-2 sm:space-y-3">
        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#DCE6F2] shadow-xs">
          {/* Mobile Top Row: Filters Indicator + Active Count & Sort Dropdown */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#EAF2FC] sm:hidden">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#1D5FAF]" />
              <span className="text-[11px] font-bold text-[#12263F] uppercase tracking-wider font-heading">
                Filters
              </span>
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-[#1D5FAF] text-white text-[10px] font-bold flex items-center justify-center">
                  {[Boolean(selectedSubCategory), selectedBrands.length > 0, priceRange < priceCeiling, inStockOnly, minDiscount > 0, minRating > 0].filter(Boolean).length}
                </span>
              )}
            </div>

            {/* Mobile Sort Dropdown */}
            <div className="flex items-center gap-1.5 font-body text-xs">
              <span className="text-[#5B6B82] text-[11px] font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-[#F6F9FD] text-[#12263F] text-[11px] font-semibold border border-[#DCE6F2] rounded-lg px-2 py-1 focus:outline-none focus:border-[#1D5FAF]"
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills Rail: Horizontal swipe on mobile, flex-wrap on desktop */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 sm:py-0 w-full sm:w-auto sm:flex-wrap">
              <span className="text-[12px] font-bold text-[#5B6B82] uppercase tracking-wider font-heading mr-1 hidden sm:inline">
                FILTERS BY:
              </span>

              {/* Subcategories Popover Pill */}
              {subCategories && subCategories.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'subcategory' ? null : 'subcategory')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading whitespace-nowrap ${
                      selectedSubCategory
                        ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                        : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                    }`}
                  >
                    <span>
                      Subcategory {selectedSubCategory ? `(${subCategories.find((s) => s.slug === selectedSubCategory)?.name || selectedSubCategory})` : ''}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'subcategory' ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop Dropdown Popover */}
                  {activePopover === 'subcategory' && (
                    <div className="hidden md:block absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-2 z-30 animate-in fade-in space-y-1 font-body text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubCategory('');
                          setActivePopover(null);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          !selectedSubCategory
                            ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                            : 'text-[#12263F] hover:bg-[#F6F9FD]'
                        }`}
                      >
                        <span>All Subcategories</span>
                        {!selectedSubCategory && <Check className="w-3.5 h-3.5" />}
                      </button>
                      {subCategories.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubCategory(selectedSubCategory === sub.slug ? '' : sub.slug);
                            setActivePopover(null);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            selectedSubCategory === sub.slug
                              ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                              : 'text-[#12263F] hover:bg-[#F6F9FD]'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {sub.itemCount !== undefined && (
                              <span className="text-[11px] text-[#5B6B82]">({sub.itemCount})</span>
                            )}
                            {selectedSubCategory === sub.slug && <Check className="w-3.5 h-3.5 text-[#1D5FAF]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Brands Popover Pill */}
              {brands.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === 'brand' ? null : 'brand')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading whitespace-nowrap ${
                      selectedBrands.length > 0
                        ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                        : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                    }`}
                  >
                    <span>Brands {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'brand' ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop Dropdown Popover */}
                  {activePopover === 'brand' && (
                    <div className="hidden md:block absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-3 z-30 animate-in fade-in space-y-2">
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
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'price' ? null : 'price')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading whitespace-nowrap ${
                    priceRange < priceCeiling
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                      : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                  }`}
                >
                  <span>Price {priceRange < priceCeiling ? `(≤ ₹${(priceRange / 1000).toFixed(0)}k)` : ''}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'price' ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Dropdown Popover */}
                {activePopover === 'price' && (
                  <div className="hidden md:block absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-4 z-30 animate-in fade-in space-y-3 font-body">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#12263F]">Max Price:</span>
                      <span className="font-bold text-[#1D5FAF]">₹{priceRange.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      id="listing-price-range"
                      name="priceRange"
                      type="range"
                      min={500}
                      max={priceCeiling}
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
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading whitespace-nowrap ${
                  inStockOnly
                    ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                    : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                }`}
              >
                {inStockOnly && <Check className="w-3.5 h-3.5" />}
                <span>In Stock Only</span>
              </button>

              {/* Discount Pill */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'discount' ? null : 'discount')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading whitespace-nowrap ${
                    minDiscount > 0
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                      : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                  }`}
                >
                  <span>Discount {minDiscount > 0 ? `(${minDiscount}%+)` : ''}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'discount' ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Dropdown Popover */}
                {activePopover === 'discount' && (
                  <div className="hidden md:block absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-2 z-30 animate-in fade-in space-y-1 font-body text-xs">
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
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === 'rating' ? null : 'rating')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer font-heading whitespace-nowrap ${
                    minRating > 0
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90]'
                      : 'border-[#DCE6F2] bg-white text-[#12263F] hover:border-[#1D5FAF]'
                  }`}
                >
                  <span>Rating {minRating > 0 ? `(${minRating}★+)` : ''}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopover === 'rating' ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Dropdown Popover */}
                {activePopover === 'rating' && (
                  <div className="hidden md:block absolute top-full left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#DCE6F2] p-2 z-30 animate-in fade-in space-y-1 font-body text-xs">
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

            {/* Desktop Right: "Sort by" dropdown */}
            <div className="hidden sm:flex items-center gap-2 self-end sm:self-auto font-body text-xs shrink-0">
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
        </div>

        {/* Removable Filter Chips Row */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap text-xs font-body">
            <span className="text-[#5B6B82] text-[11px] sm:text-[12px] font-semibold shrink-0">Active:</span>

            {selectedSubCategory && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium shrink-0 text-[11px] sm:text-xs">
                <span>
                  Subcategory: {subCategories?.find((s) => s.slug === selectedSubCategory)?.name || selectedSubCategory}
                </span>
                <button
                  onClick={() => setSelectedSubCategory('')}
                  className="hover:text-[#0B2545] cursor-pointer p-0.5"
                  aria-label="Remove subcategory filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBrands.map((bId) => {
              const brand = brands.find((b) => b.id === bId);
              return (
                <span
                  key={bId}
                  className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium shrink-0 text-[11px] sm:text-xs"
                >
                  <span>Brand: {brand ? brand.name : bId}</span>
                  <button
                    onClick={() => toggleBrand(bId)}
                    className="hover:text-[#0B2545] cursor-pointer p-0.5"
                    aria-label="Remove brand filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {priceRange < priceCeiling && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium shrink-0 text-[11px] sm:text-xs">
                <span>Max: ₹{priceRange.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => setPriceRange(priceCeiling)}
                  className="hover:text-[#0B2545] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium shrink-0 text-[11px] sm:text-xs">
                <span>In Stock</span>
                <button
                  onClick={() => setInStockOnly(false)}
                  className="hover:text-[#0B2545] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minDiscount > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium shrink-0 text-[11px] sm:text-xs">
                <span>{minDiscount}%+ Discount</span>
                <button
                  onClick={() => setMinDiscount(0)}
                  className="hover:text-[#0B2545] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium shrink-0 text-[11px] sm:text-xs">
                <span>{minRating}★+ Rating</span>
                <button
                  onClick={() => setMinRating(0)}
                  className="hover:text-[#0B2545] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-[#1D5FAF] font-semibold hover:underline text-[11px] sm:text-[12px] ml-1 cursor-pointer font-heading shrink-0"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 3.5 MOBILE BOTTOM SHEET FOR ACTIVE FILTER POPOVER */}
      {activePopover && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setActivePopover(null)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative bg-white rounded-t-3xl border-t border-[#DCE6F2] p-4 sm:p-5 shadow-2xl max-h-[82vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-[#DCE6F2] rounded-full mx-auto mb-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F2] shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#1D5FAF]" />
                <h3 className="font-heading font-bold text-sm text-[#12263F] capitalize">
                  {activePopover === 'subcategory' && 'Select Subcategory'}
                  {activePopover === 'brand' && 'Filter by Brand'}
                  {activePopover === 'price' && 'Filter by Price Range'}
                  {activePopover === 'discount' && 'Filter by Minimum Discount'}
                  {activePopover === 'rating' && 'Filter by Customer Rating'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="w-7 h-7 rounded-full bg-[#F6F9FD] border border-[#DCE6F2] flex items-center justify-center text-[#5B6B82] hover:text-[#12263F]"
                aria-label="Close filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="overflow-y-auto py-2 space-y-2 font-body text-xs flex-1">
              {activePopover === 'subcategory' && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubCategory('');
                      setActivePopover(null);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                      !selectedSubCategory
                        ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                        : 'text-[#12263F] hover:bg-[#F6F9FD]'
                    }`}
                  >
                    <span>All Subcategories</span>
                    {!selectedSubCategory && <Check className="w-4 h-4 text-[#1D5FAF]" />}
                  </button>
                  {subCategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubCategory(selectedSubCategory === sub.slug ? '' : sub.slug);
                        setActivePopover(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        selectedSubCategory === sub.slug
                          ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                          : 'text-[#12263F] hover:bg-[#F6F9FD]'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sub.itemCount !== undefined && (
                          <span className="text-[11px] text-[#5B6B82]">({sub.itemCount})</span>
                        )}
                        {selectedSubCategory === sub.slug && <Check className="w-4 h-4 text-[#1D5FAF]" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activePopover === 'brand' && (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#5B6B82] absolute left-3 top-3" />
                    <input
                      type="search"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="w-full text-xs pl-8 pr-3 py-2 bg-[#F6F9FD] border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {brands
                      .filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase().trim()))
                      .map((b) => (
                        <label
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF2FC]/60 cursor-pointer text-[#12263F] select-none"
                        >
                          <span className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(b.id)}
                              onChange={() => toggleBrand(b.id)}
                              className="w-4 h-4 rounded text-[#1D5FAF] focus:ring-[#1D5FAF]"
                            />
                            <span className="text-xs font-medium">{b.name}</span>
                          </span>
                          <span className="text-[11px] text-[#5B6B82]">({b.productCount})</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {activePopover === 'price' && (
                <div className="p-2 space-y-4 font-body">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#12263F]">Max Price:</span>
                    <span className="font-bold text-base text-[#1D5FAF]">₹{priceRange.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={priceCeiling}
                    step={2000}
                    value={priceRange}
                    onChange={(e) => {
                      setPriceRange(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-[#1D5FAF] cursor-pointer h-2"
                  />
                  <div className="flex justify-between text-[11px] text-[#5B6B82] font-semibold">
                    <span>₹500</span>
                    <span>₹{(priceCeiling / 100000).toFixed(1)} Lakh</span>
                  </div>
                </div>
              )}

              {activePopover === 'discount' && (
                <div className="space-y-1">
                  {[0, 10, 20, 30, 40].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => {
                        setMinDiscount(disc);
                        setActivePopover(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        minDiscount === disc
                          ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                          : 'text-[#12263F] hover:bg-[#F6F9FD]'
                      }`}
                    >
                      <span>{disc === 0 ? 'All Discounts' : `${disc}% or more`}</span>
                      {minDiscount === disc && <Check className="w-4 h-4 text-[#1D5FAF]" />}
                    </button>
                  ))}
                </div>
              )}

              {activePopover === 'rating' && (
                <div className="space-y-1">
                  {[0, 4.5, 4.0, 3.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setMinRating(r);
                        setActivePopover(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        minRating === r
                          ? 'bg-[#EAF2FC] text-[#174E90] font-bold'
                          : 'text-[#12263F] hover:bg-[#F6F9FD]'
                      }`}
                    >
                      <span>{r === 0 ? 'All Ratings' : `${r}★ & above`}</span>
                      {minRating === r && <Check className="w-4 h-4 text-[#1D5FAF]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#DCE6F2] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="w-full py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Apply ({filteredProducts.length} Products)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRODUCT GRID */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCE6F2] p-8 sm:p-12 text-center space-y-3">
          <p className="text-[#12263F] font-heading font-semibold text-sm sm:text-base">
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {paginatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* 5. PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-4 sm:pt-6 font-heading text-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-[#DCE6F2] text-[#12263F] disabled:opacity-40 hover:bg-[#EAF2FC] cursor-pointer text-xs"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl font-bold cursor-pointer transition-colors text-xs ${
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
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-[#DCE6F2] text-[#12263F] disabled:opacity-40 hover:bg-[#EAF2FC] cursor-pointer text-xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingPageLayout;
