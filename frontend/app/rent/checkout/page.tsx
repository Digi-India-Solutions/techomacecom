import React from 'react';
import { Metadata } from 'next';
import RentalCheckoutClient from '@/components/rental/RentalCheckoutClient';

export const metadata: Metadata = {
  title: 'Rental Booking & KYC Verification | Buy Denmed',
  description: 'Complete your medical equipment rental booking with verified KYC and secure Razorpay payment.'
};

export default function RentalCheckoutPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <RentalCheckoutClient />
    </div>
  );
}
