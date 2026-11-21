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

export const dynamic = 'force-dynamic';

export default async function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = await params;
  const rental = await getRentalById(id);

  if (!rental) {
    notFound();
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/account?tab=rentals"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6B82] hover:text-[#1D5FAF] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Rentals</span>
      </Link>

      <RentalDetailView initialRental={rental} />
    </div>
  );
}
