'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Star, 
  ShieldCheck, 
  ChevronDown, 
  Filter, 
  X, 
  Edit3, 
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { Review } from '@/types';
import WriteReviewModal from '@/components/product/WriteReviewModal';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  initialReviews: Review[];
  rating: number;
  reviewsCount: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  initialReviews,
  rating: initialRating,
  reviewsCount: initialCount
}) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeImageLightbox, setActiveImageLightbox] = useState<string | null>(null);

  // Compute 5-to-1 star distribution
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 1, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });

    const total = reviews.length || 1;
    return {
      5: { count: counts[5], pct: Math.round((counts[5] / total) * 100) },
      4: { count: counts[4], pct: Math.round((counts[4] / total) * 100) },
      3: { count: counts[3], pct: Math.round((counts[3] / total) * 100) },
      2: { count: counts[2], pct: Math.round((counts[2] / total) * 100) },
      1: { count: counts[1], pct: Math.round((counts[1] / total) * 100) },
      totalCount: reviews.length
    };
  }, [reviews]);

  // Filter & Sort
  const processedReviews = useMemo(() => {
    let list = [...reviews];

    if (starFilter !== null) {
      list = list.filter((r) => Math.round(r.rating) === starFilter);
    }

    switch (sortBy) {
      case 'highest':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        list.sort((a, b) => a.rating - b.rating);
        break;
      case 'recent':
      default:
        list.sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
        break;
    }

    return list;
  }, [reviews, starFilter, sortBy]);

  const displayedReviews = processedReviews.slice(0, visibleCount);

  return (
    <div id="reviews-section" className="space-y-8 scroll-mt-28">
      {/* ========================================================
          RATING SUMMARY CARD & "WRITE A REVIEW" CTA
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: Big Average Rating & Stars (4 cols) */}
          <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-[#DCE6F2] pb-6 md:pb-0 md:pr-6">
            <div className="text-4xl sm:text-5xl font-extrabold font-heading text-[#12263F] tracking-tight">
              {initialRating.toFixed(1)}
              <span className="text-base text-[#5B6B82] font-normal"> / 5.0</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2 text-[#F5B841]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(initialRating) ? 'fill-[#F5B841] text-[#F5B841]' : 'text-[#DCE6F2]'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#5B6B82] font-body">
              Based on <strong className="text-[#12263F]">{reviews.length || initialCount} verified customer ratings</strong>
            </p>
          </div>

          {/* Center: 5-to-1 Star Progress Bars (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const data = distribution[star];
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarFilter((prev) => (prev === star ? null : star))}
                  className={`w-full flex items-center gap-3 text-xs group text-left py-0.5 rounded px-1 transition-colors ${
                    starFilter === star ? 'bg-[#EAF2FC] text-[#174E90] font-bold' : 'hover:bg-[#F6F9FD]'
                  }`}
                >
                  <span className="w-12 shrink-0 font-heading text-[#12263F] flex items-center gap-1">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-[#F5B841] text-[#F5B841]" />
                  </span>

                  <div className="flex-1 h-2 rounded-full bg-[#EAF2FC] overflow-hidden relative">
                    <div
                      className="h-full bg-[#1D5FAF] rounded-full transition-all duration-500"
                      style={{ width: `${data.pct}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-[12px] font-mono text-[#5B6B82] group-hover:text-[#12263F]">
                    {data.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Write a Review CTA (3 cols) */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center text-center md:text-right space-y-2 border-t md:border-t-0 border-[#DCE6F2] pt-6 md:pt-0">
            <span className="text-xs font-semibold font-heading text-[#5B6B82]">
              Have you used this product?
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold font-heading text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
            <span className="text-[11px] text-[#5B6B82] font-body">
              Verified OTP authentication required
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          FILTER & SORT BAR
          ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-[#DCE6F2]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold font-heading text-[#12263F]">Filter by Stars:</span>
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold transition-colors cursor-pointer ${
              starFilter === null ? 'bg-[#0B2545] text-white' : 'bg-[#F6F9FD] text-[#12263F] border border-[#DCE6F2] hover:bg-[#EAF2FC]'
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStarFilter((prev) => (prev === s ? null : s))}
              className={`px-2.5 py-1 rounded-full text-xs font-heading font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                starFilter === s ? 'bg-[#1D5FAF] text-white' : 'bg-[#F6F9FD] text-[#12263F] border border-[#DCE6F2] hover:bg-[#EAF2FC]'
              }`}
            >
              <span>{s}★</span>
              <span className="text-[11px] opacity-75">({distribution[s as 1|2|3|4|5].count})</span>
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0 text-xs font-body">
          <span className="text-[#5B6B82] font-heading">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-[#DCE6F2] bg-white font-heading text-xs font-semibold text-[#12263F] focus:outline-none focus:border-[#1D5FAF]"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          REVIEWS LIST / EMPTY STATE
          ======================================================== */}
      {processedReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCE6F2] p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-[#EAF2FC] text-[#174E90] rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-bold text-base text-[#12263F]">
            No reviews yet
          </h4>
          <p className="text-xs text-[#5B6B82] font-body max-w-sm mx-auto">
            Be the first verified customer to share clinical feedback or performance notes on this product.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold font-heading text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Write First Review
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-6 shadow-xs space-y-3 transition-colors hover:border-[#1D5FAF]/50"
            >
              {/* Header: Name, Stars, Verified Badge, Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EAF2FC] text-[#174E90] font-heading font-bold text-xs flex items-center justify-center shrink-0">
                    {(rev.name || rev.authorName || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-[#12263F]">
                        {rev.name || rev.authorName}
                      </h4>
                      {(rev.isVerifiedBuyer || rev.verifiedBuyer) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-full font-heading font-semibold border border-green-200/50">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </div>
                    {(rev.clinicName || rev.city) && (
                      <div className="text-[12px] text-[#5B6B82] font-body">
                        {rev.clinicName && <span>{rev.clinicName} • </span>}
                        {rev.city}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-0.5 text-[#F5B841]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(rev.rating) ? 'fill-[#F5B841] text-[#F5B841]' : 'text-[#DCE6F2]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[#5B6B82] text-[12px] font-body">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN') : rev.date}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              {rev.title && (
                <h5 className="font-heading font-semibold text-xs sm:text-sm text-[#12263F] leading-snug">
                  {rev.title}
                </h5>
              )}

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed">
                {rev.comment}
              </p>

              {/* Review Images Thumbnails (Click opens lightbox) */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {rev.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageLightbox(img)}
                      className="relative w-16 h-16 rounded-xl border border-[#DCE6F2] overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={img}
                        alt={`Review photo ${idx + 1}`}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          {visibleCount < processedReviews.length && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="px-6 py-2.5 rounded-xl border border-[#1D5FAF] hover:bg-[#EAF2FC] bg-white text-[#1D5FAF] font-heading font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Load More Reviews ({processedReviews.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={productId}
        productName={productName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Toast or refresh
        }}
      />

      {/* Simple Review Image Lightbox */}
      {activeImageLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveImageLightbox(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full h-[500px]">
            <Image
              src={activeImageLightbox}
              alt="Review full size"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setActiveImageLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsSection;
