'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileCheck2, PhoneCall, Truck, Wallet } from 'lucide-react';
import type { CustomerRental } from '@/types';
import { fetchMyRental } from '@/lib/api/rentals';
import { errorMessage } from '@/lib/api/backend';
import { useSiteSettings } from '@/lib/settings/store';
import { ConfirmationSkeleton } from '@/components/skeletons/PageSkeletons';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** /rent/success?rental=RNT-2026-00012 — shown right after the advance is paid. */
export default function RentalSuccessClient() {
  const params = useSearchParams();
  const ref = params.get('rental') || params.get('bookingId') || '';
  const { store } = useSiteSettings();
  const [rental, setRental] = useState<CustomerRental | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    fetchMyRental(ref)
      .then((r) => alive && setRental(r))
      .catch((err) => alive && setError(errorMessage(err, 'We could not load this booking.')));
    return () => {
      alive = false;
    };
  }, [ref]);

  if (!ref || error) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <AlertTriangle className="w-10 h-10 text-[#F28C38] mx-auto" />
        <h1 className="mt-4 text-xl font-semibold text-[#12263F]">{error || 'No booking selected'}</h1>
        <Link href="/account?tab=rentals" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1D5FAF] px-5 py-3 text-sm font-semibold text-white">
          Go to My Rentals <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }
  if (!rental) return <ConfirmationSkeleton className="" />;

  const paid = rental.status !== 'pending_payment';
  const next = [
    rental.kyc.required && rental.kyc.status !== 'approved' && {
      icon: FileCheck2,
      title: 'Document verification',
      text: 'Our team checks your documents, usually within a few hours. We will message you if anything needs to be re-uploaded.',
    },
    {
      icon: CheckCircle2,
      title: 'Booking confirmation',
      text: 'We confirm the booking and reserve a sanitised, calibrated, serial-numbered unit for you.',
    },
    rental.amounts.balanceDue > 0 && {
      icon: Wallet,
      title: `Balance of ${inr(rental.amounts.balanceDue)}`,
      text: rental.balanceDuePolicy === 'on_delivery' ? 'Pay it to our delivery team (cash or UPI) when the equipment arrives.' : 'Pay it from My Account → Rentals before we dispatch the equipment.',
    },
    {
      icon: Truck,
      title: 'Delivery & installation',
      text: `We deliver and set it up${rental.requestedStartDate ? ` around ${new Date(`${rental.requestedStartDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}. Your ${rental.plan.durationLabel} rental starts on the delivery day.`,
    },
  ].filter(Boolean) as { icon: React.ElementType; title: string; text: string }[];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#DCE6F2] p-6 sm:p-10 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${paid ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FFF7EF] text-[#F28C38]'}`}>
          {paid ? <CheckCircle2 className="w-9 h-9" /> : <Clock className="w-9 h-9" />}
        </div>
        <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-[#12263F]">{paid ? 'Booking received!' : 'Payment pending'}</h1>
        <p className="mt-2 text-[15px] text-[#5B6B82]">
          {paid ? (
            <>
              We received <strong className="text-[#12263F]">{inr(rental.amounts.paid)}</strong> for rental{' '}
              <span className="font-mono font-semibold text-[#12263F]">{rental.rentalNumber}</span>.
            </>
          ) : (
            <>Rental {rental.rentalNumber} is saved. Complete the payment from My Rentals to confirm it.</>
          )}
        </p>
        <div className="mt-6 flex items-center gap-4 text-left rounded-2xl border border-[#E8EEF5] bg-[#F8FAFD] p-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-xl bg-white border border-[#E8EEF5] relative overflow-hidden shrink-0">
            {rental.product.image && <Image src={rental.product.image} alt="" fill className="object-contain p-1.5" sizes="64px" referrerPolicy="no-referrer" />}
          </div>
          <div className="min-w-0 text-[13px]">
            <p className="font-semibold text-[#12263F] line-clamp-2">{rental.product.name}</p>
            <p className="text-[#5B6B82]">
              {rental.plan.durationLabel} · {inr(rental.plan.rate)}/{rental.plan.unit}
            </p>
            <p className="text-[#5B6B82]">Booking total {inr(rental.amounts.total)} incl. {inr(rental.amounts.deposit)} refundable deposit</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#DCE6F2] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-[#12263F]">What happens next</h2>
        <ol className="mt-4 space-y-4">
          {next.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={i} className="flex gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#12263F]">{s.title}</p>
                  <p className="text-[13px] text-[#5B6B82]">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/account/rentals/${rental.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] px-6 py-3 text-sm font-semibold text-white">
            Track this rental <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/rent" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5DEEA] px-6 py-3 text-sm font-semibold text-[#12263F] hover:border-[#1D5FAF]">
            Rent more equipment
          </Link>
        </div>
        <a href={store.supportPhoneHref} className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-[#5B6B82] hover:text-[#1D5FAF]">
          <PhoneCall className="w-4 h-4 text-[#1D5FAF]" /> Questions? Call {store.supportPhone}
        </a>
      </div>
    </div>
  );
}
