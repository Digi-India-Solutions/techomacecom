import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Equipment Rental Terms & Conditions | Buy Denmed',
  description: 'Terms of service for renting oxygen concentrators, CPAP/BiPAP, and hospital ICU beds.'
};

export default function RentalTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
          Equipment Agreement
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B2B2B] tracking-tight">
          Medical Equipment Rental Terms & Conditions
        </h1>
        <p className="text-xs text-gray-500">Last updated: November 2026</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">1. Security Deposit & Monthly Billing</h2>
          <p>
            A refundable security deposit is collected prior to machine handover. Monthly rental is billed in advance on the 1st of every calendar cycle. The security deposit is refunded 100% within 48 hours of equipment return and physical inspection.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">2. Free Maintenance & Breakdown Guarantee</h2>
          <p>
            Renters bear zero repair or routine service expenses. If an oxygen concentrator or CPAP machine displays a fault or low oxygen purity alarm, our technician will provide an immediate replacement unit within 4 hours in metro areas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">3. Purchase Buy-Out Option</h2>
          <p>
            Clients wishing to purchase their rented equipment after 3 or 6 months can adjust up to 50% of total rentals paid towards the final discounted equipment purchase price.
          </p>
        </section>
      </div>
    </div>
  );
}
