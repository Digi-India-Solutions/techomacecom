import type { ProductReview, ReviewStatus } from '@/types/admin';
import { adminDelete, adminFetch, adminGet, adminPatch, adminPost, adminPut, type ListMeta } from './client';

/**
 * Product reviews — live data from the API (backend/src/modules/reviews).
 *
 *   GET    /admin/reviews              ?status=&rating=&productId=&customerId=&verified=&featured=&withImages=&from=&to=&q=&page=&limit=
 *   GET    /admin/reviews/summary      tab counts + per-product ratings
 *   PATCH  /admin/reviews/:id/status   { status, reason }        approve / reject / back to pending
 *   PUT    /admin/reviews/:id          { title, comment }
 *   PATCH  /admin/reviews/:id/reply    { reply }                 '' removes it
 *   PATCH  /admin/reviews/:id/feature  { featured }              home-page testimonial
 *   PATCH  /admin/reviews/:id/verified { verified }              verified-buyer badge
 *   DELETE /admin/reviews/:id                                    (reviews.delete)
 *   POST   /admin/reviews/bulk         { ids, action: approve|reject|delete, reason }
 *
 * Product rating (avg + count) is recomputed on the server after every change.
 */

export interface ReviewFilters {
  status?: 'all' | ReviewStatus;
  rating?: number;
  productId?: string;
  customerId?: string;
  verified?: boolean;
  featured?: boolean;
  withImages?: boolean;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewSummary {
  counts: { pending: number; approved: number; rejected: number; total: number; featured: number };
  products: { productId: string; productName: string; avgRating: number; count: number }[];
}

function query(f: ReviewFilters): string {
  const p = new URLSearchParams();
  if (f.status && f.status !== 'all') p.set('status', f.status);
  if (f.rating) p.set('rating', String(f.rating));
  if (f.productId) p.set('productId', f.productId);
  if (f.customerId) p.set('customerId', f.customerId);
  if (f.verified !== undefined) p.set('verified', String(f.verified));
  if (f.featured !== undefined) p.set('featured', String(f.featured));
  if (f.withImages) p.set('withImages', 'true');
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  if (f.search?.trim()) p.set('q', f.search.trim().slice(0, 100));
  p.set('page', String(f.page || 1));
  p.set('limit', String(Math.min(f.limit || 50, 100)));
  return p.toString();
}

export async function listReviewsPage(filters: ReviewFilters = {}): Promise<{ rows: ProductReview[]; meta?: ListMeta }> {
  const { data, meta } = await adminFetch<ProductReview[]>(`/admin/reviews?${query(filters)}`);
  return { rows: data, meta };
}

/** First page (max 100) of one status — kept for the customer detail page. */
export async function listReviews(status: 'all' | ReviewStatus = 'all', extra: Omit<ReviewFilters, 'status'> = {}): Promise<ProductReview[]> {
  return (await listReviewsPage({ status, limit: 100, ...extra })).rows;
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  return adminGet<ReviewSummary>('/admin/reviews/summary');
}

const path = (id: string, suffix = '') => `/admin/reviews/${encodeURIComponent(id)}${suffix}`;

export async function updateReviewStatus(id: string, status: ReviewStatus, rejectionReason?: string): Promise<ProductReview> {
  return adminPatch<ProductReview>(path(id, '/status'), { status, reason: rejectionReason || '' });
}

export async function editReviewText(id: string, title: string, comment: string): Promise<ProductReview> {
  return adminPut<ProductReview>(path(id), { title, comment });
}

export async function replyToReview(id: string, reply: string): Promise<ProductReview> {
  return adminPatch<ProductReview>(path(id, '/reply'), { reply });
}

export async function setReviewFeatured(id: string, featured: boolean): Promise<ProductReview> {
  return adminPatch<ProductReview>(path(id, '/feature'), { featured });
}

export async function setReviewVerified(id: string, verified: boolean): Promise<ProductReview> {
  return adminPatch<ProductReview>(path(id, '/verified'), { verified });
}

export async function deleteReview(id: string): Promise<void> {
  await adminDelete(path(id));
}

export async function bulkReviewAction(
  ids: string[],
  action: 'approve' | 'reject' | 'delete',
  rejectionReason?: string
): Promise<{ count: number; message: string }> {
  return adminPost('/admin/reviews/bulk', { ids, action, reason: rejectionReason || '' });
}

/** Kept for older callers: bulk approve / reject. */
export async function bulkUpdateReviews(ids: string[], status: 'approved' | 'rejected', rejectionReason?: string): Promise<void> {
  await bulkReviewAction(ids, status === 'approved' ? 'approve' : 'reject', rejectionReason);
}
