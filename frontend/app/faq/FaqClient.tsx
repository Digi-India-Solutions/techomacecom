'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { FaqData } from '@/lib/api/cms';

export default function FaqClient({ initialFaqs }: { initialFaqs: FaqData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialFaqs.forEach((f) => {
      if (f.group) set.add(f.group);
    });
    return ['All', ...Array.from(set)];
  }, [initialFaqs]);

  const filteredFaqs = useMemo(() => {
    if (selectedCat === 'All') return initialFaqs;
    return initialFaqs.filter(
      (f) => f.group.toLowerCase() === selectedCat.toLowerCase()
    );
  }, [initialFaqs, selectedCat]);

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
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedCat(c);
                setOpenIndex(null);
              }}
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
      )}

      {/* Accordion */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5B6B82] bg-white rounded-2xl border border-[#DCE6F2]">
            No FAQs found in this category.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || idx}
                className="bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-[#12263F] hover:text-[#1D5FAF] transition-colors"
                >
                  <span className="flex-1">{faq.question}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#F4F7FC] text-[#5B6B82] hidden sm:inline-block">
                      {faq.group}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#5B6B82] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#1D5FAF]' : ''
                      }`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#5B6B82] leading-relaxed border-t border-[#DCE6F2]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
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

