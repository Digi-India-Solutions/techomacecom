'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Heart, Plus, Minus, CreditCard, Bed, ChevronRight } from 'lucide-react';
import { useCartStore, useWishlistStore, useToastStore } from '@/lib/store';
import { getProductImageUrl } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  showSimilarStrip?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  showSimilarStrip = true
}) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast } = useToastStore();

  const isFavorited = isInWishlist(product.id);

  // Check if this product is in the cart
  const cartItem = items.find((i) => i.productId === product.id && !i.isRental);
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
      className={`group bg-white rounded-2xl border border-[#DCE6F2] hover:border-[#1D5FAF] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative p-3.5 hover:-translate-y-1 shadow-xs ${className}`}
    >
      <div>
        {/* ===================================================
            IMAGE CONTAINER: Clean Buy Denmed #F6F9FD surface
            =================================================== */}
        <div className="relative w-full aspect-square bg-[#F6F9FD] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-3 border border-[#EAF2FC]">
          {/* Top-Left Pill Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {/* {product.discountPercentage > 0 && (
              <span className="bg-[#F28C38] text-white text-[12px] font-bold px-2 py-0.5 rounded-md shadow-xs font-heading">
                {product.discountPercentage}% OFF
              </span>
            )} */}
            {product.isDealOfDay && (
              <span className="bg-[#0B2545] text-white text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-heading">
                DEAL
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-[#F5B841] text-[#12263F] text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider font-heading">
                BEST SELLER
              </span>
            )}
            {/* {product.rentEnabled && (
              <span className="bg-[#EAF2FC] text-[#174E90] border border-[#1D5FAF]/20 text-[11px] font-bold px-2 py-0.5 rounded-md font-heading">
                Rent Available
              </span>
            )} */}
          </div>

          {/* Top-Right: Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 hover:bg-white shadow-xs flex items-center justify-center transition-all hover:scale-110 z-10 cursor-pointer border border-[#DCE6F2] ${
              isFavorited ? 'text-[#DC2626]' : 'text-[#5B6B82] hover:text-[#DC2626]'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Product Image Link with secondary image swap on hover */}
          <Link
            href={`/product/${product.slug}`}
            className="relative w-full h-full flex items-center justify-center"
          >
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className={`object-contain p-2 transition-all duration-300 ${
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
                className="object-contain p-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                referrerPolicy="no-referrer"
              />
            )}
          </Link>

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="bg-[#0B2545] text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider font-heading">
                Sold Out
              </span>
            </div>
          )}

          {/* Bottom-Right "ADD +" Button or Stepper */}
          {product.inStock && (
            <div className="absolute bottom-2 right-2 z-20">
              {cartQty === 0 ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-white hover:bg-[#EAF2FC] text-[#12263F] hover:text-[#174E90] border border-[#DCE6F2] hover:border-[#1D5FAF] px-3 py-1.5 rounded-lg shadow-xs text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 cursor-pointer font-heading active:scale-95"
                  title="Add to Cart"
                >
                  <span>ADD</span>
                  <Plus className="w-3.5 h-3.5 text-[#1D5FAF]" />
                </button>
              ) : (
                <div className="flex items-center bg-white border border-[#1D5FAF] rounded-lg shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-7 h-7 flex items-center justify-center text-[#12263F] hover:bg-[#EAF2FC] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5 text-[#1D5FAF]" />
                  </button>
                  <span className="px-2.5 text-xs font-black text-[#12263F] font-body select-none">
                    {cartQty}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-7 h-7 flex items-center justify-center text-[#12263F] hover:bg-[#EAF2FC] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1D5FAF]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================================================
            PRODUCT DETAILS: High Readability & Sizing
            =================================================== */}
        <div className="space-y-1.5">
          {/* Brand & Star Rating on same row */}
          <div className="flex items-center justify-between text-xs text-[#5B6B82] font-body">
            <Link
              href={`/brand/${product.brandId.replace('brand-', '')}`}
              className="font-bold uppercase tracking-wider text-[#5B6B82] hover:text-[#1D5FAF] truncate max-w-[60%] font-heading text-[12px]"
            >
              {product.brandName}
            </Link>
            <div className="flex items-center gap-1 font-bold text-[#12263F] shrink-0">
              <span className="inline-flex items-center justify-center bg-[#16A34A] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-sm gap-0.5 font-heading">
                ★ {product.rating}
              </span>
              <span className="text-[#5B6B82] text-[12px] font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name (14px, readable) */}
          <Link
            href={`/product/${product.slug}`}
            className="block font-heading font-semibold text-sm text-[#12263F] group-hover:text-[#1D5FAF] transition-colors line-clamp-2 leading-snug min-h-[40px]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Short Description (small, 2 lines) */}
          {cardDescription && (
            <p
              className="font-body text-[12px] text-[#5B6B82] leading-snug line-clamp-2 min-h-[32px]"
              title={cardDescription}
            >
              {cardDescription}
            </p>
          )}

          {/* Price Row */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="font-heading font-bold text-lg sm:text-xl text-[#12263F]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-[13px] sm:text-sm text-[#5B6B82] line-through font-body">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-[13px] sm:text-sm font-bold text-[#16A34A] font-body">
                  ↓ {product.discountPercentage}% off
                </span>
              </>
            )}
          </div>

          {/* EMI or Rent Options */}
          {(product.emiEnabled || product.rentEnabled) && (
            <div className="flex flex-wrap gap-1.5 pt-1 font-body">
              {product.emiEnabled && (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#5B6B82] bg-[#F6F9FD] border border-[#DCE6F2] px-2 py-0.5 rounded-md">
                  <CreditCard className="w-3 h-3 text-[#1D5FAF]" />
                  <span>EMI ₹{product.emiStartingFrom || Math.round(product.price / 12)}/mo</span>
                </span>
              )}
              {product.rentEnabled && (
                <Link
                  href={`/rent/${product.slug}`}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#174E90] bg-[#EAF2FC] hover:bg-[#DCE6F2] border border-[#1D5FAF]/20 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Bed className="w-3 h-3" />
                  <span>Rent ₹{product.rentPricePerMonth || 3500}/mo</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Similar Products link at bottom */}
      {showSimilarStrip && (
        <div className="pt-2.5 mt-3 border-t border-[#DCE6F2]">
          <Link
            href={`/category/${product.categoryId.replace('cat-', '')}`}
            className="flex items-center justify-between text-xs font-bold text-[#1D5FAF] hover:text-[#174E90] transition-colors py-0.5 px-1 rounded-md hover:bg-[#EAF2FC]"
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
