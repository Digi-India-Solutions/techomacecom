import React from 'react';
import { Metadata } from 'next';
import { getNewArrivals, getPageBanners, getBrands } from '@/lib/api';
import ListingPageLayout from '@/components/listing/ListingPageLayout';

export const metadata: Metadata = {
  title: 'New Arrivals - Latest Medical & Dental Tech | Buy Denmed India',
  description: 'Discover the latest releases in digital dental radiology, cordless endomotors, Class B vacuum autoclaves, and patient monitoring.'
};

export default async function NewArrivalsPage() {
  const [products, banners, brands] = await Promise.all([
    getNewArrivals(),
    getPageBanners('new_arrivals', 'all'),
    getBrands()
  ]);

  const defaultBanners = banners.length > 0 ? banners : [
    {
      id: 'banner-newarrivals-1',
      pageType: 'new_arrivals',
      slug: 'all',
      headline: 'New Arrivals & Next-Gen Healthcare Innovations',
      tagline: '2026 Launches',
      subtext: 'Upgrade your facility with the newest precision dental handpieces, digital imaging, and patient monitors.',
      imageUrl: '/images/hero_dental_setup_1793803412433.jpg',
      bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]',
      ctaText: 'Explore New Launches',
      ctaLink: '#catalog'
    }
  ];

  return (
    <ListingPageLayout
      title="New Arrivals & Tech Innovations"
      description="Upgrade your operatory with cutting-edge brushless cordless motors, HD CMOS RVG sensors, and quiet oil-free compressors."
      ratingScore={4.8}
      ratingCount={640}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'New Arrivals' }
      ]}
      banners={defaultBanners}
      products={products}
      brands={brands}
    />
  );
}
