import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRentalById, getRentals } from '@/lib/api';
import RentalDetailView from '@/components/account/RentalDetailView';
import { ArrowLeft } from 'lucide-react';

interface RentalDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RentalDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const rental = await getRentalById(id);

  if (!rental) {
    return {
      title: 'Rental Contract Not Found | Buy Denmed'
    };
  }

  return {
    title: `Rental Contract ${rental.bookingNumber} | Buy Denmed`,
    description: `Details, timeline, payment history and service actions for ${rental.product.name}.`
  };
}

export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = await params;
  const rental = await getRentalById(id);

  if (!rental) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <Link
        href="/account?tab=rentals"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#FF6B00] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Rentals</span>
      </Link>

      <RentalDetailView initialRental={rental} />
    </div>
  );
}
