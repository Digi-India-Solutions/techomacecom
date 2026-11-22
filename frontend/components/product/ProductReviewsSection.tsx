'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, ShieldCheck, X, Edit3, MessageSquare, Loader2, Store } from 'lucide-react';
import { Review } from '@/types';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import { getProductReviewsPage, type ReviewSort, type ReviewSummary } from '@/lib/api/reviews';
import { useToastStore } from '@/lib/store';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  /** first page from the server render (shown until the live summary loads) */
  initialReviews: Review[];
  rating: number;
  reviewsCount: number;
}

const PAGE_SIZE = 10;
type SortOption = 'recent' | 'highest' | 'lowest';
const SORT_TO_API: Record<SortOption, ReviewSort> = { recent: 'newest', highest: 'highest', lowest: 'lowest' };

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Product page → Reviews tab. Approved reviews only (GET /reviews/product/:id):
 * star summary + 5→1 breakdown, star filter, sort and "load more" all run on the server.
 */
export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  initialReviews,
  rating: initialRating,
  reviewsCount: initialCount,
}) => {
  const { addToast } = useToastStore();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialReviews.length);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeImageLightbox, setActiveImageLightbox] = useState<string | null>(null);
  // "loading" is derived: the query we want vs. the query whose result is on screen
  const queryKey = `${productId}|${sortBy}|${starFilter ?? 'all'}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const loading = loadedKey !== `${queryKey}#${reloadTick}`;

  useEffect(() => {
    let cancelled = false;
    const key = `${productId}|${sortBy}|${starFilter ?? 'all'}#${reloadTick}`;
    getProductReviewsPage(productId, { page: 1, limit: PAGE_SIZE, sort: SORT_TO_API[sortBy], rating: starFilter })
      .then(({ reviews: rows, summary: s, meta }) => {
        if (cancelled) return;
        setReviews(rows);
        setSummary(s);
        setPage(1);
        setTotal(meta?.total ?? rows.length);
        setHasMore(Boolean(meta?.hasNextPage));
      })
      .catch(() => {
        // keep what is on screen (server-rendered first page); the tab still works
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, sortBy, starFilter, reloadTick]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getProductReviewsPage(productId, {
        page: next,
        limit: PAGE_SIZE,
        sort: SORT_TO_API[sortBy],
        rating: starFilter,
      });
      setReviews((prev) => [...prev, ...res.reviews.filter((r) => !prev.some((p) => p.id === r.id))]);
      setPage(next);
      setHasMore(Boolean(res.meta?.hasNextPage));
    } catch {
      addToast({ type: 'error', title: 'Could not load more reviews', message: 'Please try again.' });
    } finally {
      setLoadingMore(false);
    }
  };

  const average = summary ? summary.average : initialRating;
  const count = summary ? summary.count : initialCount;
  const breakdown = summary?.breakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const pct = (n: number) => (count ? Math.round((n / count) * 100) : 0);

  return (
    <div id="reviews-section" className="space-y-8 scroll-mt-28">
      {/* RATING SUMMARY + WRITE A REVIEW */}
      <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-[#DCE6F2] pb-6 md:pb-0 md:pr-6">
            <div className="text-4xl sm:text-5xl font-extrabold font-heading text-[#12263F] tracking-tight">
              {(average || 0).toFixed(1)}
              <span className="text-base text-[#5B6B82] font-normal"> / 5.0</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2 text-[#F5B841]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(average || 0) ? 'fill-[#F5B841] text-[#F5B841]' : 'text-[#DCE6F2]'}`}
                />
              ))}
            </div>
            <p className="text-xs text-[#5B6B82] font-body">
              Based on{' '}
              <strong className="text-[#12263F]">
                {count} customer {count === 1 ? 'rating' : 'ratings'}
              </strong>
            </p>
          </div>

          <div className="md:col-span-5 space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarFilter((prev) => (prev === star ? null : star))}
                className={`w-full flex items-center gap-3 text-xs group text-left py-0.5 rounded px-1 transition-colors ${
                  starFilter === star ? 'bg-[#EAF2FC] text-[#174E90] font-bold' : 'hover:bg-[#F6F9FD]'
                }`}
                aria-pressed={starFilter === star}
              >
                <span className="w-12 shrink-0 font-heading text-[#12263F] flex items-center gap-1">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-[#F5B841] text-[#F5B841]" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-[#EAF2FC] overflow-hidden relative">
                  <div
                    className="h-full bg-[#1D5FAF] rounded-full transition-all duration-500"
                    style={{ width: `${pct(breakdown[star])}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[12px] font-mono text-[#5B6B82] group-hover:text-[#12263F]">
                  {breakdown[star]}
                </span>
              </button>
            ))}
          </div>

          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center text-center md:text-right space-y-2 border-t md:border-t-0 border-[#DCE6F2] pt-6 md:pt-0">
            <span className="text-xs font-semibold font-heading text-[#5B6B82]">Have you used this product?</span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold font-heading text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
            <span className="text-[11px] text-[#5B6B82] font-body">Sign in required · reviewed before publishing</span>
          </div>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-[#DCE6F2]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold font-heading text-[#12263F]">Filter by Stars:</span>
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold transition-colors cursor-pointer ${
              starFilter === null
                ? 'bg-[#0B2545] text-white'
                : 'bg-[#F6F9FD] text-[#12263F] border border-[#DCE6F2] hover:bg-[#EAF2FC]'
            }`}
          >
            All ({count})
          </button>
          {([5, 4, 3, 2, 1] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStarFilter((prev) => (prev === s ? null : s))}
              className={`px-2.5 py-1 rounded-full text-xs font-heading font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                starFilter === s
                  ? 'bg-[#1D5FAF] text-white'
                  : 'bg-[#F6F9FD] text-[#12263F] border border-[#DCE6F2] hover:bg-[#EAF2FC]'
              }`}
            >
              <span>{s}★</span>
              <span className="text-[11px] opacity-75">({breakdown[s]})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs font-body">
          <span className="text-[#5B6B82] font-heading">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-lg border border-[#DCE6F2] bg-white font-heading text-xs font-semibold text-[#12263F] focus:outline-none focus:border-[#1D5FAF]"
            aria-label="Sort reviews"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* LIST / EMPTY STATE */}
      {loading && reviews.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#5B6B82] font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCE6F2] p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-[#EAF2FC] text-[#174E90] rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-bold text-base text-[#12263F]">
            {starFilter ? `No ${starFilter}-star reviews yet` : 'No reviews yet'}
          </h4>
          <p className="text-xs text-[#5B6B82] font-body max-w-sm mx-auto">
            {starFilter
              ? 'Try another star rating.'
              : 'Be the first customer to share feedback on this product.'}
          </p>
          {!starFilter && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold font-heading text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Write First Review
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-[#DCE6F2] p-5 sm:p-6 shadow-xs space-y-3 transition-colors hover:border-[#1D5FAF]/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EAF2FC] text-[#174E90] font-heading font-bold text-xs flex items-center justify-center shrink-0">
                    {(rev.name || rev.authorName || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-[#12263F]">{rev.name || rev.authorName}</h4>
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
                  <div className="flex items-center gap-0.5 text-[#F5B841]" aria-label={`${rev.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= Math.round(rev.rating) ? 'fill-[#F5B841] text-[#F5B841]' : 'text-[#DCE6F2]'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[#5B6B82] text-[12px] font-body">{formatDate(rev.createdAt || rev.date)}</span>
                </div>
              </div>

              {rev.title && (
                <h5 className="font-heading font-semibold text-xs sm:text-sm text-[#12263F] leading-snug">{rev.title}</h5>
              )}

              <p className="text-xs sm:text-sm text-[#5B6B82] font-body leading-relaxed whitespace-pre-line">{rev.comment}</p>

              {rev.images && rev.images.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {rev.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageLightbox(img)}
                      className="relative w-16 h-16 rounded-xl border border-[#DCE6F2] overflow-hidden hover:opacity-90 transition-opacity"
                      aria-label={`Open review photo ${idx + 1}`}
                    >
                      <Image src={img} alt={`Review photo ${idx + 1}`} fill sizes="64px" unoptimized className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {rev.adminReply && (
                <div className="mt-2 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[12px] font-heading font-bold text-[#0B2545]">
                    <Store className="w-3.5 h-3.5" /> Response from BuyDenMed
                    {rev.adminReplyAt && (
                      <span className="font-body font-normal text-[#5B6B82]">· {formatDate(rev.adminReplyAt)}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#12263F] font-body leading-relaxed whitespace-pre-line">{rev.adminReply}</p>
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#1D5FAF] hover:bg-[#EAF2FC] bg-white text-[#1D5FAF] font-heading font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load More Reviews ({Math.max(0, total - reviews.length)} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      <WriteReviewModal
        productId={productId}
        productName={productName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(review) => {
          addToast({
            type: 'success',
            title: 'Review submitted',
            message: 'Thanks! It will appear here after moderation.',
          });
          // an edited, previously approved review leaves the public list until re-approved
          if (review?.status === 'pending') setReloadTick((t) => t + 1);
        }}
      />

      {activeImageLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveImageLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full h-[500px]">
            <Image src={activeImageLightbox} alt="Review photo full size" fill unoptimized className="object-contain" />
            <button
              type="button"
              onClick={() => setActiveImageLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center transition-colors"
              aria-label="Close photo"
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
