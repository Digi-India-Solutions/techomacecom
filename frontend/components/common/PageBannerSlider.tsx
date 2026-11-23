'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PageBanner } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageBannerSliderProps {
  banners: PageBanner[];
  className?: string;
}

export const PageBannerSlider: React.FC<PageBannerSliderProps> = ({ banners, className = '' }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const banner = banners[current];
  const targetLink = banner.link || banner.linkUrl || banner.ctaLink;
  const isInternalLink = Boolean(targetLink && targetLink !== '#catalog' && targetLink !== '#');
  const desktopImage = banner.imageDesktop || banner.imageUrl || banner.imageMobile;
  const mobileImage = banner.imageMobile || banner.imageDesktop || banner.imageUrl;
  const hasText = Boolean(banner.headline || banner.title || banner.tagline);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-[#DCE6F2] shadow-xs bg-[#F6F9FD] ${className}`}>
      {/* Banner Slide Content - ~190px desktop / ~120px mobile */}
      <div className="relative h-[120px] sm:h-[180px] lg:h-[190px] w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 overflow-hidden">
        {/* Full Stretched Background Image */}
        {desktopImage && (
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
            {/* Desktop / Tablet background image */}
            <Image
              src={desktopImage}
              alt={banner.alt || banner.headline || banner.title || 'Banner'}
              fill
              priority
              className="hidden sm:block w-full h-full object-cover object-center select-none"
              sizes="(max-width: 768px) 100vw, 1400px"
              referrerPolicy="no-referrer"
            />
            {/* Mobile background image */}
            <Image
              src={mobileImage || desktopImage}
              alt={banner.alt || banner.headline || banner.title || 'Banner'}
              fill
              priority
              className="block sm:hidden w-full h-full object-cover object-center select-none"
              sizes="100vw"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Soft gradient scrim on the left so overlaid text is crisp & readable against any background image */}
        {hasText && (
          <div
            className="absolute inset-0 z-[1] bg-gradient-to-r from-white/95 via-white/80 to-transparent sm:from-white/90 sm:via-white/60 sm:to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Clickable full-area link */}
        {isInternalLink && targetLink && (
          <Link
            href={targetLink}
            className="absolute inset-0 z-10"
            aria-label={banner.headline || banner.title || 'Page banner link'}
          />
        )}

        {/* Left Headline & Tagline */}
        {hasText && (
          <div className="max-w-xl z-10 space-y-1 sm:space-y-2 pointer-events-none">
            {banner.tagline && (
              <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#174E90] bg-[#EAF2FC]/90 backdrop-blur-xs border border-[#1D5FAF]/20 px-2.5 py-0.5 rounded-full font-heading shadow-xs">
                {banner.tagline}
              </span>
            )}
            <h2 className="text-base sm:text-2xl lg:text-3xl font-extrabold text-[#12263F] font-heading tracking-tight leading-tight">
              {(banner.headline || banner.title || 'Buy Denmed Healthcare').split(' ').map((word, i, arr) => {
                // Highlight the last word or middle word in medical blue
                const isHighlight = i === arr.length - 1 || word.toLowerCase().includes('genuine') || word.toLowerCase().includes('clinic') || word.toLowerCase().includes('care');
                return (
                  <span key={i} className={isHighlight ? 'text-[#1D5FAF]' : ''}>
                    {word}{' '}
                  </span>
                );
              })}
            </h2>
            {(banner.subtext || banner.tagline) && (
              <p className="text-[12px] sm:text-xs text-[#5B6B82] font-body hidden sm:block max-w-md line-clamp-1">
                {banner.subtext || banner.tagline}
              </p>
            )}
            {isInternalLink && (
              <div className="pt-0.5 hidden sm:block">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D5FAF]">
                  {banner.ctaText || 'Shop Collection'} &rarr;
                </span>
              </div>
            )}
          </div>
        )}

        {/* Prev / Next buttons on hover if multiple banners */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-[#12263F] hover:text-[#1D5FAF] flex items-center justify-center shadow-xs z-20 border border-[#DCE6F2] transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-[#12263F] hover:text-[#1D5FAF] flex items-center justify-center shadow-xs z-20 border border-[#DCE6F2] transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all ${
                current === idx ? 'w-5 bg-[#1D5FAF]' : 'w-1.5 bg-[#DCE6F2] hover:bg-[#5B6B82]'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PageBannerSlider;
