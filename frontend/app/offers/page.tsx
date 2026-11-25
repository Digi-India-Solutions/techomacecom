import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getDealsOfTheDay, getProducts, getPageBanners, getActiveCoupons } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import PageBannerSlider from '@/components/common/PageBannerSlider';
import OffersCouponGrid from '@/components/offers/OffersCouponGrid';
import { Percent, Tag, Zap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Special Clinical Offers & Coupons | Buy Denmed India',
  description: 'Save up to 40% on dental consumables, hospital autoclaves, oxygen concentrators, and exclusive coupon codes for verified doctors.'
};

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const [deals, discounted, banners, coupons] = await Promise.all([
    getDealsOfTheDay(),
    getProducts({ minDiscount: 20, limit: 16 }),
    getPageBanners('offers', 'all'),
    getActiveCoupons(),
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

        <OffersCouponGrid coupons={coupons} />
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

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {deals.map((prod) => (
            <ProductCard key={prod.id} product={prod} className="h-full" />
          ))}
        </div>
      </div>

      {/* 4. High Discount Products */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#12263F] font-heading">
          20%+ Discount Clearance & Equipment
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {discounted.products.map((prod) => (
            <ProductCard key={prod.id} product={prod} className="h-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
