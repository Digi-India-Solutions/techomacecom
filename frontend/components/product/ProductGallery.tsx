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

/** Hover-zoom magnification and the image's inner padding (px) — both views use them so the lens and the zoom panel line up exactly. */
const ZOOM = 2.5;
const IMG_PAD = 0;
/** Main image box follows the photo's own shape, kept within these width/height ratios. */
const MIN_ASPECT = 0.75;
const MAX_ASPECT = 1.6;

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
  // Natural width/height ratio of each loaded image, keyed by URL
  const [aspects, setAspects] = useState<Record<string, number>>({});

  // Compute safeIndex during render instead of cascading setState in useEffect
  const safeIndex = activeIndex < normalizedImages.length ? activeIndex : 0;
  const activeImage = normalizedImages[safeIndex] || normalizedImages[0];
  const activeAspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspects[activeImage.url] ?? 1));

  // Desktop Zoom Lens state
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ lensLeft: 0, lensTop: 0, w: 0, h: 0 });
  const mainImageContainerRef = useRef<HTMLDivElement>(null);
  const desktopThumbsRef = useRef<HTMLDivElement>(null);
  const mobileThumbsRef = useRef<HTMLDivElement>(null);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  // Pan offset (px) of the zoomed lightbox image, and drag tracking
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const lightboxImgRef = useRef<HTMLDivElement>(null);

  /** Keep the zoomed image covering its frame — no dragging past the edges. */
  const clampPan = useCallback((x: number, y: number, zoom: number) => {
    const el = lightboxImgRef.current;
    if (!el || zoom <= 1) return { x: 0, y: 0 };
    const maxX = (el.offsetWidth * (zoom - 1)) / 2;
    const maxY = (el.offsetHeight * (zoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    };
  }, []);

  const changeZoom = (next: number) => {
    setLightboxZoom(next);
    setPan((p) => clampPan(p.x, p.y, next));
  };

  const resetZoom = () => {
    setLightboxZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lightboxZoom <= 1) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    panStart.current = { px: e.clientX, py: e.clientY, x: pan.x, y: pan.y };
    setIsPanning(true);
  };

  const handlePanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = panStart.current;
    if (!start) return;
    setPan(clampPan(start.x + e.clientX - start.px, start.y + e.clientY - start.py, lightboxZoom));
  };

  const handlePanEnd = () => {
    panStart.current = null;
    setIsPanning(false);
  };

  // Mobile touch swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  }, [normalizedImages.length]);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxZoom(1);
    setPan({ x: 0, y: 0 });
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

    // Lens covers exactly the area shown in the zoom panel (1 / ZOOM of the image box)
    const lensW = rect.width / ZOOM;
    const lensH = rect.height / ZOOM;
    const lensLeft = Math.max(0, Math.min(x - lensW / 2, rect.width - lensW));
    const lensTop = Math.max(0, Math.min(y - lensH / 2, rect.height - lensH));

    setCursorPos({ lensLeft, lensTop, w: rect.width, h: rect.height });
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

  const { lensLeft, lensTop, w: boxW, h: boxH } = cursorPos;
  const showZoom = isHovering && boxW > 0;

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
    <div className={`relative ${className}`}>
      {/* ========================================================
          AMAZON-STYLE WRAPPER:
          Desktop: Flex row with vertical thumbnail column on LEFT
          Mobile: Flex col with main image on top, thumbnails below
          ======================================================== */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-start">
        
        {/* ======================================================
            DESKTOP VERTICAL THUMBNAIL COLUMN (ON THE LEFT)
            ~64x64px thumbnails, 8px gap, active 2px medical blue #1D5FAF
            Scrollable if > 6 images
            ====================================================== */}
        {normalizedImages.length > 1 && (
          <div className="hidden lg:flex flex-col items-center shrink-0 w-[88px]">
            {/* Scroll Up Button (shown if > 6 images) */}
            {normalizedImages.length > 6 && (
              <button
                type="button"
                onClick={scrollThumbsUp}
                className="w-[84px] h-6 flex items-center justify-center text-[#5B6B82] hover:text-[#12263F] bg-white border border-[#DCE6F2] rounded-md shadow-2xs mb-1 hover:bg-[#EAF2FC] transition-colors cursor-pointer"
                aria-label="Scroll thumbnails up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}

            {/* Vertical Scroll Strip */}
            <div
              ref={desktopThumbsRef}
              className="flex flex-col gap-2 max-h-[640px] overflow-y-auto no-scrollbar py-0.5"
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
                    className={`relative w-[84px] h-[84px] rounded-xl bg-white overflow-hidden transition-all duration-150 cursor-pointer group shrink-0 ${
                      isActive
                        ? 'border-2 border-[#1D5FAF] shadow-xs ring-2 ring-[#1D5FAF]/20'
                        : 'border border-[#DCE6F2] hover:border-[#1D5FAF]/50 opacity-80 hover:opacity-100'
                    }`}
                    title={img.alt || `${productName} view ${idx + 1}`}
                    aria-label={`Thumbnail ${idx + 1}: ${img.alt || productName}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="84px"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle label overlay for special views */}
                    {typeLabel && (img.type === 'in-use' || img.type === 'infographic' || img.type === 'box-contents') && (
                      <span className="absolute bottom-0 inset-x-0 bg-[#0B2545]/85 text-white text-[10px] font-heading font-semibold text-center leading-tight py-0.5 truncate">
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
                className="w-[84px] h-6 flex items-center justify-center text-[#5B6B82] hover:text-[#12263F] bg-white border border-[#DCE6F2] rounded-md shadow-2xs mt-1 hover:bg-[#EAF2FC] transition-colors cursor-pointer"
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
        <div className="relative flex-1 w-full min-w-0">
        <div
          ref={mainImageContainerRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          onClick={() => {
            resetZoom();
            setIsLightboxOpen(true);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden cursor-crosshair select-none group shadow-xs transition-[aspect-ratio] duration-200"
          style={{ aspectRatio: activeAspect }}
        >
          {/* Overlaid Badges on Top-Left */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 pointer-events-none">
            {badges.map((b, idx) => {
              const variantClass =
                b.variant === 'dark' || b.type === 'bestseller'
                  ? 'bg-[#F5B841] text-[#12263F]'
                  : b.variant === 'green'
                  ? 'bg-[#1D5FAF] text-white'
                  : b.type === 'deal'
                  ? 'bg-[#F28C38] text-[#12263F]'
                  : 'bg-[#F28C38] text-[#12263F]';
              return (
                <span
                  key={idx}
                  className={`text-[11px] sm:text-[12px] font-bold font-heading px-2.5 py-0.5 rounded-md shadow-2xs uppercase tracking-wider ${variantClass}`}
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
                className="w-9 h-9 rounded-full bg-white shadow-md border border-[#DCE6F2] flex items-center justify-center text-[#5B6B82] hover:text-[#1D5FAF] transition-transform hover:scale-110 active:scale-95 cursor-pointer"
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
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#12263F] shadow-md border border-[#DCE6F2] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#12263F] shadow-md border border-[#DCE6F2] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </>
          )}

          {/* Active View Label Tag (e.g. Front View, 45° Profile, Infographic) */}
          {activeImage.type && (
            <div className="absolute bottom-2.5 left-2.5 z-10 bg-[#0B2545]/80 backdrop-blur-xs text-white text-[11px] font-heading font-medium px-2 py-0.5 rounded shadow-2xs pointer-events-none">
              {getTypeBadgeLabel(activeImage.type)} ({activeIndex + 1}/{normalizedImages.length})
            </div>
          )}

          {/* Main Image — box matches the photo's shape, so no empty bands */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={activeImage.url}
              alt={activeImage.alt || `${productName} image ${activeIndex + 1}`}
              fill
              priority
              className="object-contain"
              style={{ padding: IMG_PAD }}
              sizes="(max-width: 1024px) 100vw, 640px"
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                const url = activeImage.url;
                if (w && h) setAspects((prev) => (prev[url] ? prev : { ...prev, [url]: w / h }));
              }}
            />
          </div>

          {/* Desktop Semi-transparent Square Lens Following Cursor */}
          {showZoom && (
            <div
              className="hidden lg:block absolute z-10 border-2 border-[#1D5FAF] bg-[#1D5FAF]/10 pointer-events-none rounded-md shadow-[0_0_0_9999px_rgba(255,255,255,0.35)]"
              style={{
                width: boxW / ZOOM,
                height: boxH / ZOOM,
                left: lensLeft,
                top: lensTop
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
                    activeIndex === i ? 'w-5 bg-[#1D5FAF]' : 'w-1.5 bg-[#DCE6F2]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Fullscreen Expand Hint Icon on bottom-right */}
          <div className="absolute bottom-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-[#0B2545]/60 hover:bg-[#0B2545]/80 text-white flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>

        </div>

        {/* ========================================================
            DESKTOP HOVER ZOOM PANEL — sits to the right of the main
            image (over the product info), same size as the image box,
            showing exactly the area under the lens at ZOOM x.
            ======================================================== */}
        {showZoom && (
          <div
            className="hidden lg:block absolute top-0 left-[calc(100%+24px)] z-50 bg-white rounded-2xl border border-[#DCE6F2] shadow-2xl overflow-hidden pointer-events-none"
            style={{ width: boxW, height: boxH }}
            aria-hidden="true"
          >
            <div
              className="absolute top-0 left-0"
              style={{
                width: boxW * ZOOM,
                height: boxH * ZOOM,
                transform: `translate(${-lensLeft * ZOOM}px, ${-lensTop * ZOOM}px)`
              }}
            >
              <Image
                src={activeImage.url}
                alt=""
                fill
                className="object-contain"
                style={{ padding: IMG_PAD * ZOOM }}
                sizes="1600px"
                quality={90}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-3 right-3 bg-[#0B2545]/85 text-white text-[11px] font-bold font-heading px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD] animate-pulse" />
              {ZOOM}x HD Zoom
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
              className={`relative w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 transition-all ${
                activeIndex === i
                  ? 'border-2 border-[#1D5FAF] ring-2 ring-[#1D5FAF]/20 shadow-xs'
                  : 'border border-[#DCE6F2] opacity-75'
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
          className="fixed inset-0 z-50 bg-[#0B1220]/45 backdrop-blur-[3px] flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div
            className="flex items-center justify-between z-20 max-w-7xl mx-auto w-full text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/45 border border-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2">
              <h2 className="text-sm sm:text-base font-semibold font-heading truncate max-w-md sm:max-w-xl drop-shadow-md">
                {productName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-200 mt-0.5 drop-shadow">
                <span>{getTypeBadgeLabel(activeImage.type) || 'Product View'}</span>
                <span>•</span>
                <span>Image {activeIndex + 1} of {normalizedImages.length}</span>
              </div>
            </div>

            {/* Controls: Zoom In / Out / Reset / Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeZoom(Math.min(3, lightboxZoom + 0.25))}
                className="p-2 rounded-lg bg-black/45 hover:bg-black/70 border border-white/15 text-white backdrop-blur-sm transition-colors cursor-pointer"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => changeZoom(Math.max(1, lightboxZoom - 0.25))}
                className="p-2 rounded-lg bg-black/45 hover:bg-black/70 border border-white/15 text-white backdrop-blur-sm transition-colors cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              {lightboxZoom > 1 && (
                <button
                  type="button"
                  onClick={resetZoom}
                  className="p-2 rounded-lg bg-black/45 hover:bg-black/70 border border-white/15 text-white backdrop-blur-sm transition-colors cursor-pointer"
                  title="Reset Zoom"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetZoom();
                  setIsLightboxOpen(false);
                }}
                className="p-2 rounded-lg bg-black/45 hover:bg-red-600 border border-white/15 text-white backdrop-blur-sm transition-colors ml-2 cursor-pointer"
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
              ref={lightboxImgRef}
              onPointerDown={handlePanStart}
              onPointerMove={handlePanMove}
              onPointerUp={handlePanEnd}
              onPointerCancel={handlePanEnd}
              className={`relative w-full h-full max-w-4xl max-h-[75vh] flex items-center justify-center drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)] ${
                isPanning ? '' : 'transition-transform duration-200'
              } ${lightboxZoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${lightboxZoom})`,
                touchAction: lightboxZoom > 1 ? 'none' : 'auto'
              }}
            >
              <Image
                src={activeImage.url}
                alt={activeImage.alt || productName}
                fill
                draggable={false}
                className="object-contain pointer-events-none"
                sizes="100vw"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Lightbox Footer Thumbnail Bar */}
          <div
            className="z-20 max-w-full mx-auto w-fit flex items-center justify-center gap-2 overflow-x-auto p-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {normalizedImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveIndex(i);
                  resetZoom();
                }}
                className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/10 transition-all cursor-pointer ${
                  activeIndex === i
                    ? 'border-2 border-[#1D5FAF] ring-2 ring-[#1D5FAF]/40 scale-105'
                    : 'border border-white/30 opacity-80 hover:opacity-100'
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
