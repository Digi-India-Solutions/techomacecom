'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore, useToastStore } from '@/lib/store';
import { applyCoupon } from '@/lib/api';
import { getProductImageUrl } from '@/lib/utils';
import { 
  ChevronRight, 
  Minus, 
  Plus, 
  ShoppingBag,
  Tag
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getGstAmount,
    getTotal,
    coupon,
    applyCoupon: setStoreCoupon,
    removeCoupon
  } = useCartStore();

  const { addToast } = useToastStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const gst = getGstAmount();
  const total = getTotal();

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await applyCoupon(couponCode.trim(), subtotal);
      if (res.valid && res.coupon) {
        setStoreCoupon(res.coupon);
        setCouponCode('');
        setShowPromoInput(false);
        addToast({ type: 'success', title: 'Coupon Applied', message: res.message });
      } else {
        setCouponError(res.message);
      }
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#5B6B82] mb-4">
          <Link href="/" className="hover:text-[#12263F] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
          <span className="text-[#12263F] font-medium">Shopping bag</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#12263F] font-heading mb-8">
          Your bag
        </h1>

        <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#EAF2FC] flex items-center justify-center text-[#1D5FAF] mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#12263F] font-heading">
            Your bag is currently empty
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6B82]">
            Explore our collection of hospital-grade medical diagnostics, dental equipment, and clinical supplies.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block py-3 px-6 bg-[#13335E] hover:bg-[#0B2545] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Breadcrumb matching screenshot */}
      <nav className="flex items-center gap-2 text-xs text-[#5B6B82] mb-4">
        <Link href="/" className="hover:text-[#12263F] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <span className="text-[#12263F] font-medium">Shopping bag</span>
      </nav>

      {/* Main Title matching screenshot */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#12263F] font-heading">
          Your bag
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline cursor-pointer"
        >
          Clear all
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 divide-y divide-gray-200">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'base'}-${item.isRental ? 'rent' : 'buy'}`}
              className="py-6 first:pt-0"
            >
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Product Thumbnail */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-white border border-gray-100 p-2 relative shrink-0 flex items-center justify-center">
                  <Image
                    src={getProductImageUrl(item.product)}
                    alt={item.product.name}
                    fill
                    className="object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Product Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="pr-2">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="font-semibold text-sm sm:text-base text-[#12263F] hover:text-[#1D5FAF] transition-colors line-clamp-2 leading-snug"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-[#5B6B82] mt-1">
                        {item.product.brandName}
                      </p>
                    </div>

                    {/* Line Total aligned right */}
                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm sm:text-base text-[#12263F]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="mt-2 font-bold text-sm sm:text-base text-[#12263F]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>

                  {/* Quantity Stepper & Red Remove Button matching screenshot */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[#12263F]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium hover:underline cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order summary card matching screenshot */}
        <div className="lg:col-span-4 sticky top-28">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xl font-bold font-heading text-[#12263F]">
              Order summary
            </h2>

            {/* Line items breakdown */}
            <div className="space-y-3 text-sm text-[#5B6B82] pt-2">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#12263F]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-[#16A34A] font-semibold">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Estimated GST</span>
                <span className="font-semibold text-[#12263F]">
                  ₹{gst.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-[#12263F]">
                  {shipping === 0 ? 'Free' : `₹${shipping}`}
                </span>
              </div>
            </div>

            {/* Optional Collapsible Promo Code */}
            {coupon ? (
              <div className="p-2.5 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between text-xs">
                <span className="text-green-800 font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-green-600" />
                  Coupon applied: {coupon.code}
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-red-500 hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="pt-1">
                {!showPromoInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="text-xs text-[#1D5FAF] hover:underline font-medium cursor-pointer"
                  >
                    + Add promo or coupon code
                  </button>
                ) : (
                  <form onSubmit={handleApply} className="space-y-1.5 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon Code"
                        className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg uppercase font-semibold focus:outline-none focus:border-[#13335E] text-[#12263F]"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3.5 py-2 bg-[#13335E] hover:bg-[#0B2545] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <div className="text-[12px] text-red-500">{couponError}</div>}
                  </form>
                )}
              </div>
            )}

            {/* Total Section matching screenshot */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center justify-between text-base font-bold text-[#12263F]">
                <span>Estimated total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-[#5B6B82] leading-relaxed">
                Final tax and delivery details may be confirmed by our team.
              </p>
            </div>

            {/* Action Buttons matching screenshot */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="w-full py-3 px-4 bg-[#13335E] hover:bg-[#0B2545] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs text-center cursor-pointer"
              >
                Continue to order request
              </button>

              <Link
                href="/"
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-[#12263F] font-semibold text-sm rounded-lg transition-colors text-center block cursor-pointer"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
