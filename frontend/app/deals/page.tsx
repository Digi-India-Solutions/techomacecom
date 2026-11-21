import React from 'react';
import { Metadata } from 'next';
import { getDealsOfTheDay, getPageBanners, getBrands } from '@/lib/api';
import ListingPageLayout from '@/components/listing/ListingPageLayout';

export const metadata: Metadata = {
  title: 'Deal of the Day - Flash Medical & Dental Clearance | Buy Denmed India',
  description: 'Limited-time daily deals on certified clinical equipment, dental operatory instruments, and respiratory devices.'
};

export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  const [products, banners, brands] = await Promise.all([
    getDealsOfTheDay(),
    getPageBanners('deal_of_the_day', 'all'),
    getBrands()
  ]);

  const defaultBanners = banners.length > 0 ? banners : [
    {
      id: 'banner-deals-default',
      pageType: 'deal_of_day',
      slug: 'all',
      headline: '24-Hour Clinic Flash Deals & Clearance',
      tagline: 'Up to 35% Instant Markdown',
      subtext: 'Daily rotational deals on biomedical equipment, patient care, and dental consumables.',
      imageUrl: '/images/hero_medical_sale_1793803411713.jpg',
      bgColor: 'from-[#EAF2FC] via-white to-[#F6F9FD]',
      ctaText: 'Claim Deals Now',
      ctaLink: '#catalog'
    }
  ];

  return (
    <ListingPageLayout
      title="Deals of the Day"
      description="Exclusive time-limited offers on ICU gear, patient monitors, operatory tools, and clinic essentials with pan-India delivery."
      ratingScore={4.9}
      ratingCount={1420}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Deal of the Day' }
      ]}
      banners={defaultBanners}
      products={products}
      brands={brands}
    />
  );
}

