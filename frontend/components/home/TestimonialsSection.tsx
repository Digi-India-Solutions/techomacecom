'use client';

import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import CardCarousel, { TESTIMONIAL_SLIDE } from '@/components/common/CardCarousel';
import { MOCK_REVIEWS } from '@/lib/mock/data';

export const TestimonialsSection: React.FC = () => {

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
              What Doctors &amp; Patients Say
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2">
              Verified clinical feedback from healthcare directors, pulmonologists, and home caregivers
            </p>
          </div>
        </div>

        {/* Testimonials — single-row carousel, capped so the page stays short */}
        <CardCarousel ariaLabel="Customer testimonials" itemClassName={TESTIMONIAL_SLIDE} rows={1}>
          {MOCK_REVIEWS.slice(0, 12).map((review) => (
            <div
              key={review.id}
              className="h-full bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-1 text-[#F5B841]">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4.5 h-4.5 fill-current" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200/60 font-heading">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Verified Buyer</span>
                  </div>
                </div>

                <h4 className="font-heading font-bold text-sm sm:text-base text-[#12263F] mb-2 leading-snug line-clamp-2">
                  &ldquo;{review.title}&rdquo;
                </h4>
                <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed italic line-clamp-4" title={review.comment}>
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#DCE6F2] flex items-center justify-between">
                <div>
                  <div className="font-heading font-bold text-xs sm:text-sm text-[#12263F]">
                    {review.authorName}
                  </div>
                  <div className="text-xs text-[#5B6B82] font-body">
                    {review.clinicName}, <span className="font-semibold text-[#12263F]">{review.city}</span>
                  </div>
                </div>
                <div className="text-xs text-[#5B6B82] font-body">
                  {review.date}
                </div>
              </div>
            </div>
          ))}
        </CardCarousel>
      </div>
    </section>
  );
};

export default TestimonialsSection;
