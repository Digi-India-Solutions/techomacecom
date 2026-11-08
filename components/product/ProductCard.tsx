'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Heart, Star, Plus, Minus, CreditCard, Bed, ChevronRight } from 'lucide-react';
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

  // Find if this product is already in the cart to show quantity stepper
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
      message: `${product.name.slice(0, 32)}...`
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
      message: `${product.name.slice(0, 28)}...`
    });
  };

  const mainImage = getProductImageUrl(product.images?.[0] || product.thumbnail || product.image);
  const hoverImage = product.images?.[1] ? getProductImageUrl(product.images[1]) : (mainImage !== product.thumbnail && product.thumbnail ? product.thumbnail : mainImage);
  const hasSecondaryImage = Boolean(hoverImage && hoverImage !== mainImage);

  return (
    <div
      className={`group bg-white rounded-xl border border-slate-200 hover:border-[#0F766E]/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative p-3 hover:-translate-y-0.5 ${className}`}
    >
      <div>
        {/* ===================================================
            IMAGE AREA: aspect-square, #F8FAFC, 8px padding
            =================================================== */}
        <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-2 mb-2">
          {/* TOP-LEFT TAGS: Stacked Small Pill Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {product.discountPercentage > 0 && (
              <span className="bg-[#F28C38] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs font-heading">
                {product.discountPercentage}% OFF
              </span>
            )}
            {product.isDealOfDay && (
              <span className="bg-[#1E293B] text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-heading">
                DEAL
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-[#F5B841] text-[#1E293B] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-heading">
                BEST SELLER
              </span>
            )}
            {product.inStock && product.stockCount > 0 && product.stockCount < 5 && (
              <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded font-heading">
                Only {product.stockCount} Left
              </span>
            )}
            {product.rentEnabled && (
              <span className="bg-[#E6F4F3] text-[#0F766E] border border-teal-200 text-[8px] font-bold px-1.5 py-0.5 rounded font-heading">
                Rent Available
              </span>
            )}
          </div>

          {/* TOP-RIGHT: Wishlist Heart in small white circle */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center transition-transform hover:scale-110 z-10 cursor-pointer ${
              isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Product Image Link with secondary image on hover */}
          <Link
            href={`/product/${product.slug}`}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
          >
            {/* Primary Main Image */}
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className={`object-contain p-1 transition-all duration-300 ${
                hasSecondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              referrerPolicy="no-referrer"
            />
            {/* Secondary (Angle) Image swapped in on Hover */}
            {hasSecondaryImage && (
              <Image
                src={hoverImage}
                alt={`${product.name} alternate angle view`}
                fill
                className="object-contain p-1 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                referrerPolicy="no-referrer"
              />
            )}
          </Link>

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-[#1E293B] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-heading">
                Sold Out
              </span>
            </div>
          )}

          {/* BOTTOM-RIGHT: "ADD +" Button or Quantity Stepper Overlapping Corner */}
          {product.inStock && (
            <div className="absolute bottom-1.5 right-1.5 z-20">
              {cartQty === 0 ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-white hover:bg-[#E6F4F3] text-[#1E293B] hover:text-[#0F766E] border border-slate-300 hover:border-[#0F766E] px-2.5 py-1 rounded-md shadow-xs text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex flex-col items-center leading-none cursor-pointer"
                  title="Add to Cart"
                >
                  <span className="flex items-center gap-0.5 font-heading">
                    ADD <Plus className="w-3 h-3 text-[#0F766E]" />
                  </span>
                  {product.discountPercentage > 15 && (
                    <span className="text-[7px] text-emerald-600 font-bold mt-0.5 lowercase">
                      1 offer
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex items-center bg-white border border-[#0F766E] rounded-md shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-[#E6F4F3] hover:text-[#0F766E] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 text-[#0F766E]" />
                  </button>
                  <span className="px-2 text-xs font-black text-slate-900 font-body select-none">
                    {cartQty}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-[#E6F4F3] hover:text-[#0F766E] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3 text-[#0F766E]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================================================
            PRODUCT DETAILS: Tight 4-6px vertical gaps
            =================================================== */}
        <div className="space-y-1">
          {/* Brand & Star Rating on same line */}
          <div className="flex items-center justify-between text-[10px] leading-tight text-slate-500 font-body">
            <Link
              href={`/brand/${product.brandId.replace('brand-', '')}`}
              className="font-bold uppercase tracking-wider text-slate-400 hover:text-[#0F766E] truncate max-w-[55%] font-heading"
            >
              {product.brandName}
            </Link>
            <div className="flex items-center gap-1 font-bold text-slate-700 shrink-0">
              <span className="inline-flex items-center justify-center bg-emerald-700 text-white text-[9px] font-bold px-1 rounded gap-0.5 font-heading">
                ★ {product.rating}
              </span>
              <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name (Poppins 500, max 2 lines with ellipsis) */}
          <Link
            href={`/product/${product.slug}`}
            className="block font-heading font-medium text-xs text-slate-900 group-hover:text-[#0F766E] transition-colors line-clamp-2 leading-snug min-h-[32px]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Price Row: Bold selling price, MRP strikethrough, and green "↓ X% off" */}
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="font-body font-bold text-sm text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-[10px] text-slate-400 line-through font-body">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 font-body">
                  ↓ {product.discountPercentage}% off
                </span>
              </>
            )}
          </div>

          {/* Chips Row: EMI from ₹X/mo & Rent from ₹X/mo */}
          {(product.emiEnabled || product.rentEnabled) && (
            <div className="flex flex-wrap gap-1 pt-1 font-body">
              {product.emiEnabled && (
                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  <CreditCard className="w-2.5 h-2.5 text-[#0F766E]" />
                  <span>EMI ₹{product.emiStartingFrom || Math.round(product.price / 12)}/mo</span>
                </span>
              )}
              {product.rentEnabled && (
                <Link
                  href={`/rent/${product.slug}`}
                  className="inline-flex items-center gap-1 text-[9px] font-medium text-[#0F766E] bg-[#E6F4F3] hover:bg-[#d6edea] px-1.5 py-0.5 rounded transition-colors"
                >
                  <Bed className="w-2.5 h-2.5" />
                  <span>Rent ₹{product.rentPricePerMonth || 3500}/mo</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional bottom strip "View Similar Products >" in light green */}
      {showSimilarStrip && (
        <div className="pt-2 mt-2 border-t border-slate-100">
          <Link
            href={`/category/${product.categoryId.replace('cat-', '')}`}
            className="flex items-center justify-between text-[10px] font-semibold text-[#0F766E] hover:text-[#0B5F58] transition-colors py-0.5 px-1 rounded hover:bg-teal-50"
          >
            <span>View Similar Products</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
