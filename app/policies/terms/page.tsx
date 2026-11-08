import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Sale & Service | Buy Denmed India',
  description: 'Terms of sale, medical equipment warranties, and electronic commerce agreements.'
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
          Legal Agreement
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B2B2B] tracking-tight">
          Terms of Sale & Service
        </h1>
        <p className="text-xs text-gray-500">Last updated: November 2026</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or ordering equipment from Buy Denmed, you agree to comply with and be bound by these terms. Our catalog is intended primarily for qualified healthcare professionals, clinics, hospitals, and end-users requiring home medical care.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">2. Pricing & GST</h2>
          <p>
            All listed prices are in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST) unless specified. Valid GST invoices with appropriate HSN codes are provided for every purchase.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">3. Jurisdiction</h2>
          <p>
            Any disputes arising in connection with orders or equipment sales shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
          </p>
        </section>
      </div>
    </div>
  );
}
