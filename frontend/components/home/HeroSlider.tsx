'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroBanner } from '@/types';

interface HeroSliderProps {
  banners: HeroBanner[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const slideCount = banners?.length || 0;

  const goToPrev = useCallback(() => {
    if (slideCount <= 1) return;
    setCurrent((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  const goToNext = useCallback(() => {
    if (slideCount <= 1) return;
    setCurrent((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [slideCount, isPaused]);

  const markLoaded = useCallback((key: string) => {
    setLoadedMap((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null) {
      if (touchDeltaX.current > 40) {
        goToPrev();
      } else if (touchDeltaX.current < -40) {
        goToNext();
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setIsPaused(false);
  };

  if (!banners || slideCount === 0) {
    return (
      <div
        className="w-full aspect-[16/9] md:aspect-[1920/480] bg-[#EBF4FB] animate-pulse"
        aria-label="Loading hero banners"
      />
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-[#F1F5F9] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured Medical & Dental Equipment"
    >
      {/* Horizontal Sliding Track */}
      <div
        className="flex w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, idx) => {
          const isFirst = idx === 0;
          const desktopLoaded = Boolean(loadedMap[`${banner.id}-desktop`]);

          return (
            <div
              key={banner.id}
              className="relative w-full shrink-0 aspect-[16/10] sm:aspect-[16/8] md:aspect-[1920/480] max-h-[500px] overflow-hidden"
            >
              <Link
                href={banner.link}
                className="block w-full h-full relative focus:outline-none"
                aria-label={banner.alt}
              >
                {/* Desktop & Tablet Banner Image */}
                {!desktopLoaded && (
                  <div
                    className="absolute inset-0 bg-[#EBF4FB] animate-pulse"
                    aria-hidden="true"
                  />
                )}
                <Image
                  src={banner.imageDesktop}
                  alt={banner.alt}
                  fill
                  priority={isFirst}
                  loading={isFirst ? 'eager' : 'lazy'}
                  sizes="100vw"
                  className="hidden md:block object-cover object-center"
                  referrerPolicy="no-referrer"
                  onLoad={() => markLoaded(`${banner.id}-desktop`)}
                />

                {/* Mobile Banner Image */}
                <Image
                  src={banner.imageMobile}
                  alt={banner.alt}
                  fill
                  priority={isFirst}
                  loading={isFirst ? 'eager' : 'lazy'}
                  sizes="100vw"
                  className="block md:hidden object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Floating Circular Left / Right Arrows (Dentalkart Style) */}
      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0B2545] hover:text-[#1D5FAF] flex items-center justify-center shadow-lg border border-[#CBD5E1] transition-all z-20 cursor-pointer active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0B2545] hover:text-[#1D5FAF] flex items-center justify-center shadow-lg border border-[#CBD5E1] transition-all z-20 cursor-pointer active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Bottom Center Indicator Pills */}
      {slideCount > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full">
          {banners.map((banner, idx) => {
            const isActive = current === idx;
            return (
              <button
                key={banner.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrent(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 bg-white shadow-xs'
                    : 'w-2 bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}: ${banner.alt}`}
                aria-current={isActive ? 'true' : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default HeroSlider;
