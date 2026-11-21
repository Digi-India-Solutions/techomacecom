'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/common/Logo';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, ChevronDown, Landmark, CalendarClock, Store } from 'lucide-react';
import { useCatalogCategories } from '@/lib/hooks/useCatalogCategories';

type FooterLink = { label: string; href: string };

/** Static columns; the "Shop" column (live categories) is prepended in the component. */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Services',
    links: [
      { label: 'Sell on Buy Denmed', href: '/sell' },
      { label: 'Equipment on Rent', href: '/rent' },
      { label: 'Home Sleep Test', href: '/sleep-test' },
      { label: 'Bulk & Institutional Orders', href: '/bulk-enquiry' },
      { label: 'Offers & Deals', href: '/offers' },
      { label: 'Best Sellers', href: '/best-sellers' },
      { label: 'New Arrivals', href: '/new-arrivals' }
    ]
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'My Account', href: '/account' },
      { label: 'Track Your Order', href: '/account?tab=orders' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Shipping Policy', href: '/policies/shipping' },
      { label: 'Returns & Replacement', href: '/policies/returns' },
      { label: 'Grievance Redressal', href: '/contact' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'Rental Terms', href: '/policies/rental-terms' },
      { label: 'Terms of Use', href: '/policies/terms' },
      { label: 'Privacy Policy', href: '/policies/privacy' }
    ]
  }
];

/** Brand logos live in /public/images/payments. Net Banking & EMI aren't brands, so they use an icon tile. */
const PAYMENT_METHODS: { name: string; logo?: string; width: string; icon?: React.ElementType }[] = [
  { name: 'UPI', logo: '/images/payments/upi.svg', width: 'w-[52px]' },
  { name: 'Visa', logo: '/images/payments/visa.svg', width: 'w-[48px]' },
  { name: 'Mastercard', logo: '/images/payments/mastercard.svg', width: 'w-[42px]' },
  { name: 'RuPay', logo: '/images/payments/rupay.svg', width: 'w-[56px]' },
  { name: 'Razorpay', logo: '/images/payments/razorpay.svg', width: 'w-[70px]' },
  { name: 'Net Banking', icon: Landmark, width: 'w-auto' },
  { name: 'EMI', icon: CalendarClock, width: 'w-auto' }
];

