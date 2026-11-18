'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';

const steps = [
  {
    no: '01',
    title: 'Book a slot',
    text: 'Pick an evening that suits you.'
  },
  {
    no: '02',
    title: 'Sleep at home',
    text: 'Our technician fits the sensors at bedtime.'
  },
  {
    no: '03',
    title: 'Get your report',
    text: 'Read by a pulmonologist in 24–48 hrs.'
  }
];

export const SleepTestPromo: React.FC = () => {
  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="group/card grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] rounded-2xl overflow-hidden bg-gradient-to-br from-white via-[#F6F9FD] to-[#EAF2FC] border border-[#DCE6F2] shadow-xs">
          {/* Photo — runs edge to edge, no frame */}
          <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-full overflow-hidden">
            <Image
              src="/images/patient_sleeping_peaceful_1793803357708.jpg"
              alt="Woman sleeping at home during an overnight sleep study"
              fill
              className="object-cover object-[35%_center] transition-transform duration-[1200ms] ease-out group-hover/card:scale-[1.04]"
              sizes="(max-width: 1024px) 100vw, 540px"
              referrerPolicy="no-referrer"
            />
            {/* Small, quiet label — like a sticker on a print */}
            <div className="absolute left-4 bottom-4 sm:left-5 sm:bottom-5 bg-white text-[#12263F] rounded-lg px-3 py-2 shadow-sm border border-[#DCE6F2] font-heading -rotate-2 transition-transform duration-300 group-hover/card:rotate-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#1D5FAF] font-semibold">
                Level 2 &amp; 3 HSAT
              </p>
              <p className="text-sm font-semibold leading-tight">Reports in 24–48 hrs</p>
            </div>
          </div>

          {/* Copy */}
          <div className="px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D5FAF] font-heading">
              Home sleep test
            </p>

            <h2 className="mt-3 text-[28px] sm:text-4xl lg:text-[42px] font-bold font-heading text-[#12263F] leading-[1.15] tracking-tight max-w-[18ch]">
              Still tired after a{' '}
              <span className="relative inline-block whitespace-nowrap">
                full night&apos;s
                {/* hand-drawn underline */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 14"
                  preserveAspectRatio="none"
                  className="absolute left-0 -bottom-1.5 w-full h-3 text-[#1D5FAF]"
                >
                  <path
                    d="M3 9.5C42 4.5 96 3 140 5.2c28 1.4 53 3.3 77 1.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              sleep?
            </h2>

            <p className="mt-5 text-sm sm:text-base text-[#5B6B82] leading-relaxed font-body max-w-[52ch]">
              Loud snoring and daytime tiredness are common signs of sleep apnea. You don&apos;t need
              to spend a night in hospital to find out — we can run the test in your own bed.
            </p>

            {/* How it works */}
            <ol className="mt-8 grid grid-cols-1 sm:grid-cols-3 border-t border-[#DCE6F2]">
              {steps.map((step) => (
                <li
                  key={step.no}
                  className="group/step pt-4 pb-1 sm:pr-5 border-b sm:border-b-0 border-[#DCE6F2] last:border-b-0"
                >
                  <span className="block text-xs font-semibold text-[#1D5FAF] tabular-nums transition-transform duration-200 group-hover/step:-translate-y-0.5">
                    {step.no}
                  </span>
                  <span className="mt-1 block text-[15px] font-semibold font-heading text-[#12263F]">
                    {step.title}
                  </span>
                  <span className="mt-0.5 mb-3 sm:mb-0 block text-[13px] text-[#5B6B82] font-body leading-snug">
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>

            {/* Actions */}
            <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <Link
                href="/sleep-test"
                className="group/btn inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B2545] hover:bg-[#1D5FAF] text-white text-sm font-bold font-heading shadow-xs px-6 py-3.5 transition-colors duration-300"
              >
                Book a home sleep test
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>

              <a
                href="tel:+919811234567"
                className="group/call inline-flex items-center gap-2 text-sm text-[#5B6B82] hover:text-[#12263F] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#1D5FAF]" />
                <span>
                  Questions? Call{' '}
                  <span className="font-semibold text-[#12263F] underline decoration-[#DCE6F2] decoration-2 underline-offset-4 group-hover/call:decoration-[#1D5FAF] transition-colors">
                    +91 98112 34567
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SleepTestPromo;
