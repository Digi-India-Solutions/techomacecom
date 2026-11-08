import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getDealsOfTheDay, getProducts, getPageBanners } from '@/lib/api';
import { MOCK_COUPONS } from '@/lib/mock/data';
import ProductCard from '@/components/product/ProductCard';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import { Percent, Tag, Zap, Copy, Check, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Special Clinical Offers & Coupons | Buy Denmed India',
  description: 'Save up to 40% on dental consumables, hospital autoclaves, oxygen concentrators, and exclusive coupon codes for verified doctors.'
};

export default async function OffersPage() {
  const [deals, discounted, banners] = await Promise.all([
    getDealsOfTheDay(),
    getProducts({ minDiscount: 20, limit: 16 }),
    getPageBanners('offers', 'all')
  ]);

  const defaultBanners = banners.length > 0 ? banners : [
    {
      id: 'banner-offers-1',
      pageType: 'offers',
      slug: 'all',
      headline: 'Doctor Exclusive Promotions & Clinical Combos',
      tagline: 'Save Up to 40% OFF',
      subtext: 'Seasonal discounts, bundle offers, and 1-click apply coupons for clinics and hospitals across India.',
      imageUrl: '/images/hero_medical_sale_1793803411713.jpg',
      bgColor: 'teal',
      ctaText: 'View Deals',
      ctaLink: '#deals'
    }
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8 font-body">
      {/* 1. Page Banner Slider */}
      <PageBannerSlider banners={defaultBanners} />

      {/* 2. Header & Active Discount Vouchers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Active Discount Vouchers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_COUPONS.map((coupon) => (
            <div
              key={coupon.code}
              className="bg-white p-5 rounded-2xl border-2 border-dashed border-teal-200 hover:border-[#0F766E] transition-colors flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-[#0F766E] bg-[#E6F4F3] px-2.5 py-1 rounded-lg">
                    {coupon.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Valid till {coupon.expiresAt}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  {coupon.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-heading">
                <span>Min Order: ₹{coupon.minOrderValue.toLocaleString('en-IN')}</span>
                <span className="text-[#0F766E] font-semibold">1-Click Apply</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Limited Period Lightning Deals */}
      <div id="deals" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F28C38] fill-current" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Limited Period Lightning Deals
            </h2>
          </div>
          <span className="text-xs text-amber-900 font-semibold bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-full font-heading">
            Special Pricing
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {deals.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>

      {/* 4. High Discount Products */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          20%+ Discount Clearance & Equipment
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {discounted.products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </div>
  );
}
