'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShieldCheck, ArrowRight } from 'lucide-react';

interface Slide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: 'slide-1',
    badge: 'Pan-India Medical Equipment',
    title: 'Precision Medical &',
    highlight: 'Hospital Care Equipment',
    subtitle: 'Equip your facility with certified oxygen concentrators, CPAP/BiPAP units, multipara monitors and ICU beds at verified B2B GST prices.',
    ctaText: 'Shop Medical Equipment',
    ctaLink: '/category/respiratory-care',
    secondaryCtaText: 'Request Bulk Quote',
    secondaryCtaLink: '/bulk-enquiry',
    image: '/images/hero_medical_sale_1793803411713.jpg'
  },
  {
    id: 'slide-2',
    badge: 'Clinic Setup Solutions',
    title: 'Advanced Dental Handpieces &',
    highlight: 'Operatory Clinic Units',
    subtitle: 'NSK & Waldent high-speed turbines, European Class B vacuum autoclaves, and microprocessor patient chairs with genuine manufacturer warranties.',
    ctaText: 'Explore Dental Catalog',
    ctaLink: '/category/dental-handpieces-motors',
    secondaryCtaText: 'New Clinic Setup',
    secondaryCtaLink: '/category/dental-chairs-units',
    image: '/images/hero_dental_setup_1793803412433.jpg'
  },
  {
    id: 'slide-3',
    badge: 'Pan-India Rental Program',
    title: 'Hospital-Grade Equipment On Rent',
    highlight: 'From ₹2,500/Month',
    subtitle: 'Zero CapEx post-surgery recovery. Rent Philips 5L/10L oxygen concentrators, ResMed CPAP/BiPAP, and motorized beds with free doorstep installation.',
    ctaText: 'Browse Rental Equipment',
    ctaLink: '/rent',
    secondaryCtaText: 'Sleep Study at Home',
    secondaryCtaLink: '/sleep-test',
    image: '/images/rental_composed_banner_1793803411001.jpg'
  }
];

export const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className="relative w-full bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-100 text-slate-900 overflow-hidden select-none border-b border-slate-200">
      <div className="relative min-h-[440px] sm:min-h-[500px] flex items-center transition-all duration-700">
        {/* Soft Ambient Light Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Text Content */}
          <div className="max-w-2xl space-y-4 text-center md:text-left z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4F3] border border-teal-200 text-[#0F766E] text-xs font-bold font-heading tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{slide.badge}</span>
            </div>

            {/* Headline in Poppins */}
            <h1 className="text-3xl sm:text-5xl font-bold font-heading text-slate-900 tracking-tight leading-tight">
              {slide.title} <br className="hidden sm:inline" />
              <span className="text-[#0F766E]">{slide.highlight}</span>
            </h1>

            {/* Subheading in Inter */}
            <p className="text-sm sm:text-base text-slate-600 font-body font-normal leading-relaxed max-w-xl">
              {slide.subtitle}
            </p>

            {/* CTA Buttons in Poppins */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
              <Link
                href={slide.ctaLink}
                className="px-6 py-3.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold font-heading text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {slide.secondaryCtaText && slide.secondaryCtaLink && (
                <Link
                  href={slide.secondaryCtaLink}
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold font-heading text-sm rounded-xl transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                >
                  {slide.secondaryCtaText}
                </Link>
              )}
            </div>
          </div>

          {/* Right Floating Product Visual Showcase */}
          <div className="w-full max-w-sm sm:max-w-md hidden md:block z-10">
            <div className="relative aspect-4/3 rounded-2xl bg-white p-3 shadow-xl border border-slate-200 overflow-hidden group">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-50">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                  priority
                  sizes="(max-width: 1024px) 380px, 450px"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Floating Stat card */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-body">Pan-India Transit</div>
                  <div className="font-bold text-slate-900 font-heading">Direct Express Cargo</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#0F766E] font-bold font-body">GST 100% Eligible</div>
                  <div className="text-slate-900 font-bold font-heading">Official Tax Invoice</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#0F766E] flex items-center justify-center shadow-md transition-colors border border-slate-200 z-20 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#0F766E] flex items-center justify-center shadow-md transition-colors border border-slate-200 z-20 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                current === idx ? 'w-8 bg-[#0F766E]' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
