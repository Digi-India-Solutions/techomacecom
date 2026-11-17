import React, { Suspense } from 'react';
import { Metadata } from 'next';
import RentalSuccessClient from '@/components/rental/RentalSuccessClient';
import { Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rental Booking Confirmed | Buy Denmed',
  description: 'Your medical equipment rental booking has been received and is pending KYC & biomedical approval.'
};

export default function RentalSuccessPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <Suspense
        fallback={
          <div className="py-20 text-center space-y-3">
            <Clock className="w-8 h-8 text-[#1D5FAF] animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#12263F]">Loading booking status...</p>
          </div>
        }
      >
        <RentalSuccessClient />
      </Suspense>
    </div>
  );
}
