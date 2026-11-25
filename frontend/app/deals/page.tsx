import React from 'react';
import { Metadata } from 'next';
import { getDealsOfTheDay, getProducts, getPageBanners, getBrands, getHomepageConfig } from '@/lib/api';
import ListingPageLayout from '@/components/listing/ListingPageLayout';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Deal of the Day - Flash Medical & Dental Clearance | Buy Denmed India',
  description: 'Limited-time daily deals on certified clinical equipment, dental operatory instruments, and respiratory devices.'
};

export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  const [homepageConfig, dealsData, allProductsRes, banners, brands] = await Promise.all([
    getHomepageConfig().catch(() => null),
    getDealsOfTheDay(),
    getProducts({ limit: 100 }),
    getPageBanners('deal_of_the_day', 'all'),
    getBrands()
  ]);

  const sec = (homepageConfig?.sections || []).find((s: any) => s.key === 'deal_of_the_day');
  const selectedIds: string[] = sec?.selectedIds || sec?.targetIds || [];

  let activeDeals: Product[] = [];
  const pool = [...dealsData, ...(allProductsRes.products || [])];

  if (selectedIds.length > 0) {
    const map = new Map<string, Product>();
    pool.forEach((p) => {
      map.set(String(p.id).toLowerCase(), p);
      if (p.slug) map.set(p.slug.toLowerCase(), p);
      if (p.sku) map.set(p.sku.toLowerCase(), p);
    });

    selectedIds.forEach((id) => {
      const cleanId = String(id).toLowerCase();
      let match = map.get(cleanId);
      if (!match) {
        const stripped = cleanId.replace(/^prod-/, '').replace(/[-_]/g, '');
        match = pool.find((p) => {
          const s = (p.slug || '').toLowerCase().replace(/[-_]/g, '');
          const k = (p.sku || '').toLowerCase().replace(/[-_]/g, '');
          const n = (p.name || '').toLowerCase().replace(/[-_]/g, '');
          return s.includes(stripped) || k.includes(stripped) || n.includes(stripped);
        });
      }
      if (match && !activeDeals.some((p) => p.id === match!.id)) {
        activeDeals.push(match);
      }
    });
  }

  // If no curated products are selected in Admin, fall back to deals from catalog
  if (selectedIds.length === 0 || activeDeals.length === 0) {
    activeDeals = dealsData;
  }

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
      title={sec?.title || "Deals of the Day"}
      description="Exclusive time-limited offers on ICU gear, patient monitors, operatory tools, and clinic essentials with pan-India delivery."
      ratingScore={4.9}
      ratingCount={1420}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Deal of the Day' }
      ]}
      banners={defaultBanners}
      products={activeDeals}
      brands={brands}
    />
  );
}
