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
      bgColor: 'blue',
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
          <Tag className="w-5 h-5 text-[#1D5FAF]" />
          <h2 className="text-xl font-bold text-[#12263F] font-heading">
            Active Discount Vouchers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_COUPONS.map((coupon) => (
            <div
              key={coupon.code}
              className="bg-white p-5 rounded-2xl border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] transition-colors flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-[#174E90] bg-[#EAF2FC] px-2.5 py-1 rounded-lg">
                    {coupon.code}
                  </span>
                  <span className="text-[11px] text-[#5B6B82] font-medium">
                    Valid till {coupon.expiresAt}
                  </span>
                </div>
                <p className="text-xs text-[#5B6B82] mt-2 font-medium leading-relaxed">
                  {coupon.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#DCE6F2] flex items-center justify-between text-[12px] text-[#5B6B82] font-heading">
                <span>Min Order: ₹{coupon.minOrderValue.toLocaleString('en-IN')}</span>
                <span className="text-[#1D5FAF] font-semibold">1-Click Apply</span>
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
            <h2 className="text-xl font-bold text-[#12263F] font-heading">
              Limited Period Lightning Deals
            </h2>
          </div>
          <span className="text-xs text-[#12263F] font-semibold bg-[#F28C38]/20 border border-[#F28C38]/40 px-3 py-1 rounded-full font-heading">
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
        <h2 className="text-xl font-bold text-[#12263F] font-heading">
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
