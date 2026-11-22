'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck } from 'lucide-react';
import CardCarousel, { TESTIMONIAL_SLIDE } from '@/components/common/CardCarousel';
import type { Review } from '@/types';

interface TestimonialsSectionProps {
  title?: string;
  /** Approved reviews marked "Feature on home page" in Admin → Reviews (GET /reviews/featured). */
  reviews?: Review[];
}

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

/** Home-page testimonials. Hidden until the store features at least one approved review. */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  title = 'What Doctors & Patients Say',
  reviews = [],
}) => {
  if (!reviews.length) return null;

  return (
    <section className="my-10 sm:my-14">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#12263F] font-heading relative inline-block">
              {title || 'What Doctors & Patients Say'}
              <span className="absolute bottom-[-4px] left-0 w-10 h-[3px] bg-[#1D5FAF] rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B82] font-body mt-2">
              Real reviews from doctors, clinics and home caregivers who bought from us
            </p>
          </div>
        </div>

        <CardCarousel ariaLabel="Customer testimonials" itemClassName={TESTIMONIAL_SLIDE} rows={1}>
          {reviews.slice(0, 12).map((review) => (
            <div
              key={review.id}
              className="h-full bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-1 text-[#F5B841]" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-4.5 h-4.5 ${i <= review.rating ? 'fill-current' : 'text-[#DCE6F2]'}`} />
                    ))}
                  </div>
                  {(review.isVerifiedBuyer || review.verifiedBuyer) && (
                    <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200/60 font-heading">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Verified Buyer</span>
                    </div>
                  )}
                </div>

                {review.title && (
                  <h4 className="font-heading font-bold text-sm sm:text-base text-[#12263F] mb-2 leading-snug line-clamp-2">
                    &ldquo;{review.title}&rdquo;
                  </h4>
                )}
                <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed italic line-clamp-4" title={review.comment}>
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#DCE6F2] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-heading font-bold text-xs sm:text-sm text-[#12263F] truncate">
                    {review.authorName || review.name}
                  </div>
                  {review.productName && (
                    <div className="text-xs text-[#5B6B82] font-body truncate">
                      on{' '}
                      {review.productSlug ? (
                        <Link href={`/product/${review.productSlug}`} className="font-semibold text-[#1D5FAF] hover:underline">
                          {review.productName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[#12263F]">{review.productName}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-[#5B6B82] font-body shrink-0">{formatDate(review.createdAt || review.date)}</div>
              </div>
            </div>
          ))}
        </CardCarousel>
      </div>
    </section>
  );
};

export default TestimonialsSection;
