import React from 'react';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/api/cms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('terms-of-use');
  return {
    title: page?.seoTitle || 'Terms of Sale & Service | Buy Denmed India',
    description:
      page?.seoDescription ||
      'Terms of sale, medical equipment warranties, and electronic commerce agreements.',
  };
}

export default async function TermsOfServicePage() {
  const page = await getCmsPage('terms-of-use');

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Legal Agreement
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          {page?.title || 'Terms of Sale & Service'}
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
              <h2 className="font-bold text-base text-[#12263F]">1. Acceptance of Terms</h2>
              <p>
                By accessing or ordering equipment from Buy Denmed, you agree to comply with and be bound by these terms. Our catalog is intended primarily for qualified healthcare professionals, clinics, hospitals, and end-users requiring home medical care.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">2. Pricing &amp; GST</h2>
              <p>
                All listed prices are in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST) unless specified. Valid GST invoices with appropriate HSN codes are provided for every purchase.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">3. Jurisdiction</h2>
              <p>
                Any disputes arising in connection with orders or equipment sales shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
