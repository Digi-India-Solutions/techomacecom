'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Heart, Plus, Minus, CreditCard, Bed, ChevronRight, Clock } from 'lucide-react';
import { useCartStore, useWishlistStore, useToastStore } from '@/lib/store';
import { getProductImageUrl } from '@/lib/utils';
import SkeletonImage from '@/components/common/SkeletonImage';
import { useHydrated } from '@/hooks/use-hydrated';

export function getProductDealTargetMs(product: Product): number | null {
  if (!product.dealExpiresAt) return null;
  const exp = new Date(product.dealExpiresAt).getTime();
  if (Number.isNaN(exp)) return null;
  const diff = exp - Date.now();
  if (diff <= 0) return null;
  return exp;
}

export const DealCardTimer: React.FC<{ product: Product; className?: string }> = ({ product, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);

  useEffect(() => {
    const targetMs = getProductDealTargetMs(product);
    if (!targetMs) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = targetMs - now;
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      setTimeLeft({ hours, minutes });
    };

    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [product.id, product.dealExpiresAt]);

  if (!timeLeft) return null;

  return (
    <div className={`inline-flex items-center gap-0.5 sm:gap-1 bg-transparent text-[9px] sm:text-[10px] font-bold ${className}`}>
      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#EA580C] shrink-0" />
      <span className="text-[#5B6B82] text-[8.5px] sm:text-[9px] font-body">Ends:</span>
      <span className="text-[#0B2545] font-bold tabular-nums">
        {timeLeft.hours}h
      </span>
      <span className="text-[#EA580C] font-black">:</span>
      <span className="text-[#0B2545] font-bold tabular-nums">
        {String(timeLeft.minutes).padStart(2, '0')}m
      </span>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  className?: string;
  showSimilarStrip?: boolean;
  showDealTimer?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  showSimilarStrip = true,
  showDealTimer = false
}) => {
  const hydrated = useHydrated();
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast } = useToastStore();

  const isFavorited = hydrated ? isInWishlist(product.id) : false;

  // Check if this product is in the cart
  const cartItem = hydrated ? items.find((i) => i.productId === product.id && !i.isRental) : undefined;
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) return;

    addItem(product, 1);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name.slice(0, 36)}...`
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, cartQty + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, cartQty - 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    addToast({
      type: added ? 'success' : 'info',
      title: added ? 'Saved to Wishlist' : 'Removed from Wishlist',
      message: `${product.name.slice(0, 30)}...`
    });
  };

  const mainImage = getProductImageUrl(product.images?.[0] || product.thumbnail || product.image);
  const hoverImage = product.images?.[1]
    ? getProductImageUrl(product.images[1])
    : (mainImage !== product.thumbnail && product.thumbnail ? product.thumbnail : mainImage);
  const hasSecondaryImage = Boolean(hoverImage && hoverImage !== mainImage);

  // Plain-text short description for the card (strip any HTML coming from the backend)
  const cardDescription = (product.shortDescription || product.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div
      className={`group bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative p-2 sm:p-2.5 h-full hover:-translate-y-1 shadow-xs ${className}`}
    >
      <div>
        {/* ===================================================
            IMAGE CONTAINER: Clean Buy Denmed #F6F9FD surface
            =================================================== */}
        <div className="relative w-full h-28 sm:h-36 shrink-0 bg-white rounded-xl overflow-hidden flex items-center justify-center mb-1.5 sm:mb-2">
          {/* Top-Left Pill Badges & Timer */}
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.isDealOfDay && (
                <span className="bg-[#EA580C] text-white text-[9.5px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider font-heading shadow-xs flex items-center gap-0.5 sm:gap-1">
                  ⚡ DEAL
                </span>
              )}
              {Boolean(product.dealExpiresAt) && (
                <DealCardTimer product={product} />
              )}
            </div>
            {product.isBestSeller && (
              <span className="bg-[#F5B841] text-[#12263F] text-[9.5px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider font-heading">
                BEST SELLER
              </span>
            )}
          </div>

          {/* Top-Right: Wishlist Button */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={handleToggleWishlist}
            className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 hover:bg-white shadow-xs flex items-center justify-center transition-all hover:scale-110 z-10 cursor-pointer border border-[#DCE6F2] ${
              isFavorited ? 'text-[#DC2626]' : 'text-[#5B6B82] hover:text-[#DC2626]'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Product Image Link with secondary image swap on hover */}
          <Link
            href={`/product/${product.slug}`}
            className="relative w-full h-full flex items-center justify-center"
          >
            <SkeletonImage
              src={mainImage}
              alt={product.name}
              fill
              className={`object-contain transition-all duration-300 ${
                hasSecondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              referrerPolicy="no-referrer"
            />
            {hasSecondaryImage && (
              <Image
                src={hoverImage}
                alt={`${product.name} alternate view`}
                fill
                className="object-contain opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                referrerPolicy="no-referrer"
              />
            )}
          </Link>

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="bg-[#0B2545] text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-md uppercase tracking-wider font-heading">
                Sold Out
              </span>
            </div>
          )}

          {/* Bottom-Right "ADD +" Button or Stepper */}
          {product.inStock && (
            <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 z-20">
              {cartQty === 0 ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleAddToCart}
                  className="bg-white hover:bg-[#EAF2FC] text-[#12263F] hover:text-[#174E90] border border-[#DCE6F2] hover:border-[#1D5FAF] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-xs text-[10.5px] sm:text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer font-heading active:scale-95"
                  title="Add to Cart"
                >
                  <span>ADD</span>
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1D5FAF]" />
                </button>
              ) : (
                <div className="flex items-center bg-white border border-[#1D5FAF] rounded-lg shadow-xs overflow-hidden">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleDecrement}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[#12263F] hover:bg-[#EAF2FC] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1D5FAF]" />
                  </button>
                  <span className="px-1.5 sm:px-2.5 text-xs font-black text-[#12263F] font-body select-none">
                    {cartQty}
                  </span>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={handleIncrement}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[#12263F] hover:bg-[#EAF2FC] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1D5FAF]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================================================
            PRODUCT DETAILS: High Readability & Sizing
            =================================================== */}
        <div className="space-y-1">
          {/* Brand & Star Rating on same row */}
          <div className="flex items-center justify-between text-xs text-[#5B6B82] font-body">
            <Link
              href={`/brand/${product.brandId.replace('brand-', '')}`}
              className="font-bold uppercase tracking-wider text-[#5B6B82] hover:text-[#1D5FAF] truncate max-w-[55%] font-heading text-[10px] sm:text-[11px]"
            >
              {product.brandName}
            </Link>
            <div className="flex items-center gap-0.5 sm:gap-1 font-bold text-[#12263F] shrink-0">
              <span className="inline-flex items-center justify-center bg-[#16A34A] text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-sm gap-0.5 font-heading">
                ★ {product.rating}
              </span>
              <span className="text-[#5B6B82] text-[9.5px] sm:text-[11px] font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name (readable, compact) */}
          <Link
            href={`/product/${product.slug}`}
            className="block font-heading font-semibold text-xs sm:text-[13px] text-[#12263F] group-hover:text-[#1D5FAF] transition-colors line-clamp-2 leading-snug min-h-[30px] sm:min-h-[34px]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Short Description (up to 2 lines with ellipsis) */}
          <p
            className="font-body text-[10.5px] sm:text-[11.5px] text-[#5B6B82] leading-snug line-clamp-2 [overflow-wrap:anywhere] min-h-[28px] sm:min-h-[32px]"
            title={cardDescription || undefined}
          >
            {cardDescription}
          </p>

          {/* Price Row */}
          <div className="flex items-baseline gap-1 sm:gap-1.5 pt-0.5 flex-wrap">
            <span className="font-heading font-bold text-sm sm:text-base text-[#12263F]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.regularPrice && product.regularPrice > product.price ? (
              <>
                <span className="text-[10px] sm:text-xs text-[#5B6B82] line-through font-body">
                  ₹{product.regularPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#EA580C] bg-[#FFF7ED] px-1 py-0.2 rounded font-body">
                  Save ₹{(product.regularPrice - product.price).toLocaleString('en-IN')}
                </span>
              </>
            ) : product.mrp > product.price ? (
              <>
                <span className="text-[10px] sm:text-xs text-[#5B6B82] line-through font-body">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold text-[#16A34A] font-body">
                  ↓ {product.discountPercentage}% off
                </span>
              </>
            ) : null}
          </div>

          {/* EMI or Rent Options */}
          {/* Fixed-height row so cards line up even when a product has no EMI/Rent */}
          <div className="flex flex-nowrap items-center gap-1 pt-0.5 font-body h-5 sm:h-6 overflow-hidden">
              {product.emiEnabled && (
                <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap leading-none text-[9.5px] sm:text-[11px] font-medium text-[#5B6B82] bg-[#F6F9FD] border border-[#DCE6F2] px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md">
                  <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-[#1D5FAF]" />
                  <span>EMI ₹{(product.emiStartingFrom || Math.round(product.price / 12)).toLocaleString('en-IN')}/mo</span>
                </span>
              )}
              {product.rentEnabled && (
                <Link
                  href={`/rent/${product.slug}`}
                  className="inline-flex min-w-0 items-center gap-0.5 whitespace-nowrap leading-none text-[9.5px] sm:text-[11px] font-bold text-[#174E90] bg-[#EAF2FC] hover:bg-[#DCE6F2] border border-[#1D5FAF]/20 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md transition-colors"
                >
                  <Bed className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Rent ₹{(product.rentPricePerMonth || 3500).toLocaleString('en-IN')}/mo</span>
                </Link>
              )}
          </div>
        </div>
      </div>

      {/* Similar Products link at bottom */}
      {showSimilarStrip && (
        <div className="pt-1 sm:pt-1.5 mt-1.5 sm:mt-2 border-t border-[#DCE6F2]">
          <Link
            href={
              product.categorySlug
                ? `/category/${product.categorySlug}${product.subCategorySlug ? `?sub=${encodeURIComponent(product.subCategorySlug)}` : ''}`
                : `/category/${product.subCategorySlug || product.categoryId.replace(/^cat-/, '')}`
            }
            className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-[#1D5FAF] hover:text-[#174E90] transition-colors py-0.5 px-0.5 sm:px-1 rounded-md hover:bg-[#EAF2FC]"
          >
            <span>View Similar Equipment</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
