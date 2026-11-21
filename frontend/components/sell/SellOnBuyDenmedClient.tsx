'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Headphones,
  HelpCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users2,
  Zap,
} from 'lucide-react';
import SellerRegistrationForm from './SellerRegistrationForm';

const BENEFITS = [
  {
    icon: Users2,
    title: '50,000+ Verified Dental Professionals',
    desc: 'Instantly connect with private dental clinics, dental colleges, hospitals, and oral surgeons across India searching for genuine equipment and daily consumables.',
    badge: 'Pan-India Reach',
  },
  {
    icon: CreditCard,
    title: 'Fast & Transparent Settlements',
    desc: 'Receive direct bank payouts via NEFT/RTGS with automated GST input credit invoices and zero hidden deductions. Payouts processed every week.',
    badge: 'Reliable Cashflow',
  },
  {
    icon: Truck,
    title: 'Doorstep Logistics & Reverse Pickups',
    desc: 'Our logistics partners pick up packaged orders directly from your warehouse or store. Full transit insurance and real-time shipment tracking included.',
    badge: 'Fulfillment Support',
  },
  {
    icon: Headphones,
    title: 'Dedicated Vendor Account Manager',
    desc: 'Get personal guidance for catalog creation, bulk product uploads, pricing strategies, and promotional campaign participation.',
    badge: 'Personalized Support',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Upfront Registration Fee',
    desc: 'Start listing your products completely free. We charge a nominal marketplace fee only when a product is successfully sold and delivered.',
    badge: '100% Risk Free',
  },
  {
    icon: PackageCheck,
    title: 'Integrated B2B & Bulk Enquiry Network',
    desc: 'Receive high-value RFQs and institutional purchase orders from clinics setting up new operatory centers and dental chains.',
    badge: 'High Value Orders',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Register Your Company',
    desc: 'Submit legal company details, GSTIN, and authorized dental brand dealership information in our online form.',
  },
  {
    step: '02',
    title: '24–48 Hr Verification',
    desc: 'Our vendor compliance team verifies your tax credentials and approves your verified seller partner badge.',
  },
  {
    step: '03',
    title: 'List Your Products',
    desc: 'Upload dental equipment, consumables, and instruments with our easy Excel template or guided listing tool.',
  },
  {
    step: '04',
    title: 'Receive Orders & Get Paid',
    desc: 'Ship orders directly to dental clinics nationwide with automated courier pickup and guaranteed timely bank payouts.',
  },
];

const FAQS = [
  {
    q: 'What documents are required to register as a seller on Buy Denmed?',
    a: 'You will need: (1) Active 15-digit GSTIN Certificate, (2) Company PAN Card, (3) Cancelled Cheque / Bank Account Proof for settlements, and (4) Brand Authorization or Dealership Letter (if you are an authorized importer, distributor, or dealer).',
  },
  {
    q: 'Are there any upfront registration or monthly maintenance fees?',
    a: 'No. Registering on Buy Denmed is 100% free with zero upfront onboarding or monthly listing fees. We work on a transparent commission model where a small platform fee is deducted only when your product sells.',
  },
  {
    q: 'How does shipping and logistics work for dental equipment?',
    a: 'Buy Denmed partners with top medical couriers (such as Blue Dart, Delhivery, and specialized surface logistics for heavy dental chairs and autoclaves). Once an order is received, our courier partner arrives at your warehouse for doorstep pickup.',
  },
  {
    q: 'How and when do I receive payouts for completed orders?',
    a: 'Payouts are transferred directly to your verified business bank account via NEFT/RTGS on a weekly settlement cycle, along with detailed tax invoices and deduction reports in your seller portal.',
  },
  {
    q: 'Can I sell imported international dental brands on Buy Denmed?',
    a: 'Yes! We actively welcome authorized importers and distributors of leading global brands from Germany, Japan, USA, South Korea, Switzerland, and Italy with genuine manufacturer warranty support.',
  },
];

