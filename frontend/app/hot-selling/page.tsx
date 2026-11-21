import React from 'react';
import { Metadata } from 'next';
import { getProducts, getPageBanners, getBrands } from '@/lib/api';
import ListingPageLayout from '@/components/listing/ListingPageLayout';

export const metadata: Metadata = {
  title: 'Hot Selling Medical Devices & Clinic Equipment | Buy Denmed India',
  description: 'Fast-moving medical equipment, ICU mobility, autoclaves, and dental units trending across hospitals and clinics.'
};

export const dynamic = 'force-dynamic';

export default async function HotSellingPage() {
  const [productsData, banners, brands] = await Promise.all([
    getProducts({ featured: true, limit: 36 }),
    getPageBanners('hot_selling', 'all'),
    getBrands()
  ]);

  const defaultBanners = banners.length > 0 ? banners : [
    {
      id: 'banner-hotselling-default',
      pageType: 'hot_selling',
      slug: 'all',
      headline: 'Hot Selling Medical Devices & Supplies',
      tagline: 'High Volume Reorders',
      subtext: 'Proven reliability and top doctor adoption across private hospitals and dental chains.',
      imageUrl: '/images/hero_dental_setup_1793803412433.jpg',
      bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]',
      ctaText: 'Explore Hot Sellers',
      ctaLink: '#catalog'
    }
  ];

  return (
    <ListingPageLayout
      title="Hot Selling Medical Devices"
      description="The most requested clinical gear by dentists, intensivists, and healthcare administrators across India."
      ratingScore={4.8}
      ratingCount={1890}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Hot Selling' }
      ]}
      banners={defaultBanners}
      products={productsData.products}
      brands={brands}
    />
  );
}

