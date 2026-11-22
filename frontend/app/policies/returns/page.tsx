import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getCmsPage } from '@/lib/api/cms';
import { getSiteSettings } from '@/lib/settings/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getCmsPage('returns-refunds'), getSiteSettings()]);
  return {
    title: page?.seoTitle || `Returns & Replacement Policy | ${settings.store.brandName}`,
    description:
      page?.seoDescription ||
      `${settings.returns.returnWindowDays}-day return and replacement policy for medical and dental equipment, with refunds in ${settings.returns.refundProcessingDays} business days.`,
  };
}

/** Numbers come from admin → Settings → Returns & Refunds, so they are always current. */
export default async function ReturnsPolicyPage() {
  const [page, settings] = await Promise.all([getCmsPage('returns-refunds'), getSiteSettings()]);
  const r = settings.returns;
  const options = [r.refundEnabled && 'a refund', r.replacementEnabled && 'a replacement'].filter(Boolean).join(' or ');

  const glance = r.returnsEnabled
    ? [
        { label: 'Return window', value: `${r.returnWindowDays} days`, hint: 'from the date of delivery' },
        {
          label: 'You can ask for',
          value: r.refundEnabled && r.replacementEnabled ? 'Refund or replacement' : r.refundEnabled ? 'Refund' : 'Replacement',
          hint: 'after pickup & inspection',
        },
        { label: 'Refund time', value: `${r.refundProcessingDays} days`, hint: 'business days after inspection' },
        { label: 'Pickup', value: 'Free', hint: 'from your delivery address' },
      ]
    : [];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-4">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">Customer Protection</span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#12263F] tracking-tight">{page?.title || 'Returns & Replacement Policy'}</h1>
        <p className="text-xs text-[#5B6B82]">
          Last updated:{' '}
          {page?.updatedAt ? new Date(page.updatedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'November 2026'}
        </p>
        {glance.length > 0 ? (
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {glance.map((g) => (
              <div key={g.label} className="rounded-2xl border border-[#DCE6F2] bg-[#F8FAFD] p-4">
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#5B6B82]">{g.label}</dt>
                <dd className="mt-1 text-lg font-bold text-[#12263F]">{g.value}</dd>
                <dd className="text-[12px] text-[#8A97A8]">{g.hint}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Online returns are currently paused. Please contact {settings.store.supportPhone} or {settings.store.supportEmail} for help with an order.
          </p>
        )}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] shadow-xs space-y-6 text-sm text-[#5B6B82] leading-relaxed">
        {page?.contentHtml ? (
          <div className="prose prose-slate max-w-none text-sm text-[#5B6B82] leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
        ) : (
          <>
            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">1. {r.returnWindowDays}-day return &amp; replacement window</h2>
              <p>
                If a product arrives damaged, defective, incomplete or different from what you ordered, you can request {options || 'help'} within{' '}
                <strong className="text-[#12263F]">{r.returnWindowDays} days</strong> of delivery. We arrange a free pickup from your delivery address and
                inspect the item when it reaches our warehouse.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">2. How to request a return</h2>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Sign in and open{' '}
                  <Link href="/account?tab=orders" className="text-[#1D5FAF] font-semibold hover:underline">
                    My Orders
                  </Link>
                  .
                </li>
                <li>On the delivered order, choose “Return or replace”, select the items and tell us what went wrong.</li>
                <li>{r.photosRequired ? 'Add photos of the product and its packaging (required).' : 'Add photos of the product and packaging if you can.'}</li>
                <li>
                  Track approval, pickup and your refund or replacement under{' '}
                  <Link href="/account?tab=returns" className="text-[#1D5FAF] font-semibold hover:underline">
                    Returns &amp; refunds
                  </Link>
                  .
                </li>
              </ol>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">3. Conditions</h2>
              <p>{r.conditions}</p>
              <p>Some categories, such as opened sterile or single-use consumables, are marked “Not returnable” on your order.</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">4. Refunds</h2>
              <p>
                Prepaid orders are refunded to the original payment method (card, UPI, net banking or EMI). Cash on delivery orders are refunded to the bank
                account or UPI id you give us. Refunds are issued after inspection and usually reach you within{' '}
                <strong className="text-[#12263F]">{r.refundProcessingDays} business days</strong>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base text-[#12263F]">5. Cancellations</h2>
              <p>
                You can cancel an order from My Orders until it is dispatched. Prepaid cancellations are refunded automatically to the original payment
                method.
              </p>
            </section>
          </>
        )}
        <p className="border-t border-[#E8EEF5] pt-4 text-[13px]">
          Need help? Call <a href={settings.store.supportPhoneHref} className="font-semibold text-[#1D5FAF]">{settings.store.supportPhone}</a> or email{' '}
          <a href={`mailto:${settings.store.supportEmail}`} className="font-semibold text-[#1D5FAF]">
            {settings.store.supportEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
