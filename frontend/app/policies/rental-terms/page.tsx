import React from 'react';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/api/cms';
import { getSiteSettings } from '@/lib/settings/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('rental-terms');
  return {
    title: page?.seoTitle || 'Medical Equipment Rental Terms & Conditions | Buy Denmed',
    description:
      page?.seoDescription ||
      'Terms of service for renting oxygen concentrators, CPAP/BiPAP, and hospital ICU beds.',
  };
}

export default async function RentalTermsPage() {
  const [page, settings] = await Promise.all([getCmsPage('rental-terms'), getSiteSettings()]);
  const r = settings.rental;
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  // Always current — from admin → Settings → Rental
  const glance = [
    {
      label: 'Booking payment',
      value: r.advancePaymentPercent >= 100 ? 'Full amount' : `${r.advancePaymentPercent}% advance`,
      hint: r.advancePaymentPercent >= 100 ? 'rent + deposit + delivery at checkout' : `balance ${r.balanceDue === 'on_delivery' ? 'on delivery' : 'before dispatch'}`,
    },
    {
      label: 'Documents',
      value: r.kycDocuments.length ? r.kycDocuments.map((d) => d.label).join(', ') : 'Not required',
      hint: 'plus a prescription where the product needs one',
    },
    {
      label: 'Late return',
      value: r.lateFeePerDay > 0 ? `${inr(r.lateFeePerDay)}/day` : 'No late fee',
      hint: r.gracePeriodDays > 0 ? `after ${r.gracePeriodDays} grace day${r.gracePeriodDays === 1 ? '' : 's'}` : 'from the day after the end date',
    },
    { label: 'Deposit refund', value: `Within ${r.depositRefundDays} days`, hint: 'of pickup and inspection, minus deductions' },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Equipment Agreement
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          {page?.title || 'Medical Equipment Rental Terms & Conditions'}
        </h1>
        <p className="text-xs text-[#5B6B82]">
          Last updated: {page?.updatedAt ? new Date(page.updatedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'November 2026'}
        </p>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {glance.map((g) => (
            <div key={g.label} className="rounded-2xl border border-[#DCE6F2] bg-[#F8FAFD] p-4">
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#5B6B82]">{g.label}</dt>
              <dd className="mt-1 text-base font-bold text-[#12263F]">{g.value}</dd>
              <dd className="text-[12px] text-[#8A97A8]">{g.hint}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-6 text-xs sm:text-sm text-[#5B6B82] leading-relaxed">
        {page?.contentHtml ? (
          <div
            className="prose prose-slate max-w-none text-xs sm:text-sm text-[#5B6B82] leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <>
            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">1. Security Deposit &amp; Monthly Billing</h2>
              <p>
                Rent for the booked period, delivery &amp; pickup, GST and a refundable security deposit are paid at booking
                {r.advancePaymentPercent < 100
                  ? ` (${r.advancePaymentPercent}% advance online; the balance is due ${r.balanceDue === 'on_delivery' ? 'on delivery' : 'before dispatch'})`
                  : ''}
                . The rental period starts on the day the equipment is delivered and installed. The deposit is refunded within {r.depositRefundDays} days
                of pickup and inspection, minus any late fees, damage or missing accessories.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">2. Free Maintenance &amp; Breakdown Guarantee</h2>
              <p>
                Renters bear zero repair or routine service expenses. If an oxygen concentrator or CPAP machine displays a fault or low oxygen purity alarm, our technician will provide an immediate replacement unit within 4 hours in metro areas.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">3. Purchase Buy-Out Option</h2>
              <p>
                Clients wishing to purchase their rented equipment after 3 or 6 months can adjust up to 50% of total rentals paid towards the final discounted equipment purchase price.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
