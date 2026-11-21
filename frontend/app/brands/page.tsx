import React from 'react';
import { Metadata } from 'next';
import { getBrands, getPageBanners } from '@/lib/api';
import BrandsDirectoryClient from '@/components/brand/BrandsDirectoryClient';

export const metadata: Metadata = {
  title: 'Shop by Brands A–Z | Buy Denmed India',
  description: 'Shop genuine equipment from Philips Respironics, ResMed, 3M ESPE, Dentsply Sirona, Omron, BPL Medical, W&H, and Woodpecker.'
};

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const [brands, banners] = await Promise.all([
    getBrands(),
    getPageBanners('brands', 'all')
  ]);

  return <BrandsDirectoryClient initialBrands={brands} banners={banners} />;
}