export const SellOnBuyDenmedClient: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-[#F6F9FD] text-[#12263F] min-h-screen">
      {/* ── Breadcrumb ── */}
      <nav className="bg-white border-b border-[#DCE6F2] py-2 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto text-xs text-[#5B6B82] flex items-center gap-2">
          <Link href="/" className="hover:text-[#1D5FAF] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#12263F] font-semibold">Sell on Buy Denmed</span>
        </div>
      </nav>

      {/* ── 1. COMPACT HERO BANNER (Matching Dentalkart Structure & Buy Denmed Brand UI) ── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-4">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#EBF3FB] via-[#F3F8FD] to-[#E5F0FA] border border-[#D0E2F4] p-5 sm:p-8 lg:p-9 shadow-xs overflow-hidden">
          {/* Subtle light background accents */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#1D5FAF]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 right-10 w-64 h-64 bg-[#93C5FD]/15 rounded-full blur-xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative">
            {/* Left Content (Matching Dentalkart structure & Buy Denmed design language) */}
            <div className="lg:col-span-7 space-y-2.5">
              <p className="text-xs sm:text-sm font-semibold text-[#5B6B82] font-heading">
                Ready to sell your dental products today?
              </p>

              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0B2545] font-heading tracking-tight leading-tight">
                Become a seller partner
              </h1>

              <div className="space-y-1">
                <p className="text-sm sm:text-base font-bold text-[#1D5FAF] font-heading">
                  Expand your business today with Buy Denmed!
                </p>
                <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed max-w-xl">
                  List your products on Buy Denmed and reach thousands of dentists across India effortlessly!
                </p>
              </div>

              {/* Action Button & mini trust tags */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="px-7 py-3 rounded-xl bg-[#F28C38] hover:bg-[#E07A28] text-white font-bold font-heading text-xs sm:text-sm shadow-md shadow-[#F28C38]/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="tel:+919811234567"
                  className="px-5 py-3 rounded-xl bg-white border border-[#DCE6F2] hover:bg-[#EAF2FC] text-[#0B2545] font-bold font-heading text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1D5FAF]" />
                  <span>+91 98112 34567</span>
                </a>
              </div>

              {/* 3 Inline micro-pills */}
              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-semibold text-[#5B6B82] font-heading">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Zero listing fee
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Pan-India pickups
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Weekly bank payouts
                </span>
              </div>
            </div>

            {/* Right Graphic: Sleek Partnership Card matching Buy Denmed UI */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-2xl bg-white border border-[#D5E3F0] p-5 sm:p-6 shadow-sm space-y-4">
                {/* Visual Jigsaw / Partnership illustration */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center font-bold font-heading">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D5FAF] font-heading block">
                        PARTNERSHIP
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#0B2545] font-heading block">
                        Buy Denmed Seller Network
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>

                {/* 2 Clean Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <span className="text-xl sm:text-2xl font-black font-heading text-[#0B2545] block">
                      50,000+
                    </span>
                    <span className="text-[10px] text-[#5B6B82] font-heading font-semibold uppercase tracking-wider mt-0.5 block">
                      Dentists &amp; Clinics
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <span className="text-xl sm:text-2xl font-black font-heading text-[#1D5FAF] block">
                      20,000+
                    </span>
                    <span className="text-[10px] text-[#5B6B82] font-heading font-semibold uppercase tracking-wider mt-0.5 block">
                      Pin Codes Served
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F0F6FC] border border-[#D5E3F0] text-[11px] text-[#0B2545] font-body leading-relaxed flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>
                    <strong className="font-heading">GST Invoices &amp; Tax Compliant:</strong> Full B2B input tax credit for buyers.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. "WHY REGISTER WITH BUY DENMED" (Benefits Grid matching Dentalkart) ── */}
      <section className="py-10 sm:py-14 bg-white border-y border-[#DCE6F2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#12263F]">
              Why Register With Buy Denmed
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body">
              Empowering dental manufacturers, importers, and distributors with technology, reach, and trust
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl p-5 sm:p-6 bg-[#F6F9FD] border border-[#DCE6F2] hover:bg-white hover:shadow-lg hover:border-[#1D5FAF]/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#DCE6F2] text-[#1D5FAF] group-hover:bg-[#1D5FAF] group-hover:text-white transition-colors flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold font-heading uppercase tracking-wider text-[#5B6B82] bg-white border border-[#DCE6F2] px-2.5 py-0.5 rounded-full">
                        {b.badge}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold font-heading text-[#12263F] group-hover:text-[#1D5FAF] transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs text-[#5B6B82] font-body leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. "HOW IT WORKS" (4 Simple Steps) ── */}
      <section className="py-10 sm:py-14 bg-[#F6F9FD] border-b border-[#DCE6F2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#12263F]">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body">
              Simple 4-step onboarding journey to start selling dental supplies across India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="bg-white rounded-2xl p-5 border border-[#DCE6F2] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-[#93C5FD] font-heading font-black text-sm flex items-center justify-center">
                    {s.step}
                  </div>
                  <h3 className="text-sm font-bold font-heading text-[#12263F]">{s.title}</h3>
                  <p className="text-xs text-[#5B6B82] font-body leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. SELLER REGISTRATION FORM SECTION (Full container width matching Dentalkart Reference) ── */}
      <section id="seller-registration-form" ref={formRef} className="py-8 sm:py-14 bg-white border-b border-[#DCE6F2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <SellerRegistrationForm />
        </div>
      </section>

      {/* ── 5. FAQS FOR SELLERS ── */}
      <section className="py-10 sm:py-14 bg-[#F6F9FD] border-b border-[#DCE6F2]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#12263F]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-[#5B6B82] font-body">Everything you need to know about seller onboarding</p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen ? 'border-[#1D5FAF] bg-white shadow-sm' : 'border-[#DCE6F2] bg-white hover:border-[#1D5FAF]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-3.5 px-5 text-left flex items-center justify-between gap-4 font-bold font-heading text-xs sm:text-sm text-[#12263F] focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#EAF2FC] flex items-center justify-center text-[#174E90]">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[#5B6B82] font-body leading-relaxed border-t border-[#DCE6F2]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. FINAL REPEAT CTA BAND ── */}
      <section className="py-10 sm:py-12 bg-[#0B2545] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Ready to grow your dental business nationwide?
            </h3>
            <p className="text-xs text-[#EAF2FC]/80 font-body">
              Join India&apos;s premier dental equipment and healthcare supply network today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={scrollToForm}
              className="px-6 py-3 rounded-xl bg-[#F28C38] hover:bg-[#E07A28] text-white font-bold font-heading text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Register as Seller Partner
            </button>
            <a
              href="tel:+919811234567"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold font-heading text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-[#93C5FD]" />
              <span>+91 98112 34567</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SellOnBuyDenmedClient;
