import React from 'react';
import { Metadata } from 'next';
import { getBestSellers, getPageBanners, getBrands } from '@/lib/api';
import ListingPageLayout from '@/components/listing/ListingPageLayout';

export const metadata: Metadata = {
  title: 'Best Selling Medical & Dental Equipment | Buy Denmed India',
  description: 'Top-selling clinic essentials, dental turbines, rotary files, and oxygen concentrators preferred by 15,000+ Indian healthcare providers.'
};

export default async function BestSellersPage() {
  const [products, banners, brands] = await Promise.all([
    getBestSellers(),
    getPageBanners('best_sellers', 'all'),
    getBrands()
  ]);

  const defaultBanners = banners.length > 0 ? banners : [
    {
      id: 'banner-bestsellers-1',
      pageType: 'best_sellers',
      slug: 'all',
      headline: 'Best Sellers In Highest Clinical Demand',
      tagline: 'Top Rated by 15,000+ Clinics',
      subtext: 'High-repeat order instruments and devices with pan-India warranty and doorstep delivery.',
      imageUrl: '/images/hero_medical_sale_1793803411713.jpg',
      bgColor: 'teal',
      ctaText: 'Shop Best Sellers',
      ctaLink: '#catalog'
    }
  ];

  return (
    <ListingPageLayout
      title="Best Sellers Across India"
      description="These top-rated instruments and devices have the highest clinical adoption and verified ratings from clinics across 28 Indian states."
      ratingScore={4.9}
      ratingCount={2840}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Best Sellers' }
      ]}
      banners={defaultBanners}
      products={products}
      brands={brands}
    />
  );
}
