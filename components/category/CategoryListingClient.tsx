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
  // If no banners passed from server, generate default category banner
  const pageBanners: PageBanner[] = banners.length > 0 ? banners : [
    {
      id: `banner-${category.id}-1`,
      pageType: 'category',
      slug: category.slug,
      headline: `${category.name} Clinical Equipment & Essentials`,
      tagline: '100% Genuine Clinical Warranty',
      subtext: `Shop certified ${category.name.toLowerCase()} units with input GST tax credit, pan-India delivery, and calibration support.`,
      imageUrl: category.image || '/images/bento_oxygen_conc_1793803384593.jpg',
      bgColor: 'teal',
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
        { label: 'Categories', href: '/category/respiratory-care' },
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