/** Link column — collapsible on mobile, always open from md up. */
const FooterColumn: React.FC<{ title: string; links: FooterLink[] }> = ({ title, links }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#2A2E35] md:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 md:py-0 md:mb-4 md:pointer-events-none text-left"
      >
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white">{title}</h3>
        <ChevronDown
          className={`w-4 h-4 text-[#8B929C] md:hidden transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <ul className={`${open ? 'block' : 'hidden'} md:block pb-4 md:pb-0 space-y-2.5`}>
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[14px] text-[#B4BAC3] hover:text-white hover:underline underline-offset-4 decoration-[#5A616B] transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  // Live categories from Admin → Catalog (only those marked "Show in navigation menu")
  const categories = useCatalogCategories({ menuOnly: true });
  const columns = [
    {
      title: 'Shop',
      links: [
        ...categories.slice(0, 6).map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
        { label: 'All Brands', href: '/brands' }
      ]
    },
    ...COLUMNS
  ];

  const { store } = useSiteSettings();
  const socials = [
    { href: store.social.instagram, label: 'Instagram', Icon: Instagram },
    { href: store.social.facebook, label: 'Facebook', Icon: Facebook },
    { href: store.social.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { href: store.social.youtube, label: 'YouTube', Icon: Youtube },
    { href: store.social.twitter, label: 'X (Twitter)', Icon: Twitter }
  ].filter((s) => s.href);

  return (
    <footer className="bg-[#17191D] text-[#B4BAC3] font-body pb-16 lg:pb-0">
      {/* ── Main columns ───────────────────────────────────────── */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-12 lg:pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-x-8 gap-y-2 md:gap-y-10">
          {/* About + contact */}
          <div className="md:col-span-4 lg:col-span-1 pb-6 md:pb-0 lg:pr-6">
            <Logo variant="dark" size="md" showTagline={false} placement="footer" />
            <p className="mt-4 text-[14px] leading-relaxed text-[#9AA1AB] max-w-sm">
              India&apos;s online store for genuine medical and dental equipment, consumables and rentals —
              with GST invoices and pan-India delivery.
            </p>

            <ul className="mt-6 space-y-3 text-[14px]">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-[#8B929C] shrink-0" />
                <span>
                  <a href={store.supportPhoneHref} className="text-white hover:underline underline-offset-4">
                    {store.supportPhone}
                  </a>
                  {store.salesPhone && (
                    <>
                      <span className="text-[#5A616B] mx-2">/</span>
                      <a href={store.salesPhoneHref} className="hover:text-white hover:underline underline-offset-4">
                        {store.salesPhone}
                      </a>
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-[#8B929C] shrink-0" />
                <span className="flex flex-col gap-1">
                  <a href={mailto(store.supportEmail)} className="hover:text-white hover:underline underline-offset-4">
                    {store.supportEmail}
                  </a>
                  {store.salesEmail !== store.supportEmail && (
                    <a href={mailto(store.salesEmail)} className="hover:text-white hover:underline underline-offset-4">
                      {store.salesEmail}
                    </a>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-[#8B929C] shrink-0" />
                <span>{formatSupportHours(store.supportHours)}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[#8B929C] shrink-0" />
                {store.mapUrl ? (
                  <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="leading-relaxed whitespace-pre-line hover:text-white">
                    {store.address}
                  </a>
                ) : (
                  <span className="leading-relaxed whitespace-pre-line">{store.address}</span>
                )}
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-[#2A2E35]">
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white text-xs font-bold font-heading transition-all shadow-md active:scale-95"
              >
                <Store className="w-4 h-4 text-[#93C5FD]" />
                <span>Sell on Buy Denmed</span>
              </Link>
            </div>
          </div>

          {columns.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      {/* ── Popular categories index ───────────────────────────── */}
      <div className="border-t border-[#2A2E35]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white mb-4">
            Popular Categories
          </h3>
          <div className="space-y-2.5 text-[13px] leading-relaxed">
            {categories.map((cat) => (
              <p key={cat.id}>
                <Link href={`/category/${cat.slug}`} className="font-semibold text-[#D5D9DF] hover:text-white">
                  {cat.name}:
                </Link>{' '}
                {cat.subCategories.map((sub, i) => (
                  <React.Fragment key={sub.id}>
                    <Link
                      href={`/category/${cat.slug}?sub=${sub.slug}`}
                      className="text-[#8B929C] hover:text-white transition-colors"
                    >
                      {sub.name}
                    </Link>
                    {i < cat.subCategories.length - 1 && <span className="text-[#4A5059] mx-1.5">|</span>}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payments + assurances ──────────────────────────────── */}
      <div className="border-t border-[#2A2E35]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[#8B929C] mr-2">We accept</span>
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <span
                  key={m.name}
                  title={m.name}
                  className={`h-7 ${m.width} bg-white rounded px-1.5 flex items-center justify-center gap-1.5 shrink-0`}
                >
                  {m.logo ? (
                    <span className="relative w-full h-[16px]">
                      <Image src={m.logo} alt={m.name} fill unoptimized className="object-contain" />
                    </span>
                  ) : (
                    <>
                      {Icon && <Icon className="w-3.5 h-3.5 text-[#1F3A68]" aria-hidden="true" />}
                      <span className="text-[11px] font-semibold text-[#1F2937] whitespace-nowrap">{m.name}</span>
                    </>
                  )}
                </span>
              );
            })}
          </div>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#8B929C]">
            <li>100% genuine products</li>
            <li>GST invoice on every order</li>
            <li>Secure payments</li>
          </ul>
        </div>
      </div>

      {/* ── Legal bar ──────────────────────────────────────────── */}
      <div className="bg-[#111315] border-t border-[#2A2E35]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[13px] text-[#8B929C]">
          <p>
            © {year} {store.storeName}. All rights reserved.
            {store.gstin && <span className="ml-2 text-[#5A616B]">GSTIN {store.gstin}</span>}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/policies/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/policies/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/policies/shipping" className="hover:text-white transition-colors">
              Shipping
            </Link>
            <Link href="/policies/returns" className="hover:text-white transition-colors">
              Returns
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
