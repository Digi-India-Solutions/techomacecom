import React from 'react';

/* ============================================================================
   SKELETON PRIMITIVES
   Shimmer styles live in app/globals.css (.skeleton / .skeleton-dark).
   Page-level skeletons built from these are in components/skeletons/.
   ============================================================================ */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use on navy / blue backgrounds */
  dark?: boolean;
}

/** A single shimmering block. Size and shape come from `className`. */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', dark = false, ...rest }) => {
  const rounded = /\brounded/.test(className) ? '' : 'rounded-md';
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${dark ? 'skeleton-dark' : ''} ${rounded} ${className}`}
      {...rest}
    />
  );
};

/** Several lines of text; the last one is shorter so it reads like a paragraph. */
export const SkeletonText: React.FC<{ lines?: number; className?: string; lineClassName?: string }> = ({
  lines = 3,
  className = '',
  lineClassName = 'h-3'
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`${lineClassName} ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

/**
 * Wraps a loading view so screen readers announce it once ("Loading…")
 * instead of reading out every grey block.
 */
export const LoadingRegion: React.FC<{ label?: string; className?: string; children: React.ReactNode }> = ({
  label = 'Loading…',
  className = '',
  children
}) => (
  <div role="status" aria-live="polite" aria-busy="true" className={className}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
);

/* ============================================================================
   SHARED BUILDING BLOCKS
   ============================================================================ */

/** "Home › Category › Item" trail */
export const BreadcrumbSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Skeleton className="h-3 w-10" />
    <Skeleton className="h-3 w-3 rounded-full" />
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-3 w-3 rounded-full" />
    <Skeleton className="h-3 w-32" />
  </div>
);

/** Section title with the short underline, subtitle, and a "View all" link on the right */
export const SectionHeaderSkeleton: React.FC<{ className?: string; withLink?: boolean }> = ({
  className = '',
  withLink = true
}) => (
  <div className={`flex items-end justify-between gap-4 mb-5 sm:mb-6 ${className}`}>
    <div className="space-y-2.5 min-w-0 flex-1">
      <Skeleton className="h-6 w-56 max-w-full" />
      <Skeleton className="h-3 w-96 max-w-full" />
    </div>
    {withLink && <Skeleton className="h-4 w-20 shrink-0" />}
  </div>
);

/** Matches PageBannerSlider (120 / 180 / 190px tall) */
export const BannerSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton className={`w-full h-[120px] sm:h-[180px] lg:h-[190px] rounded-2xl ${className}`} />
);

/** Matches components/product/ProductCard.tsx (fixed-height card) */
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-white rounded-2xl border border-[#DCE6F2] p-3 h-full flex flex-col justify-between shadow-xs ${className}`}
  >
    <div>
      <Skeleton className="w-full h-40 sm:h-44 rounded-xl mb-2.5" />
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <div className="h-[38px] space-y-1.5 pt-0.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
    <div className="pt-2 mt-2.5 border-t border-[#DCE6F2]">
      <Skeleton className="h-4 w-36" />
    </div>
  </div>
);

/** Product grid as used by listing / search / brand pages (2 → 3 → 4 columns) */
export const ProductGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 8,
  className = 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4'
}) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Home-page product rail (CardCarousel): 2 rows, showing as many cards per row
 * as the real rail does at each breakpoint (2 → 3 → 5).
 */
export const ProductRailSkeleton: React.FC<{ rows?: 1 | 2 }> = ({ rows = 2 }) => {
  const perRow = 5;
  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[20px]">
          {Array.from({ length: perRow * rows }).map((_, i) => {
            const col = i % perRow;
            const visibility = col < 2 ? '' : col === 2 ? 'hidden md:block' : 'hidden lg:block';
            // Visibility goes on a wrapper: the card itself is `flex`, which would clash with `hidden`
            return (
              <div key={i} className={visibility}>
                <ProductCardSkeleton />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/** Blog preview card (image + category + title + excerpt) */
export const BlogCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden shadow-xs">
    <Skeleton className="w-full aspect-16/10 rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-5 w-11/12" />
      <SkeletonText lines={3} />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);
