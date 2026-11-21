import React from 'react';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/api/cms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('returns-refunds');
  return {
    title: page?.seoTitle || 'Returns & Replacement Policy | Buy Denmed',
    description:
      page?.seoDescription ||
      'Doctor-friendly 7-day return and replacement policy for medical and dental equipment.',
  };
}

export default async function ReturnsPolicyPage() {
  const page = await getCmsPage('returns-refunds');

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Customer Protection
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          {page?.title || 'Returns & Replacement Policy'}
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
              <h2 className="font-bold text-base text-[#12263F]">1. 7-Day Hassle-Free Replacement Window</h2>
              <p>
                If any product arrives damaged, defective, or with missing components, healthcare practitioners can report the issue within <strong className="text-[#12263F]">7 days</strong> of delivery. Our logistics team will arrange reverse pickup and express dispatch of a replacement unit.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">2. Conditions for Return / Exchange</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Product must be in original condition with manufacturer serial numbers intact.</li>
                <li>Original box, warranty documents, accessories, and user manual must be preserved.</li>
                <li>Opened consumable items (e.g. syringes, files, local anesthetics) cannot be returned due to sterile medical device contamination standards, unless defective.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">3. Refund Processing</h2>
              <p>
                Refunds are credited directly to the original payment source (credit card, UPI, bank account) within <strong className="text-[#12263F]">3-5 business days</strong> following our warehouse quality inspection.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
