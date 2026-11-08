'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Heart, 
  Share2, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2 
} from 'lucide-react';
import type { ProductImage } from '@/types';

interface BadgeItem {
  text: string;
  variant?: 'orange' | 'dark' | 'green';
  type?: 'discount' | 'bestseller' | 'deal' | string;
}

interface ProductGalleryProps {
  images: (ProductImage | string)[];
  productName: string;
  badges?: BadgeItem[];
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onShare?: () => void;
  className?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  badges = [],
  isWishlisted = false,
  onToggleWishlist,
  onShare,
  className = ''
}) => {
  // Normalize incoming images to { url, alt, type } objects
  const normalizedImages: ProductImage[] = React.useMemo(() => {
    if (!images || images.length === 0) {
      return [{
        url: '/images/hero_medical_sale_1793803411713.jpg',
        alt: productName,
        type: 'main'
      }];
    }
    return images.map((img, idx) => {
      if (typeof img === 'string') {
        const types: ProductImage['type'][] = ['main', 'angle', 'detail', 'in-use', 'box-contents', 'infographic'];
        return {
          url: img,
          alt: `${productName} view ${idx + 1}`,
          type: types[idx] || 'detail'
        };
      }
      return img;
    });
  }, [images, productName]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Compute safeIndex during render instead of cascading setState in useEffect
  const safeIndex = activeIndex < normalizedImages.length ? activeIndex : 0;
  const activeImage = normalizedImages[safeIndex] || normalizedImages[0];

  // Desktop Zoom Lens state
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ bgX: 50, bgY: 50, lensLeft: 0, lensTop: 0 });
  const mainImageContainerRef = useRef<HTMLDivElement>(null);
  const desktopThumbsRef = useRef<HTMLDivElement>(null);
  const mobileThumbsRef = useRef<HTMLDivElement>(null);

  const lensSize = 140;

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Mobile touch swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  }, [normalizedImages.length]);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  }, [normalizedImages.length]);

  // Scroll desktop vertical thumbnail strip
  const scrollThumbsUp = () => {
    desktopThumbsRef.current?.scrollBy({ top: -140, behavior: 'smooth' });
  };

  const scrollThumbsDown = () => {
    desktopThumbsRef.current?.scrollBy({ top: 140, behavior: 'smooth' });
  };

  // Mouse move on main image to control zoom lens & preview position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageContainerRef.current) return;
    const rect = mainImageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxLeft = Math.max(0, rect.width - lensSize);
    const maxTop = Math.max(0, rect.height - lensSize);

    const lensLeft = Math.max(0, Math.min(x - lensSize / 2, maxLeft));
    const lensTop = Math.max(0, Math.min(y - lensSize / 2, maxTop));

    const bgX = maxLeft > 0 ? (lensLeft / maxLeft) * 100 : 50;
    const bgY = maxTop > 0 ? (lensTop / maxTop) * 100 : 50;

    setCursorPos({ bgX, bgY, lensLeft, lensTop });
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.targetTouches[0].clientX - touchStart);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    if (touchDelta > 45) {
      prevImage();
    } else if (touchDelta < -45) {
      nextImage();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, nextImage, prevImage]);

  const { lensLeft, lensTop } = cursorPos;

  // Type labels for display
  const getTypeBadgeLabel = (type?: string) => {
    switch (type) {
      case 'main': return 'Front View';
      case 'angle': return '45° Profile';
      case 'detail': return 'Close-Up';
      case 'in-use': return 'In-Use';
      case 'box-contents': return 'Box Contents';
      case 'infographic': return 'Features & Specs';
      default: return null;
    }
  };

  return (
    <div className={`relative ${isHovering ? 'z-40' : 'z-10'} ${className}`}>
      {/* ========================================================
          AMAZON-STYLE WRAPPER:
          Desktop: Flex row with vertical thumbnail column on LEFT
          Mobile: Flex col with main image on top, thumbnails below
          ======================================================== */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-start">
        
        {/* ======================================================
            DESKTOP VERTICAL THUMBNAIL COLUMN (ON THE LEFT)
            ~64x64px thumbnails, 8px gap, active 2px teal #0F766E
            Scrollable if > 6 images
            ====================================================== */}
        {normalizedImages.length > 1 && (
          <div className="hidden lg:flex flex-col items-center shrink-0 w-[68px]">
            {/* Scroll Up Button (shown if > 6 images) */}
            {normalizedImages.length > 6 && (
              <button
                type="button"
                onClick={scrollThumbsUp}
                className="w-[64px] h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-2xs mb-1 hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Scroll thumbnails up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}

            {/* Vertical Scroll Strip */}
            <div
              ref={desktopThumbsRef}
              className="flex flex-col gap-2 max-h-[520px] overflow-y-auto no-scrollbar py-0.5"
            >
              {normalizedImages.map((img, idx) => {
                const isActive = activeIndex === idx;
                const typeLabel = getTypeBadgeLabel(img.type);
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                    onFocus={() => setActiveIndex(idx)}
                    className={`relative w-[64px] h-[64px] rounded-lg bg-white overflow-hidden transition-all duration-150 cursor-pointer group shrink-0 ${
                      isActive
                        ? 'border-2 border-[#0F766E] shadow-xs ring-2 ring-[#0F766E]/20'
                        : 'border border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                    title={img.alt || `${productName} view ${idx + 1}`}
                    aria-label={`Thumbnail ${idx + 1}: ${img.alt || productName}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle label overlay for special views */}
                    {typeLabel && (img.type === 'in-use' || img.type === 'infographic' || img.type === 'box-contents') && (
                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[8px] font-heading font-semibold text-center leading-tight py-0.5 truncate">
                        {img.type === 'in-use' ? 'In Use' : img.type === 'infographic' ? 'Specs' : 'Kit'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Down Button (shown if > 6 images) */}
            {normalizedImages.length > 6 && (
              <button
                type="button"
                onClick={scrollThumbsDown}
                className="w-[64px] h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-2xs mt-1 hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Scroll thumbnails down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ======================================================
            MAIN IMAGE CONTAINER (RIGHT OF THUMBNAILS ON DESKTOP)
            Aspect-square, object-contain, minimal padding
            ====================================================== */}
        {/* ======================================================
            MAIN IMAGE & HOVER ZOOM COLUMN (ON DESKTOP)
            Parent wrapper has relative flex-1 with NO overflow-hidden
            so the zoom preview panel positioned to the right is visible!
            ====================================================== */}
        <div className="relative flex-1 w-full">
          <div
            ref={mainImageContainerRef}
            onMouseEnter={(e) => {
              setIsHovering(true);
              handleMouseMove(e);
            }}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setIsLightboxOpen(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-square w-full bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-crosshair select-none group shadow-xs"
          >
            {/* Overlaid Badges on Top-Left */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 pointer-events-none">
              {badges.map((b, idx) => {
                const variantClass =
                  b.variant === 'dark' || b.type === 'bestseller'
                    ? 'bg-[#1E293B] text-amber-300'
                    : b.variant === 'green'
                    ? 'bg-[#0F766E] text-white'
                    : b.type === 'deal'
                    ? 'bg-[#1E293B] text-amber-300'
                    : 'bg-[#F28C38] text-white';
                return (
                  <span
                    key={idx}
                    className={`text-[10px] sm:text-[11px] font-bold font-heading px-2.5 py-0.5 rounded-md shadow-2xs uppercase tracking-wider ${variantClass}`}
                  >
                    {b.text}
                  </span>
                );
              })}
            </div>

            {/* Wishlist and Share Circle Buttons on Top-Right */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist();
                  }}
                  className={`w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                    isWishlisted ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
                  }`}
                  title="Save to wishlist"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              )}

              {onShare && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#0F766E] transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Share product link"
                  aria-label="Share"
                >
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {/* Left & Right Arrow Buttons on Main Image */}
            {normalizedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </>
            )}

            {/* Active View Label Tag (e.g. Front View, 45° Profile, Infographic) */}
            {activeImage.type && (
              <div className="absolute bottom-2.5 left-2.5 z-10 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-heading font-medium px-2 py-0.5 rounded shadow-2xs pointer-events-none">
                {getTypeBadgeLabel(activeImage.type)} ({activeIndex + 1}/{normalizedImages.length})
              </div>
            )}

            {/* Main Image with Object-Contain & Minimal Padding */}
            <div className="relative w-full h-full p-2 flex items-center justify-center">
              <Image
                src={activeImage.url}
                alt={activeImage.alt || `${productName} image ${activeIndex + 1}`}
                fill
                priority
                className="object-contain p-2 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 550px"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Desktop Semi-transparent Square Lens Following Cursor */}
            {isHovering && (
              <div
                className="hidden lg:block absolute border-2 border-[#0F766E] bg-[#0F766E]/15 pointer-events-none rounded-lg shadow-xs"
                style={{
                  width: `${lensSize}px`,
                  height: `${lensSize}px`,
                  left: `${lensLeft}px`,
                  top: `${lensTop}px`
                }}
              />
            )}

            {/* Mobile Dot Indicators */}
            {normalizedImages.length > 1 && (
              <div className="lg:hidden absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                {normalizedImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      activeIndex === i ? 'w-5 bg-[#0F766E]' : 'w-1.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Fullscreen Expand Hint Icon on bottom-right */}
            <div className="absolute bottom-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* ========================================================
              DESKTOP HOVER ZOOM PANEL (To the right of the main image)
              Rendered outside the overflow-hidden box, overlays product details!
              ======================================================== */}
          {isHovering && (
            <div
              className="hidden lg:block absolute left-[calc(100%+16px)] top-0 z-50 w-[520px] h-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden pointer-events-none"
              style={{
                backgroundImage: `url(${activeImage.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `${cursorPos.bgX}% ${cursorPos.bgY}%`,
                backgroundSize: '250%' // 2.5x magnification
              }}
            >
              <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold font-heading px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                2.5x HD Clinical Zoom
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================
          MOBILE/TABLET HORIZONTAL THUMBNAIL STRIP (BELOW MAIN IMAGE)
          ======================================================== */}
      {normalizedImages.length > 1 && (
        <div
          ref={mobileThumbsRef}
          className="lg:hidden flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar"
        >
          {normalizedImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0 transition-all ${
                activeIndex === i
                  ? 'border-2 border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
                  : 'border border-slate-200 opacity-75'
              }`}
              aria-label={`Thumbnail ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                className="object-contain p-1"
                sizes="56px"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}

      {/* ========================================================
          FULLSCREEN LIGHTBOX MODAL WITH ZOOM & THUMBNAILS
          ======================================================== */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div
            className="flex items-center justify-between z-20 max-w-7xl mx-auto w-full text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-sm sm:text-base font-semibold font-heading truncate max-w-md sm:max-w-xl">
                {productName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{getTypeBadgeLabel(activeImage.type) || 'Product View'}</span>
                <span>•</span>
                <span>Image {activeIndex + 1} of {normalizedImages.length}</span>
              </div>
            </div>

            {/* Controls: Zoom In / Out / Reset / Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(1, z - 0.25))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              {lightboxZoom > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxZoom(1)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Reset Zoom"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setIsLightboxOpen(false);
                }}
                className="p-2 rounded-lg bg-white/20 hover:bg-red-600 text-white transition-colors ml-2 cursor-pointer"
                title="Close Lightbox (Esc)"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image View */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nav Arrows */}
            {normalizedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Displayed Image */}
            <div
              className="relative w-full h-full max-w-4xl max-h-[75vh] flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${lightboxZoom})` }}
            >
              <Image
                src={activeImage.url}
                alt={activeImage.alt || productName}
                fill
                className="object-contain"
                sizes="100vw"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Lightbox Footer Thumbnail Bar */}
          <div
            className="z-20 max-w-3xl mx-auto w-full flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {normalizedImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveIndex(i);
                  setLightboxZoom(1);
                }}
                className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/10 transition-all cursor-pointer ${
                  activeIndex === i
                    ? 'border-2 border-[#0F766E] ring-2 ring-[#0F766E]/40 scale-105'
                    : 'border border-white/20 opacity-60 hover:opacity-100'
                }`}
                aria-label={`Jump to image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Thumbnail ${i + 1}`}
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
