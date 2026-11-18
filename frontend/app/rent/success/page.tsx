import React, { Suspense } from 'react';
import { Metadata } from 'next';
import RentalSuccessClient from '@/components/rental/RentalSuccessClient';
import { ConfirmationSkeleton } from '@/components/skeletons/PageSkeletons';

export const metadata: Metadata = {
  title: 'Rental Booking Confirmed | Buy Denmed',
  description: 'Your medical equipment rental booking has been received and is pending KYC & biomedical approval.'
};

export default function RentalSuccessPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <Suspense
        fallback={<ConfirmationSkeleton className="" />}
      >
        <RentalSuccessClient />
      </Suspense>
    </div>
  );
}
