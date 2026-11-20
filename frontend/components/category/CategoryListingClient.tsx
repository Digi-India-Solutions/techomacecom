'use client';

import React from 'react';
import { Product, Category, Brand, PageBanner } from '@/types';
import ListingPageLayout from '@/components/listing/ListingPageLayout';

interface CategoryListingClientProps {
  category: Category;
  initialProducts: Product[];
  brands: Brand[];
  initialSubCategory?: string;
  banners?: PageBanner[];
}

export const CategoryListingClient: React.FC<CategoryListingClientProps> = ({
  category,
  initialProducts,
  brands,
  initialSubCategory,
  banners = []
}) => {
  // Dedicated high-resolution promotional banners per category
  const categoryBannersMap: Record<string, PageBanner[]> = {
    'critical-care': [
      {
        id: 'banner-critical-care-1',
        pageType: 'category',
        slug: 'critical-care',
        headline: 'Critical Care & ICU High-Acuity Medical Equipment',
        tagline: 'Hospital-Grade Standards • AERB & CE Certified',
        subtext: 'Equip your ICU, emergency ward, and operation suites with multi-para patient monitors, precision syringe pumps, biphasic defibrillators, and heavy-duty medical suction.',
        imageUrl: '/images/bento_monitoring_vitals_1793803410618.jpg',
        bgColor: 'blue',
        ctaText: 'Explore ICU Equipment',
        ctaLink: '#catalog'
      },
      {
        id: 'banner-critical-care-2',
        pageType: 'category',
        slug: 'critical-care',
        headline: 'Hospital Procurement Rates & Input GST Tax Credit',
        tagline: 'Pan-India Delivery • Dedicated Clinical Support',
        subtext: 'Direct corporate inquiries for nursing homes, private clinics, and tertiary care hospitals with flexible equipment rental & zero-cost EMI plans.',
        imageUrl: '/images/rental_composed_banner_1793803411001.jpg',
        bgColor: 'navy',
        ctaText: 'Hospital Bulk Inquiry →',
        ctaLink: '/bulk-enquiry'
      }
    ],
    'respiratory-care': [
      {
        id: 'banner-respiratory-1',
        pageType: 'category',
        slug: 'respiratory-care',
        headline: 'Hospital & Home Respiratory Care Solutions',
        tagline: 'Authorized Distributor • 100% Genuine Clinical Warranty',
        subtext: 'Medical-grade oxygen concentrators (5L & 10L), CPAP/BiPAP machines, mesh nebulizers, and pulse oximeters with calibration certification.',
        imageUrl: '/images/bento_oxygen_conc_1793803384593.jpg',
        bgColor: 'blue',
        ctaText: 'Browse Respiratory Units',
        ctaLink: '#catalog'
      }
    ]
  };

  // Banner uploaded in Admin → Categories comes first
  const adminBanner: PageBanner[] = category.bannerDesktop
    ? [
        {
          id: `banner-${category.id}-admin`,
          pageType: 'category',
          slug: category.slug,
          headline: category.name,
          subtext: category.description,
          imageUrl: category.bannerDesktop,
          imageDesktop: category.bannerDesktop,
          imageMobile: category.bannerMobile || category.bannerDesktop,
          bgColor: 'blue',
          ctaText: 'Browse Catalog',
          ctaLink: '#catalog'
        }
      ]
    : [];

  const pageBanners: PageBanner[] =
    banners.length > 0
      ? banners
      : adminBanner.length > 0
        ? adminBanner
        : categoryBannersMap[category.slug] || [
          {
            id: `banner-${category.id}-1`,
            pageType: 'category',
            slug: category.slug,
            headline: `${category.name} Clinical Equipment & Essentials`,
            tagline: '100% Genuine Clinical Warranty',
            subtext: `Shop certified ${category.name.toLowerCase()} units with input GST tax credit, pan-India delivery, and calibration support.`,
            imageUrl: category.image || '/images/bento_oxygen_conc_1793803384593.jpg',
            bgColor: 'blue',
            ctaText: 'Browse Catalog',
            ctaLink: `#catalog`
          }
        ];

  return (
    <ListingPageLayout
      title={category.name}
      description={category.description}
      ratingScore={4.8}
      ratingCount={category.itemCount * 3 + 120}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Categories', href: '/#categories' },
        // Parent categories (Level 1 → 2) when this is a subcategory page
        ...(category.breadcrumbs || []).slice(0, -1).map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
        { label: category.name }
      ]}
      banners={pageBanners}
      products={initialProducts}
      brands={brands}
      initialSubCategory={initialSubCategory}
    />
  );
};

export default CategoryListingClient;
