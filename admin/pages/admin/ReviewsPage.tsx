import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  MessageCircleReply,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { ProductReview, ReviewStatus } from '@/types/admin';
import {
  bulkReviewAction,
  deleteReview,
  editReviewText,
  getReviewSummary,
  listReviewsPage,
  replyToReview,
  setReviewFeatured,
  setReviewVerified,
  updateReviewStatus,
  type ReviewFilters,
  type ReviewSummary,
} from '@/lib/api/admin/reviews';
import { formatDateTime, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type BulkAction, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, textareaClass } from '@/components/admin/FormField';

/**
 * Reviews moderation. Customers (signed in) write reviews on the product page → "pending".
 * Only approved reviews are public and count in the product's star rating (recomputed on
 * the server after every approve / reject / delete).
 */

type Tab = ReviewStatus | 'all';

const REVIEW_TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const PAGE_SIZE = 50;
const STOREFRONT_URL = String(import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/+$/, '');
const errorText = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
      ))}
    </div>
  );
}

const iconBtn =
  'rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF] disabled:opacity-50';

export function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as Tab | null;
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can('reviews.edit');
  const canDelete = can('reviews.delete');

  const [statusTab, setStatusTab] = useState<Tab>(
    REVIEW_TABS.some((t) => t.key === initialStatus) ? (initialStatus as Tab) : 'pending'
  );
  const [ratingFilter, setRatingFilter] = useState(0);
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [withImages, setWithImages] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Reject (single or bulk)
  const [rejectTargets, setRejectTargets] = useState<ProductReview[] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // Edit text
  const [editTarget, setEditTarget] = useState<ProductReview | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  // Reply
  const [replyTarget, setReplyTarget] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState('');
  // Delete (single or bulk)
  const [deleteTargets, setDeleteTargets] = useState<ProductReview[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: ReviewFilters = useMemo(
    () => ({
      status: statusTab,
      rating: ratingFilter || undefined,
      verified: verifiedFilter === 'all' ? undefined : verifiedFilter === 'yes',
      featured: featuredOnly ? true : undefined,
      withImages: withImages || undefined,
      productId: productFilter || undefined,
      from: from || undefined,
      to: to || undefined,
      search,
    }),
    [statusTab, ratingFilter, verifiedFilter, featuredOnly, withImages, productFilter, from, to, search]
  );

  const refreshSummary = useCallback(() => {
    getReviewSummary()
      .then(setSummary)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listReviewsPage({ ...filters, page: 1, limit: PAGE_SIZE })
      .then(({ rows, meta }) => {
        if (cancelled) return;
        setReviews(rows);
        setPage(1);
        setTotal(meta?.total ?? rows.length);
        setHasMore(Boolean(meta?.hasNextPage));
      })
      .catch((err) => {
        if (cancelled) return;
        setReviews([]);
        setTotal(0);
        setHasMore(false);
        showToast({ title: 'Could not load reviews', description: errorText(err, 'Please try again'), variant: 'error' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey, showToast]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary, reloadKey]);

  /** After a change: reload the list (rows may leave the current tab) and the counts. */
  const reload = () => setReloadKey((k) => k + 1);

  /** Replace one row in place (no reload) when it still belongs in this tab. */
  const replaceRow = (updated: ProductReview) => {
    setReviews((prev) =>
      statusTab !== 'all' && updated.status !== statusTab
        ? prev.filter((r) => r.id !== updated.id)
        : prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const run = async (id: string, fn: () => Promise<unknown>, success: string, refresh = true) => {
    setBusyId(id);
    try {
      await fn();
      showToast({ title: success, variant: 'success' });
      if (refresh) reload();
    } catch (err) {
      showToast({ title: 'Action failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const { rows, meta } = await listReviewsPage({ ...filters, page: next, limit: PAGE_SIZE });
      setReviews((prev) => [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))]);
      setPage(next);
      if (meta?.total !== undefined) setTotal(meta.total);
      setHasMore(Boolean(meta?.hasNextPage));
    } catch (err) {
      showToast({ title: 'Could not load more', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleApprove = (rev: ProductReview) =>
    run(rev.id, () => updateReviewStatus(rev.id, 'approved'), 'Review approved and published');

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargets?.length || rejectReason.trim().length < 3) return;
    setSubmitting(true);
    try {
      if (rejectTargets.length === 1) {
        await updateReviewStatus(rejectTargets[0].id, 'rejected', rejectReason.trim());
      } else {
        await bulkReviewAction(rejectTargets.map((r) => r.id), 'reject', rejectReason.trim());
      }
      showToast({
        title: rejectTargets.length === 1 ? 'Review rejected' : `Rejected ${rejectTargets.length} reviews`,
        variant: 'info',
      });
      setRejectTargets(null);
      setRejectReason('');
      reload();
    } catch (err) {
      showToast({ title: 'Reject failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      replaceRow(await editReviewText(editTarget.id, editTitle.trim(), editComment.trim()));
      setEditTarget(null);
      showToast({ title: 'Review text updated', variant: 'success' });
    } catch (err) {
      showToast({ title: 'Save failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    setSubmitting(true);
    try {
      replaceRow(await replyToReview(replyTarget.id, replyText.trim()));
      showToast({ title: replyText.trim() ? 'Reply saved' : 'Reply removed', variant: 'success' });
      setReplyTarget(null);
    } catch (err) {
      showToast({ title: 'Save failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargets?.length) return;
    setSubmitting(true);
    try {
      if (deleteTargets.length === 1) await deleteReview(deleteTargets[0].id);
      else await bulkReviewAction(deleteTargets.map((r) => r.id), 'delete');
      showToast({
        title: deleteTargets.length === 1 ? 'Review deleted' : `Deleted ${deleteTargets.length} reviews`,
        variant: 'success',
      });
      setDeleteTargets(null);
      reload();
    } catch (err) {
      showToast({ title: 'Delete failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<ProductReview>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product',
        sortable: true,
        sortValue: (r) => r.productName,
        csvValue: (r) => r.productName,
        render: (r) => (
          <div className="flex items-center gap-2.5 min-w-[200px] max-w-[260px]">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={r.productImage} alt={r.productName} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#12263F] line-clamp-2">{r.productName}</span>
              {STOREFRONT_URL && r.productSlug && (
                <a
                  href={`${STOREFRONT_URL}/product/${r.productSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 text-[10px] text-[#1D5FAF] hover:underline"
                >
                  View on store <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'reviewer',
        header: 'Reviewer',
        sortable: true,
        sortValue: (r) => r.reviewerName,
        csvValue: (r) => r.reviewerName,
        render: (r) => (
          <div className="min-w-[140px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-semibold text-[#12263F]">{r.reviewerName}</p>
              {r.verifiedBuyer && (
                <span
                  className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                  title="Verified Buyer"
                >
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            {r.reviewerEmail && <p className="text-[11px] text-[#5B6B82] break-all">{r.reviewerEmail}</p>}
            {r.reviewerMobileMasked && (
              <p className="text-[11px] text-[#5B6B82] font-mono">{r.reviewerMobileMasked}</p>
            )}
          </div>
        ),
      },
      {
        key: 'review',
        header: 'Rating & Comment',
        csvValue: (r) => `${r.rating}★ ${r.title} — ${r.comment}`,
        render: (r) => (
          <div className="max-w-md space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Stars rating={r.rating} />
              {r.title && <span className="text-xs font-semibold text-[#12263F]">{r.title}</span>}
              {r.featured && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  <Sparkles className="h-3 w-3" /> Featured
                </span>
              )}
            </div>
            <p className="text-xs text-[#5B6B82] line-clamp-3 whitespace-pre-line">{r.comment}</p>
            {r.images.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                {r.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-10 w-10 overflow-hidden rounded border border-[#DCE6F2]"
                  >
                    <SafeImage src={img} alt={`Review photo ${idx + 1}`} />
                  </a>
                ))}
              </div>
            )}
            {r.adminReply && (
              <p className="rounded bg-[#EAF2FC] px-2 py-1 text-[11px] text-[#12263F]">
                <span className="font-semibold">Store reply:</span> {r.adminReply}
              </p>
            )}
            {r.rejectionReason && r.status === 'rejected' && (
              <p className="text-[11px] text-red-600">Reason: {r.rejectionReason}</p>
            )}
          </div>
        ),
      },
      {
        key: 'date',
        header: 'Submitted',
        sortable: true,
        sortValue: (r) => r.createdAt,
        csvValue: (r) => r.createdAt,
        render: (r) => (
          <div className="space-y-1 whitespace-nowrap">
            <p className="text-xs text-[#5B6B82] tabular-nums" title={formatDateTime(r.createdAt)}>
              {formatShortDate(r.createdAt)}
            </p>
            <StatusBadge status={r.status} />
            {r.moderatedBy && (
              <p className="text-[10px] text-[#5B6B82]">by {r.moderatedBy}</p>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (r) => {
          const busy = busyId === r.id;
          return (
            <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-[180px]">
              {canEdit && r.status !== 'approved' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleApprove(r)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve
                </button>
              )}
              {canEdit && r.status !== 'rejected' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setRejectTargets([r]);
                    setRejectReason('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#B85A0E] hover:bg-[#F28C38]/10 disabled:opacity-60"
                  title={r.status === 'approved' ? 'Unpublish (reject) this review' : 'Reject'}
                >
                  <X className="h-3.5 w-3.5" />
                  {r.status === 'approved' ? 'Unpublish' : 'Reject'}
                </button>
              )}
              {canEdit && r.status === 'approved' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      r.id,
                      async () => replaceRow(await setReviewFeatured(r.id, !r.featured)),
                      r.featured ? 'Removed from home page' : 'Featured on home page testimonials',
                      false
                    ).then(refreshSummary)
                  }
                  className={`${iconBtn} ${r.featured ? 'text-amber-600' : ''}`}
                  title={r.featured ? 'Remove from home page testimonials' : 'Feature on home page testimonials'}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      r.id,
                      async () => replaceRow(await setReviewVerified(r.id, !r.verifiedBuyer)),
                      r.verifiedBuyer ? 'Verified badge removed' : 'Marked as verified buyer',
                      false
                    )
                  }
                  className={`${iconBtn} ${r.verifiedBuyer ? 'text-emerald-600' : ''}`}
                  title={r.verifiedBuyer ? 'Remove verified buyer badge' : 'Mark as verified buyer'}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setReplyTarget(r);
                    setReplyText(r.adminReply || '');
                  }}
                  className={iconBtn}
                  title={r.adminReply ? 'Edit store reply' : 'Reply to review'}
                >
                  <MessageCircleReply className="h-3.5 w-3.5" />
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditTarget(r);
                    setEditTitle(r.title);
                    setEditComment(r.comment);
                  }}
                  className={iconBtn}
                  title="Edit review text"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeleteTargets([r])}
                  className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="Delete review"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // handlers only use state setters + stable callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId, canEdit, canDelete, statusTab]
  );

  const bulkActions: BulkAction<ProductReview>[] = [
    ...(canEdit
      ? [
          {
            key: 'bulk_approve',
            label: 'Approve',
            onClick: async (rows: ProductReview[]) => {
              try {
                const res = await bulkReviewAction(rows.map((r) => r.id), 'approve');
                showToast({ title: res.message, variant: 'success' });
                reload();
              } catch (err) {
                showToast({ title: 'Bulk approve failed', description: errorText(err, 'Please try again'), variant: 'error' });
              }
            },
          },
          {
            key: 'bulk_reject',
            label: 'Reject',
            onClick: (rows: ProductReview[]) => {
              setRejectTargets(rows);
              setRejectReason('');
            },
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            key: 'bulk_delete',
            label: 'Delete',
            variant: 'danger' as const,
            onClick: (rows: ProductReview[]) => setDeleteTargets(rows),
          },
        ]
      : []),
  ];

  const counts = summary?.counts;
  const tabCount = (tab: Tab) => (counts ? (tab === 'all' ? counts.total : counts[tab]) : '…');
  const filterClass = 'rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-medium text-[#12263F]';
  const hasFilters = Boolean(ratingFilter || verifiedFilter !== 'all' || featuredOnly || withImages || productFilter || from || to);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Reviews</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Moderate customer reviews, reply, feature testimonials and monitor product-wise ratings.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#5B6B82] ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Product-wise Rating Summary (approved reviews, top 10 by count) */}
      {summary && summary.products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {summary.products.slice(0, 8).map((item) => {
            const active = productFilter === item.productId;
            return (
              <button
                type="button"
                key={item.productId}
                onClick={() => setProductFilter(active ? '' : item.productId)}
                className={`rounded-xl border bg-white p-4 flex items-center justify-between gap-3 text-left transition-colors ${
                  active ? 'border-[#1D5FAF] ring-1 ring-[#1D5FAF]' : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
                }`}
                title={active ? 'Show all products' : 'Show only this product'}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#12263F] truncate">{item.productName}</p>
                  <p className="mt-0.5 text-[11px] text-[#5B6B82] tabular-nums">
                    {item.count} approved {item.count === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[#EAF2FC] px-2.5 py-1 text-xs font-bold text-[#1D5FAF] tabular-nums shrink-0">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  {item.avgRating.toFixed(1)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-[#DCE6F2] bg-white p-1.5 w-fit">
          {REVIEW_TABS.map((tab) => {
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-[#F6F9FD] text-[#5B6B82]'
                  }`}
                >
                  {tabCount(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className={filterClass}
            aria-label="Filter by rating"
          >
            <option value={0}>All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
            className={filterClass}
            aria-label="Filter by verified buyer"
          >
            <option value="all">All buyers</option>
            <option value="yes">Verified buyers</option>
            <option value="no">Not verified</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs text-[#12263F]">
            <input type="checkbox" checked={withImages} onChange={(e) => setWithImages(e.target.checked)} />
            With photos
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-[#12263F]">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
            Featured
          </label>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className={filterClass}
            aria-label="Submitted from"
          />
          <span className="text-xs text-[#5B6B82]">to</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className={filterClass}
            aria-label="Submitted to"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setRatingFilter(0);
                setVerifiedFilter('all');
                setFeaturedOnly(false);
                setWithImages(false);
                setProductFilter('');
                setFrom('');
                setTo('');
              }}
              className="text-xs font-semibold text-[#1D5FAF] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <DataTable
        data={reviews}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        selectable={bulkActions.length > 0}
        bulkActions={bulkActions}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search product, reviewer, title or comment..."
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyTitle={statusTab === 'all' ? 'No reviews found' : `No ${statusTab} reviews`}
        emptyDescription={
          statusTab === 'pending' && !hasFilters && !search
            ? 'All reviews in this moderation queue have been processed.'
            : 'Try another tab or clear the filters.'
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B6B82]">
        <span className="tabular-nums">
          Loaded {reviews.length} of {total} review{total === 1 ? '' : 's'}
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Load more
          </button>
        )}
      </div>

      {/* Reject Reason Modal (single or bulk) */}
      {rejectTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">
              {rejectTargets.length === 1
                ? rejectTargets[0].status === 'approved'
                  ? 'Unpublish Review'
                  : 'Reject Review'
                : `Reject ${rejectTargets.length} Reviews`}
            </h3>
            <p className="text-xs text-[#5B6B82]">
              Rejected reviews are hidden from the store and removed from the product rating. The customer
              sees the reason on their review and can edit and resubmit it.
            </p>
            <FormField label="Rejection Reason" required>
              <textarea
                rows={3}
                required
                minLength={3}
                maxLength={500}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Contains a promotional link or personal information"
                className={textareaClass}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTargets(null)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || rejectReason.trim().length < 3}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Review Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">Edit Review Text</h3>
            <p className="text-xs text-[#5B6B82]">
              Fix typos or remove personal details. The star rating always stays the customer&apos;s.
            </p>
            <FormField label="Review Headline">
              <input
                type="text"
                maxLength={150}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Review Comment" required>
              <textarea
                rows={4}
                required
                minLength={5}
                maxLength={600}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className={textareaClass}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || editComment.trim().length < 5}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleReplySubmit}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">Reply to {replyTarget.reviewerName}</h3>
            <div className="rounded-lg bg-[#F6F9FD] p-3 text-xs text-[#12263F] space-y-1">
              <Stars rating={replyTarget.rating} />
              <p className="line-clamp-4">{replyTarget.comment}</p>
            </div>
            <FormField label="Store reply (shown publicly under the review)">
              <textarea
                rows={4}
                maxLength={1000}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank you for your feedback..."
                className={textareaClass}
              />
            </FormField>
            <p className="text-[11px] text-[#5B6B82]">Leave empty and save to remove the reply.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Reply
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargets?.length)}
        title={deleteTargets && deleteTargets.length > 1 ? `Delete ${deleteTargets.length} Reviews` : 'Delete Product Review'}
        description={
          deleteTargets && deleteTargets.length > 1
            ? `Permanently delete ${deleteTargets.length} reviews and their photos? Product ratings are recalculated. This cannot be undone.`
            : `Permanently delete the review by ${deleteTargets?.[0]?.reviewerName ?? ''}${
                deleteTargets?.[0]?.title ? ` ("${deleteTargets[0].title}")` : ''
              }? Its photos are removed and the product rating is recalculated. This cannot be undone.`
        }
        confirmLabel="Delete"
        loading={submitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargets(null)}
      />
    </div>
  );
}
