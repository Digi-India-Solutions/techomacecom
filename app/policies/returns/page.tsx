import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Returns & Replacement Policy | Buy Denmed',
  description: 'Doctor-friendly 7-day return and replacement policy for medical and dental equipment.'
};

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
          Customer Protection
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B2B2B] tracking-tight">
          Returns & Replacement Policy
        </h1>
        <p className="text-xs text-gray-500">Last updated: November 2026</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">1. 7-Day Hassle-Free Replacement Window</h2>
          <p>
            If any product arrives damaged, defective, or with missing components, healthcare practitioners can report the issue within <strong>7 days</strong> of delivery. Our logistics team will arrange reverse pickup and express dispatch of a replacement unit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">2. Conditions for Return / Exchange</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Product must be in original condition with manufacturer serial numbers intact.</li>
            <li>Original box, warranty documents, accessories, and user manual must be preserved.</li>
            <li>Opened consumable items (e.g. syringes, files, local anesthetics) cannot be returned due to sterile medical device contamination standards, unless defective.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">3. Refund Processing</h2>
          <p>
            Refunds are credited directly to the original payment source (credit card, UPI, bank account) within <strong>3-5 business days</strong> following our warehouse quality inspection.
          </p>
        </section>
      </div>
    </div>
  );
}
