import React from 'react';
import {
  Skeleton,
  SkeletonText,
  LoadingRegion,
  BreadcrumbSkeleton,
  SectionHeaderSkeleton,
  BannerSkeleton,
  ProductGridSkeleton,
  ProductRailSkeleton,
  BlogCardSkeleton
} from '@/components/common/Skeleton';

/* ============================================================================
   PAGE SKELETONS
   Each one mirrors the layout of a real page so nothing jumps when data arrives.
   Used by the route loading.tsx files (server data) and by client pages while
   the localStorage-backed stores hydrate (cart, checkout, account).
   ============================================================================ */

/* ───────────────────────── Generic fallback ───────────────────────── */

/** Neutral page: used by app/loading.tsx for any route without its own skeleton */
export const PageSkeleton: React.FC = () => (
  <LoadingRegion className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
    <BreadcrumbSkeleton />
    <div className="space-y-3">
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="h-3.5 w-[32rem] max-w-full" />
    </div>
    <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 sm:p-8 space-y-6 shadow-xs">
      <SkeletonText lines={4} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <SkeletonText lines={3} />
    </div>
  </LoadingRegion>
);

/* ───────────────────────────── Home ───────────────────────────── */

export const HomePageSkeleton: React.FC = () => (
  <LoadingRegion label="Loading store…" className="flex flex-col min-h-screen bg-[#F6F9FD]">
    {/* Hero slider */}
    <Skeleton className="w-full aspect-[16/10] sm:aspect-[16/8] md:aspect-[1920/480] max-h-[500px] rounded-none" />

    {/* Trust strip */}
    <div className="max-w-[1320px] w-full mx-auto px-4 sm:px-6 mt-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#DCE6F2] p-3 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Top categories — vertical cards */}
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <SectionHeaderSkeleton />
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36 sm:w-44 bg-white rounded-2xl border border-[#DCE6F2] p-3 space-y-3">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-3.5 w-4/5 mx-auto" />
              <Skeleton className="h-3 w-3/5 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Shop by brand */}
    <section className="my-4 sm:my-6">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <SectionHeaderSkeleton />
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-36 sm:w-44 bg-white rounded-2xl border border-[#DCE6F2] p-3 space-y-2.5">
              <Skeleton className="w-full h-24 sm:h-28 rounded-xl" />
              <Skeleton className="h-3.5 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Featured bento */}
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="min-h-[200px] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="lg:col-span-4 min-h-[380px] rounded-2xl" />
        </div>
      </div>
    </section>

    {/* Deal of the day + New arrivals */}
    <ProductRailSkeleton />
    <ProductRailSkeleton />
  </LoadingRegion>
);

/* ───────────────────────── Listing / category ───────────────────────── */

/** Matches components/listing/ListingPageLayout.tsx (category, best sellers, new arrivals) */
export const ListingPageSkeleton: React.FC<{ banner?: boolean }> = ({ banner = true }) => (
  <LoadingRegion label="Loading products…" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
    {banner && <BannerSkeleton className="mb-2" />}

    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <BreadcrumbSkeleton />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 border-b border-[#DCE6F2] pb-4">
        <div className="space-y-2.5 flex-1">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-3.5 w-[36rem] max-w-full" />
        </div>
        <Skeleton className="h-8 w-40 rounded-xl" />
      </div>
    </div>

    {/* Filter pills + sort */}
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 overflow-hidden">
        {[20, 24, 20, 24, 28].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full shrink-0" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <Skeleton className="hidden sm:block h-8 w-36 rounded-full shrink-0" />
    </div>

    <ProductGridSkeleton count={8} />
  </LoadingRegion>
);

/** Matches app/search/page.tsx */
export const SearchPageSkeleton: React.FC = () => (
  <LoadingRegion label="Searching…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
    <BreadcrumbSkeleton />
    <div className="bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-80 max-w-full" />
      </div>
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
    <ProductGridSkeleton count={8} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" />
  </LoadingRegion>
);

/** Matches app/offers/page.tsx */
export const OffersPageSkeleton: React.FC = () => (
  <LoadingRegion label="Loading offers…" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">
    <BannerSkeleton />
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border-2 border-dashed border-[#DCE6F2] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <SkeletonText lines={2} />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
    {[0, 1].map((s) => (
      <div key={s} className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <ProductGridSkeleton count={4} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" />
      </div>
    ))}
  </LoadingRegion>
);

/* ───────────────────────────── Brands ───────────────────────────── */

/** Matches components/brand/BrandsDirectoryClient.tsx */
export const BrandsDirectorySkeleton: React.FC = () => (
  <LoadingRegion label="Loading brands…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
    <BannerSkeleton className="mb-2" />
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-12 w-full md:w-[440px] lg:w-[520px] rounded-xl" />
      </div>
      <div className="pt-4 border-t border-[#DCE6F2] flex items-center gap-1.5 overflow-hidden">
        {Array.from({ length: 27 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-7 rounded-lg shrink-0" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#DCE6F2] p-3.5 space-y-3">
          <Skeleton className="w-full h-28 sm:h-32 rounded-lg" />
          <Skeleton className="h-3.5 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  </LoadingRegion>
);

/** Matches app/brand/[slug]/page.tsx */
export const BrandPageSkeleton: React.FC = () => (
  <LoadingRegion label="Loading brand…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">
    <BreadcrumbSkeleton />
    <div className="rounded-3xl bg-[#0B2545] border border-[#13335E] p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <Skeleton dark className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0" />
        <div className="space-y-3">
          <Skeleton dark className="h-8 w-56" />
          <Skeleton dark className="h-3.5 w-80 max-w-full" />
          <Skeleton dark className="h-3.5 w-64 max-w-full" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton dark className="h-16 w-28 rounded-xl" />
        <Skeleton dark className="h-16 w-28 rounded-xl" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-64" />
      <ProductGridSkeleton count={8} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" />
    </div>
  </LoadingRegion>
);

/* ───────────────────────────── Product ───────────────────────────── */

/** Matches components/product/ProductDetailClient.tsx (gallery left, buy box right) */
export const ProductDetailSkeleton: React.FC = () => (
  <LoadingRegion label="Loading product…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
    <BreadcrumbSkeleton className="mb-6" />

    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] gap-6 xl:gap-8 items-start mb-12">
      {/* Gallery */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3.5 items-start">
          <div className="hidden lg:flex flex-col gap-2 w-[88px] shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-[84px] h-[84px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="flex-1 w-full aspect-square rounded-2xl" />
        </div>
        <div className="flex lg:hidden gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-16 h-16 rounded-lg shrink-0" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* Buy box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-2/3" />
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-7 w-40 rounded-md" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="p-4 bg-[#F6F9FD] rounded-xl border border-[#DCE6F2] space-y-3">
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-24" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-12 w-full sm:w-32 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DCE6F2]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Tabs + related */}
    <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 space-y-5 mb-12">
      <div className="flex gap-6 border-b border-[#DCE6F2] pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      <SkeletonText lines={5} />
    </div>
    <Skeleton className="h-6 w-56 mb-4" />
    <ProductGridSkeleton count={4} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4" />
  </LoadingRegion>
);

/* ───────────────────────────── Rentals ───────────────────────────── */

/** Matches components/rental/RentalCatalogClient.tsx */
export const RentalCatalogSkeleton: React.FC = () => (
  <LoadingRegion label="Loading rental equipment…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
    <div className="rounded-3xl bg-[#0B2545] p-6 sm:p-10 space-y-5 min-h-[320px]">
      <Skeleton dark className="h-6 w-40 rounded-full" />
      <Skeleton dark className="h-10 w-[28rem] max-w-full" />
      <Skeleton dark className="h-10 w-80 max-w-full" />
      <Skeleton dark className="h-3.5 w-[34rem] max-w-full" />
      <div className="flex gap-3 pt-2">
        <Skeleton dark className="h-11 w-40 rounded-xl" />
        <Skeleton dark className="h-11 w-36 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#DCE6F2] p-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-28 rounded-xl shrink-0" />
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden">
          <Skeleton className="w-full aspect-square rounded-none" />
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </LoadingRegion>
);

/** Matches components/rental/RentalDetailClient.tsx */
export const RentalDetailSkeleton: React.FC = () => (
  <LoadingRegion label="Loading rental…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
    <BreadcrumbSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        <Skeleton className="w-full aspect-4/3 rounded-2xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-xl shrink-0" />
          ))}
        </div>
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] space-y-5">
          <Skeleton className="h-6 w-48" />
          <SkeletonText lines={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DCE6F2] shadow-lg space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-3/4" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <SkeletonText lines={3} />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </LoadingRegion>
);

/** Matches components/account/RentalDetailView.tsx inside app/account/rentals/[id] */
export const AccountRentalDetailSkeleton: React.FC = () => (
  <LoadingRegion label="Loading rental details…" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-6">
    <Skeleton className="h-4 w-36" />
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-xs space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-64 max-w-full" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <Skeleton className="w-full aspect-square rounded-2xl" />
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-xs space-y-4">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  </LoadingRegion>
);

/* ───────────────────────────── Blog ───────────────────────────── */

/** Matches app/blog/page.tsx */
export const BlogListSkeleton: React.FC = () => (
  <LoadingRegion label="Loading articles…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-3">
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-9 w-80 max-w-full" />
      <Skeleton className="h-3.5 w-[36rem] max-w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  </LoadingRegion>
);

/** Matches app/blog/[slug]/page.tsx */
export const ArticleSkeleton: React.FC = () => (
  <LoadingRegion label="Loading article…" className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-8">
    <BreadcrumbSkeleton />
    <div className="space-y-4">
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-2/3" />
      <div className="flex items-center gap-4 pt-2 border-b border-[#DCE6F2] pb-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
    <Skeleton className="w-full aspect-16/9 rounded-3xl" />
    <div className="bg-white rounded-3xl border border-[#DCE6F2] p-6 sm:p-10 shadow-xs space-y-6">
      <SkeletonText lines={5} lineClassName="h-3.5" />
      <Skeleton className="h-6 w-56" />
      <SkeletonText lines={4} lineClassName="h-3.5" />
      <SkeletonText lines={3} lineClassName="h-3.5" />
    </div>
  </LoadingRegion>
);

/* ─────────────────────── Cart / checkout / account ─────────────────────── */

/** Matches app/cart/page.tsx */
export const CartSkeleton: React.FC = () => (
  <LoadingRegion label="Loading your bag…" className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
    <BreadcrumbSkeleton className="mb-4" />
    <Skeleton className="h-10 w-44 mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-8 divide-y divide-[#DCE6F2]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="py-6 first:pt-0 flex items-start gap-4 sm:gap-6">
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-40" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-4">
        <div className="bg-white rounded-xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
          <div className="pt-3 border-t border-[#DCE6F2] flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </LoadingRegion>
);

/**
 * Matches app/checkout/page.tsx and the rental checkout.
 * Pass `className=""` when the page already provides the outer container.
 */
export const CheckoutSkeleton: React.FC<{ className?: string }> = ({
  className = 'max-w-[1400px] mx-auto px-4 sm:px-6 py-8'
}) => (
  <LoadingRegion label="Loading checkout…" className={`space-y-6 ${className}`}>
    <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <Skeleton className="h-8 w-36 rounded-full" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        {Array.from({ length: 3 }).map((_, s) => (
          <div key={s} className="bg-white rounded-2xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: s === 0 ? 2 : 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </LoadingRegion>
);

/** Matches app/account/page.tsx (profile card, side nav, tab content) */
export const AccountSkeleton: React.FC = () => (
  <LoadingRegion label="Loading your account…" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <div className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-6 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-24 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
      <div className="flex lg:flex-col gap-1 overflow-hidden bg-white rounded-2xl border border-[#DCE6F2] p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 lg:w-full rounded-xl shrink-0" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#DCE6F2] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </LoadingRegion>
);

/** Order cards in the account "Your orders" tab while orders load */
export const OrderListSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => (
  <LoadingRegion label="Loading your orders…" className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden">
        <div className="bg-[#F6F9FD] border-b border-[#DCE6F2] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-8">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="p-5 space-y-4">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="hidden sm:block h-9 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </LoadingRegion>
);

/** Rental booking confirmation (app/rent/success) */
export const ConfirmationSkeleton: React.FC<{ className?: string }> = ({ className = 'px-4 sm:px-6' }) => (
  <LoadingRegion label="Loading booking status…" className={`max-w-3xl mx-auto py-10 space-y-6 ${className}`}>
    <div className="bg-white rounded-3xl border border-[#DCE6F2] p-8 shadow-xs space-y-5 text-center">
      <Skeleton className="w-16 h-16 rounded-full mx-auto" />
      <Skeleton className="h-7 w-72 max-w-full mx-auto" />
      <Skeleton className="h-3.5 w-96 max-w-full mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <Skeleton className="h-11 w-40 rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  </LoadingRegion>
);

