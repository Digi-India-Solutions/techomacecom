import React from 'react';
import type { Metadata } from 'next';
import SellOnBuyDenmedClient from '@/components/sell/SellOnBuyDenmedClient';

export const metadata: Metadata = {
  title: 'Sell on Buy Denmed — Become a Verified Dental Seller Partner',
  description:
    'Expand your business across India. Register as a seller partner on Buy Denmed to list dental equipment, instruments, and consumables to reach 50,000+ verified dentists and clinics.',
  keywords: [
    'sell on buy denmed',
    'dental seller registration india',
    'dental equipment distributor onboarding',
    'sell dental products online',
    'dentalkart seller alternative',
    'dental consumables supplier partner',
    'medical equipment vendor registration',
  ],
  alternates: {
    canonical: '/sell',
  },
  openGraph: {
    title: 'Sell on Buy Denmed — Become a Verified Dental Seller Partner',
    description:
      'List your dental equipment and consumables on Buy Denmed. Zero upfront listing fee, pan-India courier pickups, and guaranteed weekly bank payouts.',
    url: '/sell',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Buy Denmed',
  },
};

export default function SellPage() {
  return <SellOnBuyDenmedClient />;
}
