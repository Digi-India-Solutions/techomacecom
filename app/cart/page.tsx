'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore, useToastStore } from '@/lib/store';
import { applyCoupon } from '@/lib/api';
import { getProductImageUrl } from '@/lib/utils';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Truck, 
  ChevronRight,
  Heart
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
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Your Clinic Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Browse through our extensive catalog of genuine dental equipment, respiratory units, and consumables at wholesale distributor prices.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-md"
          >
            Start Shopping Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#FF6B00]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-900">Shopping Cart</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2B2B2B] tracking-tight">
          Your Shopping Cart ({items.length} items)
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:underline font-semibold self-start sm:self-auto"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Free Shipping Alert */}
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-xs">
            {subtotal >= 1999 ? (
              <span className="text-green-700 font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                Congratulations! Your order qualifies for FREE Pan-India Doorstep Delivery.
              </span>
            ) : (
              <span className="text-gray-700 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF6B00]" />
                Add items worth <strong className="text-[#FF6B00]">₹{(1999 - subtotal).toLocaleString('en-IN')}</strong> more for FREE Pan-India Delivery!
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-xs">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'base'}-${item.isRental ? 'rent' : 'buy'}`}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden relative shrink-0">
                  <Image
                    src={getProductImageUrl(item.product)}
                    alt={item.product.name}
                    fill
                    className="object-contain p-1.5"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {item.product.brandName}
                  </div>
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="font-bold text-sm text-gray-900 hover:text-[#FF6B00] transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    SKU: {item.variantId ? item.product.variants?.find((v) => v.id === item.variantId)?.sku || item.product.sku : item.product.sku}
                  </div>
                  {item.variantName && (
                    <div className="text-xs text-gray-600 font-medium mt-0.5">
                      Selected Option: <strong>{item.variantName}</strong>
                    </div>
                  )}
                  {item.isRental && (
                    <div className="text-xs text-[#16A34A] font-bold mt-0.5">
                      Rental Plan: {item.rentalTenureMonths || 1} Month(s) with Zero Maintenance
                    </div>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                    className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                    className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Total Price for item */}
                <div className="text-right shrink-0 min-w-[100px]">
                  <div className="text-base font-black text-gray-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                  {item.mrp > item.price && (
                    <div className="text-xs text-gray-400 line-through">
                      ₹{(item.mrp * item.quantity).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-bold text-[#FF6B00] hover:underline inline-flex items-center gap-1"
            >
              ← Continue Shopping for other equipment
            </Link>
          </div>
        </div>

        {/* Right Summary Box (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5 sticky top-28">
          <h2 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">
            Price Summary
          </h2>

          {/* Coupon */}
          {coupon ? (
            <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-green-800 font-bold">
                <Tag className="w-4 h-4 text-green-600" />
                <span>Coupon &quot;{coupon.code}&quot; applied (-₹{discount.toLocaleString('en-IN')})</span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-red-600 hover:underline font-semibold"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Apply Discount Coupon:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="DENMED10 or CLINIC500"
                  className="flex-1 text-xs px-3 py-2.5 border border-gray-300 rounded-xl uppercase font-semibold focus:outline-none focus:border-[#FF6B00]"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2.5 bg-[#2B2B2B] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <div className="text-[11px] text-red-600">{couponError}</div>}
            </form>
          )}

          {/* Breakdown items */}
          <div className="space-y-2.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
            <div className="flex justify-between">
              <span>Item Subtotal ({items.length} items)</span>
              <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Coupon Discount</span>
                <span>-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pan-India Air Shipping</span>
              <span className="font-semibold text-gray-900">
                {shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (12% / 18%)</span>
              <span className="font-semibold text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-200">
              <span>Total Payable</span>
              <span className="text-xl text-[#FF6B00]">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="p-3 bg-gray-50 rounded-xl text-center space-y-1 text-gray-500 text-[11px]">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-gray-700">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>100% Tax Invoices with GSTIN verification</span>
            </div>
            <p>Save up to 18% as Input Tax Credit for your clinic or hospital.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
