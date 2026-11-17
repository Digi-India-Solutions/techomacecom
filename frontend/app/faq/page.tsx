'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ShieldCheck, Truck, CreditCard, Bed } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Orders & Authenticity',
    q: 'How do I know the products on Buy Denmed are 100% genuine?',
    a: 'Buy Denmed is an authorized distribution partner for global brands including Philips Respironics, ResMed, 3M ESPE, Dentsply Sirona, Omron, W&H, and Woodpecker. Every product arrives in tamper-evident manufacturer packaging with verifiable batch codes and holographic seals.'
  },
  {
    category: 'Orders & Authenticity',
    q: 'Can I claim Input Tax Credit (ITC) with my clinic GSTIN?',
    a: 'Yes! During checkout, simply select "Add GST details for business invoice" and enter your 15-digit GSTIN. An official B2B tax invoice will be generated automatically, downloadable immediately from your Doctor Account.'
  },
  {
    category: 'Shipping & Delivery',
    q: 'What are the delivery timelines across India?',
    a: 'Delhi NCR and major metro locations typically receive deliveries within 24-48 hours. Tier 2 and Tier 3 cities are serviced within 2-4 business days via BlueDart Air Cargo and Delhivery. Fragile items like dental chairs and autoclaves are shipped in reinforced wooden crates.'
  },
  {
    category: 'Shipping & Delivery',
    q: 'Is Cash on Delivery (COD) supported?',
    a: 'Yes, COD is available for orders up to ₹25,000 in serviceable pincodes across India. For higher value capital equipment (dental chairs, autoclaves), secure digital payment via Razorpay (UPI, Cards, NetBanking, EMI) or bank RTGS transfer is accepted.'
  },
  {
    category: 'Equipment Rentals',
    q: 'How does the Medical Equipment Rental program work?',
    a: 'We provide monthly rentals on 5L/10L oxygen concentrators, CPAP/BiPAP units, and motorized ICU beds. A refundable security deposit is collected, and our certified technician sets up the device at your clinic or residence with zero maintenance charges. You can return the equipment or convert to ownership anytime.'
  },
  {
    category: 'Sleep Diagnostics',
    q: 'What is included in the Level 3 Home Sleep Test?',
    a: 'Our technician brings a sanitized 7-channel diagnostic device to your residence, fits the sensors, and picks up the device the following morning. A senior Pulmonologist analyzes your respiratory channels, AHI, and desaturation index, followed by a 15-minute tele-consultation.'
  },
  {
    category: 'Warranties & AMC',
    q: 'How do warranty claims and repairs work?',
    a: 'All equipment is backed by comprehensive manufacturer warranties ranging from 1 to 3 years. Buy Denmed also coordinates certified on-site service engineers for major equipment. In case of issues, contact our support desk at +91 98112 34567.'
  }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Orders & Authenticity', 'Shipping & Delivery', 'Equipment Rentals', 'Sleep Diagnostics', 'Warranties & AMC'];

  const filteredFaqs = selectedCat === 'All'
    ? FAQS
    : FAQS.filter((f) => f.category === selectedCat);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
          Got Questions? We Have Answers.
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#12263F] tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6B82]">
          Everything doctors and healthcare procurement teams need to know about purchasing, rentals, warranties, and GST invoicing.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCat(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCat === c
                ? 'bg-[#1D5FAF] text-white shadow-xs'
                : 'bg-white border border-[#DCE6F2] text-[#12263F] hover:border-[#1D5FAF] hover:text-[#1D5FAF]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-[#12263F] hover:text-[#1D5FAF] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#5B6B82] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-[#1D5FAF]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-[#5B6B82] leading-relaxed border-t border-[#DCE6F2]">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still need help box */}
      <div className="p-8 bg-[#EAF2FC]/60 rounded-3xl border border-[#DCE6F2] text-center space-y-3">
        <h3 className="font-bold text-sm text-[#12263F]">Still have questions regarding equipment selection?</h3>
        <p className="text-xs text-[#5B6B82] max-w-md mx-auto">
          Our biomedical engineers provide free technical consultation to doctors setting up clinics or replacing legacy equipment.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold rounded-xl"
          >
            Contact Support Desk
          </Link>
          <a
            href="tel:+919811234567"
            className="px-5 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white text-xs font-bold rounded-xl"
          >
            Call: +91 98112 34567
          </a>
        </div>
      </div>
    </div>
  );
}
