'use client';

import React, { useRef } from 'react';
import { Star, ShieldCheck, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { MOCK_REVIEWS } from '@/lib/mock/data';

export const TestimonialsSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-8 sm:my-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-heading mb-1 inline-block">
              Doctor &amp; Patient Trust
            </span>
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 font-heading relative inline-block">
              What Doctors &amp; Patients Say
              <span className="absolute bottom-[-4px] left-0 w-8 h-[3px] bg-[#FF6B00] rounded-full" />
            </h2>
            <p className="text-xs text-gray-500 font-body mt-1.5">
              Verified clinical feedback from healthcare directors, pulmonologists, and home caregivers
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center shadow-xs transition-colors"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Testimonials Slider */}
        <div
          ref={scrollRef}
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scroll-smooth no-scrollbar"
        >
          {MOCK_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="shrink-0 w-[85%] sm:w-auto bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#16A34A] font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200/60 font-heading">
                    <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
                    <span>Verified Buyer</span>
                  </div>
                </div>

                <h4 className="font-heading font-semibold text-sm text-gray-900 mb-2 leading-snug">
                  &ldquo;{review.title}&rdquo;
                </h4>
                <p className="text-xs text-gray-600 font-body leading-relaxed italic">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-heading font-bold text-xs text-gray-900">
                    {review.authorName}
                  </div>
                  <div className="text-[11px] text-gray-400 font-body">
                    {review.clinicName}, <span className="font-medium text-gray-600">{review.city}</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 font-body">
                  {review.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
