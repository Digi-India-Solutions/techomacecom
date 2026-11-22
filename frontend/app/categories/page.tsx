import React from 'react';
import { Metadata } from 'next';
import { getCategories, getPageBanners } from '@/lib/api';
import CategoriesDirectoryClient from '@/components/category/CategoriesDirectoryClient';

export const metadata: Metadata = {
  title: 'All Medical & Clinical Categories | Buy Denmed India',
  description: 'Explore complete clinical equipment, hospital furniture, dental operatories, oxygen concentrators, and homecare departments with verified warranty.'
};

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const [categories, banners] = await Promise.all([
    getCategories(),
    getPageBanners('categories', 'all').catch(() => [])
  ]);

  return <CategoriesDirectoryClient initialCategories={categories} banners={banners} />;
}

