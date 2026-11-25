import React from 'react';
import { Metadata } from 'next';
import { getProducts, getPageBanners, getBrands, getHomepageConfig } from '@/lib/api';
import ListingPageLayout from '@/components/listing/ListingPageLayout';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Hot Selling Medical Devices & Clinic Equipment | Buy Denmed India',
  description: 'Fast-moving medical equipment, ICU mobility, autoclaves, and dental units trending across hospitals and clinics.'
};

export const dynamic = 'force-dynamic';

export default async function HotSellingPage() {
  const [homepageConfig, allProductsRes, banners, brands] = await Promise.all([
    getHomepageConfig().catch(() => null),
    getProducts({ limit: 100 }),
    getPageBanners('hot_selling', 'all'),
    getBrands()
  ]);

  const allProducts = allProductsRes.products || [];

  // Match the curated products configured in Admin → Homepage Sections → Hot Selling
  const sec = (homepageConfig?.sections || []).find((s: any) => s.key === 'hot_selling');
  const selectedIds: string[] = sec?.selectedIds || sec?.targetIds || [];

  let hotSellingProducts: Product[] = [];

  if (selectedIds.length > 0) {
    const map = new Map<string, Product>();
    allProducts.forEach((p) => {
      map.set(String(p.id).toLowerCase(), p);
      if (p.slug) map.set(p.slug.toLowerCase(), p);
      if (p.sku) map.set(p.sku.toLowerCase(), p);
    });

    selectedIds.forEach((id) => {
      const cleanId = String(id).toLowerCase();
      let match = map.get(cleanId);
      if (!match) {
        const stripped = cleanId.replace(/^prod-/, '').replace(/[-_]/g, '');
        match = allProducts.find((p) => {
          const s = (p.slug || '').toLowerCase().replace(/[-_]/g, '');
          const k = (p.sku || '').toLowerCase().replace(/[-_]/g, '');
          const n = (p.name || '').toLowerCase().replace(/[-_]/g, '');
          return s.includes(stripped) || k.includes(stripped) || n.includes(stripped);
        });
      }
      if (match && !hotSellingProducts.some((p) => p.id === match!.id)) {
        hotSellingProducts.push(match);
      }
    });
  }

  // Only if no specific products were selected by admin in Homepage Sections, fall back to catalog products
  if (selectedIds.length === 0 || hotSellingProducts.length === 0) {
    hotSellingProducts = allProducts.slice(0, 24);
  }

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
      title={sec?.title || "Hot Selling Medical Devices"}
      description="The most requested clinical gear by dentists, intensivists, and healthcare administrators across India."
      ratingScore={4.8}
      ratingCount={1890}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Hot Selling' }
      ]}
      banners={defaultBanners}
      products={hotSellingProducts}
      brands={brands}
    />
  );
}
