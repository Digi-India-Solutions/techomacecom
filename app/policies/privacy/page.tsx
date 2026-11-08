import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Buy Denmed India',
  description: 'How Buy Denmed protects doctor credentials, clinic GST details, and patient sleep test data.'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
          Data Confidentiality
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#2B2B2B] tracking-tight">
          Privacy Policy & Medical Data Security
        </h1>
        <p className="text-xs text-gray-500">Last updated: November 2026</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">1. Information Collected</h2>
          <p>
            We collect practitioner contact details (name, council registration, phone, email), delivery addresses, and GST numbers solely for order processing, logistics dispatch, and B2B tax invoice generation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">2. Sleep Apnea Diagnostic Confidentiality</h2>
          <p>
            Home Sleep Test recordings and physiological data (SpO2, airflow, AHI) are encrypted under HIPAA-equivalent medical confidentiality standards. Test results are shared solely with the patient and their consulting physician.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-gray-900">3. Zero Third-Party Selling</h2>
          <p>
            Buy Denmed never sells or monetizes medical practitioner contact lists to external marketing agencies or pharmaceutical advertisers.
          </p>
        </section>
      </div>
    </div>
  );
}
