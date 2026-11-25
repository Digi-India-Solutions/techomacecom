'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Column widths (gap is a fixed 16px on desktop, 10px on mobile; widths subtract the gaps on each row). */
export const PRODUCT_SLIDE =
  'auto-cols-[calc((100%_-_10px)/2)] sm:auto-cols-[calc((100%_-_16px)/2)] md:auto-cols-[calc((100%_-_48px)/4)] lg:auto-cols-[calc((100%_-_64px)/5)] xl:auto-cols-[calc((100%_-_80px)/6)]';
export const TESTIMONIAL_SLIDE =
  'auto-cols-[86%] sm:auto-cols-[calc((100%_-_16px)/2)] lg:auto-cols-[calc((100%_-_32px)/3)]';

const GAP = 16;

interface CardCarouselProps {
  children: React.ReactNode;
  /** Accessible name, e.g. "Hot selling products" */
  ariaLabel: string;
  /** Column width classes (grid auto-cols-*) */
  itemClassName?: string;
  /** Number of rows in the rail (default 2) */
  rows?: 1 | 2;
  className?: string;
}

/**
 * Swipeable rail with a fixed number of rows (1 or 2). Extra items scroll
 * sideways instead of stacking, so the home page never grows taller.
 */
export const CardCarousel: React.FC<CardCarouselProps> = ({
  children,
  ariaLabel,
  itemClassName = PRODUCT_SLIDE,
  rows = 2,
  className = ''
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [thumb, setThumb] = useState({ width: 100, left: 0 });
  // Cards visible per row at the current breakpoint (measured; 5 = desktop default)
  const [cols, setCols] = useState(5);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    const ratio = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;
    const progress = max > 0 ? el.scrollLeft / max : 0;
    setThumb({ width: ratio * 100, left: progress * (1 - ratio) * 100 });
    const cell = el.querySelector<HTMLElement>('[data-cell]');
    if (cell && cell.offsetWidth > 0) {
      const currentGap = typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : GAP;
      setCols(Math.max(1, Math.round((el.clientWidth + currentGap) / (cell.offsetWidth + currentGap))));
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update, children]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const scrollable = canPrev || canNext;

  // The grid flows column-by-column. For 2 rows, lay each visible page out
  // row-first: row 1 gets the first `cols` cards, row 2 the next `cols`.
  // Empty slots (null) keep later cards from sliding into the gap.
  const items = React.Children.toArray(children).filter(Boolean);
  const orderedItems: React.ReactNode[] = [];
  if (rows === 2) {
    for (let start = 0; start < items.length; start += cols * 2) {
      const page = items.slice(start, start + cols * 2);
      for (let c = 0; c < cols && c < page.length; c++) {
        orderedItems.push(page[c]);
        orderedItems.push(page[cols + c] ?? null);
      }
    }
    while (orderedItems.length && orderedItems[orderedItems.length - 1] === null) orderedItems.pop();
  } else {
    orderedItems.push(...items);
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        className={`grid grid-flow-col ${rows === 2 ? 'grid-rows-2' : 'grid-rows-1'} ${itemClassName} gap-2.5 sm:gap-[16px] overflow-x-auto snap-x snap-mandatory scroll-smooth scroll-px-1 no-scrollbar -mx-1 px-1 pt-1.5 pb-4`}
      >
        {orderedItems.map((child, i) =>
          child === null ? (
            <div key={`empty-${i}`} data-cell aria-hidden="true" />
          ) : (
            <div key={(React.isValidElement(child) && child.key) || i} data-cell className="snap-start min-w-0">
              {child}
            </div>
          )
        )}
      </div>

      {/* Side arrows (desktop) */}
      {scrollable && (
        <>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous"
            className="hidden sm:flex absolute left-0 top-[45%] -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#DCE6F2] shadow-md items-center justify-center text-[#12263F] hover:bg-[#1D5FAF] hover:text-white hover:border-[#1D5FAF] transition-all duration-200 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next"
            className="hidden sm:flex absolute right-0 top-[45%] translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#DCE6F2] shadow-md items-center justify-center text-[#12263F] hover:bg-[#1D5FAF] hover:text-white hover:border-[#1D5FAF] transition-all duration-200 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Progress indicator */}
          <div className="mx-auto mt-1 h-1 w-24 sm:w-32 rounded-full bg-[#DCE6F2] relative overflow-hidden" aria-hidden="true">
            <div
              className="absolute top-0 h-full rounded-full bg-[#1D5FAF] transition-[left,width] duration-200"
              style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CardCarousel;
