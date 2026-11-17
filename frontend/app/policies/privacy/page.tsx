import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Buy Denmed India',
  description: 'How Buy Denmed protects doctor credentials, clinic GST details, and patient sleep test data.'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Data Confidentiality
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          Privacy Policy & Medical Data Security
        </h1>
        <p className="text-xs text-[#5B6B82]">Last updated: November 2026</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-6 text-xs sm:text-sm text-[#5B6B82] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">1. Information Collected</h2>
          <p>
            We collect practitioner contact details (name, council registration, phone, email), delivery addresses, and GST numbers solely for order processing, logistics dispatch, and B2B tax invoice generation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">2. Sleep Apnea Diagnostic Confidentiality</h2>
          <p>
            Home Sleep Test recordings and physiological data (SpO2, airflow, AHI) are encrypted under HIPAA-equivalent medical confidentiality standards. Test results are shared solely with the patient and their consulting physician.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base text-[#12263F]">3. Zero Third-Party Selling</h2>
          <p>
            Buy Denmed never sells or monetizes medical practitioner contact lists to external marketing agencies or pharmaceutical advertisers.
          </p>
        </section>
      </div>
    </div>
  );
}
