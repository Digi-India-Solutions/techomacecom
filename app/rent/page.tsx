import React from 'react';
import { Metadata } from 'next';
import { getRentableProducts } from '@/lib/api';
import RentalCatalogClient from '@/components/rental/RentalCatalogClient';

export const metadata: Metadata = {
  title: 'Rent Medical Equipment Anywhere in India | Oxygen, CPAP, ICU Beds | Buy Denmed',
  description: 'Certified medical equipment on rent across India. Oxygen concentrators, ResMed CPAP/BiPAP, motorized wheelchairs, ICU hospital beds & suction machines with doorstep calibration and 100% refundable deposit.',
  openGraph: {
    title: 'Rent Medical Equipment Anywhere in India | Buy Denmed',
    description: 'Hospital-grade sanitized medical equipment on rent with doorstep delivery, zero maintenance AMC, and flexible daily, weekly & monthly plans.',
  }
};

export default async function RentPage() {
  const rentableProducts = await getRentableProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <RentalCatalogClient products={rentableProducts} />
    </div>
  );
}
