import React from 'react';
import { Metadata } from 'next';
import RentalDetailView from '@/components/account/RentalDetailView';

interface RentalDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Rental details | Buy Denmed',
  robots: { index: false },
};

/** My rental — loaded in the browser with the customer's session (live API). */
export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = await params;
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <RentalDetailView id={id} />
    </div>
  );
}
