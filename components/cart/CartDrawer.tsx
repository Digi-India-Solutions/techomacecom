'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, useToastStore } from '@/lib/store';
import { applyCoupon } from '@/lib/api';
import { getProductImageUrl } from '@/lib/utils';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, ShieldCheck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
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
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const gst = getGstAmount();
  const total = getTotal();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await applyCoupon(couponInput.trim(), subtotal);
      if (res.valid && res.coupon) {
        setStoreCoupon(res.coupon);
        setCouponInput('');
        addToast({
          type: 'success',
          title: 'Coupon Applied',
          message: res.message
        });
      } else {
        setCouponError(res.message);
      }
    } catch {
      setCouponError('Failed to apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#1E293B] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-teal-300" />
              <h2 className="font-bold text-base">Your Cart ({items.length} items)</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-[#0F766E]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="font-bold text-gray-800 text-lg">Your cart is empty</div>
                <p className="text-xs text-gray-500 max-w-xs">
                  Discover genuine medical equipment, dental units, and clinic consumables at wholesale prices.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <>
                {/* Free shipping progress indicator */}
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-xs">
                  {subtotal >= 1999 ? (
                    <span className="text-teal-800 font-semibold flex items-center gap-1.5">
                      🎉 Free Pan-India Delivery unlocked!
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      Add <strong className="text-[#0F766E]">₹{(1999 - subtotal).toLocaleString('en-IN')}</strong> more to get <strong>FREE Pan-India Delivery</strong>
                    </span>
                  )}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#0F766E] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / 1999) * 100)}%` }}
                    />
                  </div>
                </div>

                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || 'base'}-${item.isRental ? 'rent' : 'buy'}`}
                    className="p-3 rounded-xl border border-gray-200 bg-white flex gap-3 relative group"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 relative">
                      <Image
                        src={getProductImageUrl(item.product)}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                        {item.product.brandName}
                      </div>
                      <Link
                        href={`/product/${item.product.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="font-semibold text-xs text-gray-900 hover:text-[#0F766E] line-clamp-2 leading-snug"
                      >
                        {item.product.name}
                      </Link>

                      {item.variantName && (
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Variant: <span className="font-medium">{item.variantName}</span>
                        </div>
                      )}

                      {item.isRental && (
                        <div className="text-[11px] text-[#0F766E] font-semibold mt-0.5">
                          Rental Plan: {item.rentalTenureMonths || 1} Month(s)
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-sm text-gray-900">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-[11px] text-gray-400 line-through">
                              ₹{item.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="p-1 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            className="p-1 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3 shrink-0">
              {/* Coupon input */}
              {coupon ? (
                <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-xl border border-green-200 text-xs">
                  <div className="flex items-center gap-1.5 text-green-800 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                    <span>Coupon: {coupon.code} (-₹{discount.toLocaleString('en-IN')})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon: DENMED10 or CLINIC500"
                    className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg uppercase tracking-wider font-semibold focus:outline-none focus:border-[#0F766E]"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-3.5 py-2 bg-[#1E293B] hover:bg-[#273449] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <div className="text-[11px] text-red-600 font-medium">{couponError}</div>}

              {/* Price breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pan-India Delivery</span>
                  <span className="font-semibold text-gray-900">
                    {shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (12% / 18%)</span>
                  <span className="font-semibold text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-base text-slate-900 font-extrabold">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span>GST Tax Invoices for Clinic Input Tax Credit</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
