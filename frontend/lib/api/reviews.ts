import type { Review } from '@/types';
import { apiFetch, apiPost, publicGet, type PageMeta } from './backend';

/**
 * Product reviews — live API (backend/src/modules/reviews).
 *
 *   GET  /reviews/product/:productId   approved reviews + star summary (public)
 *   GET  /reviews/featured             home-page testimonials (public)
 *   GET  /reviews/mine?productId=      the signed-in customer's own review
 *   POST /reviews                      create / edit own review → "pending" until staff approve it
 *   POST /reviews/images               upload one photo (multipart "file") → { path, url }
 *
 * Writing a review needs a signed-in customer (no mobile OTP). One review per product:
 * submitting again edits it and sends it back to moderation.
 */

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  withPhotos: number;
}

export type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface ProductReviewsPage {
  reviews: Review[];
  summary: ReviewSummary;
  meta?: PageMeta;
}

const EMPTY_SUMMARY: ReviewSummary = { average: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, withPhotos: 0 };

/** Approved reviews of a product (one page) + the star summary. */
export async function getProductReviewsPage(
  productId: string,
  options: { page?: number; limit?: number; sort?: ReviewSort; rating?: number | null; withImages?: boolean } = {}
): Promise<ProductReviewsPage> {
  const p = new URLSearchParams();
  p.set('page', String(options.page || 1));
  p.set('limit', String(options.limit || 10));
  p.set('sort', options.sort || 'newest');
  if (options.rating) p.set('rating', String(options.rating));
  if (options.withImages) p.set('withImages', 'true');
  const { data, meta } = await publicGet<{ reviews: Review[]; summary: ReviewSummary }>(
    `/reviews/product/${encodeURIComponent(productId)}?${p.toString()}`
  );
  return { reviews: data.reviews, summary: data.summary, meta };
}

/** First page of approved reviews ([] when the API is unreachable — the page still renders). */
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    return (await getProductReviewsPage(productId)).reviews;
  } catch (err) {
    console.error('[reviews] product reviews failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/** Same as getProductReviewsPage but never throws (server components). */
export async function getProductReviewsSafe(productId: string): Promise<ProductReviewsPage> {
  try {
    return await getProductReviewsPage(productId);
  } catch (err) {
    console.error('[reviews] product reviews failed:', err instanceof Error ? err.message : err);
    return { reviews: [], summary: EMPTY_SUMMARY };
  }
}

/** Approved reviews the store marked as featured (home-page testimonials). */
export async function getFeaturedReviews(limit = 12): Promise<Review[]> {
  try {
    return (await publicGet<Review[]>(`/reviews/featured?limit=${limit}`)).data;
  } catch (err) {
    console.error('[reviews] featured failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

export interface MyReview extends Review {
  imagePaths: string[];
  rejectionReason: string | null;
  updatedAt: string;
}

/** The signed-in customer's review of a product (null = not written yet). Throws 401 when signed out. */
export async function getMyReview(productId: string): Promise<{ review: MyReview | null; verifiedBuyer: boolean }> {
  return apiFetch(`/reviews/mine?productId=${encodeURIComponent(productId)}`);
}

export interface UploadedReviewPhoto {
  /** stored path — send this back in submitReview().images */
  path: string;
  /** full URL for the preview */
  url: string;
}

/** Uploads one photo; the API converts it to WebP. */
export async function uploadReviewPhoto(file: File): Promise<UploadedReviewPhoto> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<UploadedReviewPhoto>('/reviews/images', { method: 'POST', body: form });
}

/** Create or edit the signed-in customer's review. Always goes to moderation first. */
export async function submitReview(data: {
  productId: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
  /** stored photo paths from uploadReviewPhoto() (max 3) */
  images?: string[];
}): Promise<{ success: boolean; review: MyReview; message: string }> {
  const res = await apiPost<{ review: MyReview; message: string }>('/reviews', {
    productId: data.productId,
    name: data.name.trim(),
    rating: data.rating,
    title: data.title?.trim() || '',
    comment: data.comment.trim(),
    images: (data.images || []).slice(0, 3),
  });
  return { success: true, ...res };
}
