import React from 'react';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/api/cms';

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
  const page = await getCmsPage('rental-terms');

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
                A refundable security deposit is collected prior to machine handover. Monthly rental is billed in advance on the 1st of every calendar cycle. The security deposit is refunded 100% within 48 hours of equipment return and physical inspection.
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
