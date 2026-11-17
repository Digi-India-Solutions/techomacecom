import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  Edit3,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { ProductReview, ReviewStatus } from '@/types/admin';
import {
  bulkUpdateReviews,
  deleteReview,
  editReviewText,
  getAllReviewsForSummary,
  listReviews,
  updateReviewStatus,
} from '@/lib/api/admin/reviews';
import { formatShortDate } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type BulkAction, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormField, inputClass, textareaClass } from '@/components/admin/FormField';

const REVIEW_TABS: { key: ReviewStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as ReviewStatus) || 'pending';
  const { showToast } = useToast();

  const [statusTab, setStatusTab] = useState<ReviewStatus>(
    REVIEW_TABS.some((t) => t.key === initialStatus) ? initialStatus : 'pending'
  );
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [allReviews, setAllReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectTarget, setRejectTarget] = useState<ProductReview | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editTarget, setEditTarget] = useState<ProductReview | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProductReview | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, all] = await Promise.all([
        listReviews(statusTab),
        getAllReviewsForSummary(),
      ]);
      setReviews(rows);
      setAllReviews(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab]);

  const counts = useMemo(() => {
    return {
      pending: allReviews.filter((r) => r.status === 'pending').length,
      approved: allReviews.filter((r) => r.status === 'approved').length,
      rejected: allReviews.filter((r) => r.status === 'rejected').length,
    };
  }, [allReviews]);

  const productSummary = useMemo(() => {
    const map = new Map<
      string,
      { productId: string; name: string; count: number; totalRating: number }
    >();
    allReviews
      .filter((r) => r.status !== 'rejected')
      .forEach((r) => {
        const entry = map.get(r.productId) || {
          productId: r.productId,
          name: r.productName,
          count: 0,
          totalRating: 0,
        };
        entry.count += 1;
        entry.totalRating += r.rating;
        map.set(r.productId, entry);
      });
    return Array.from(map.values()).map((item) => ({
      ...item,
      avg: (item.totalRating / item.count).toFixed(1),
    }));
  }, [allReviews]);

  const handleApprove = async (rev: ProductReview) => {
    await updateReviewStatus(rev.id, 'approved');
    showToast({ title: 'Review approved and published', variant: 'success' });
    load();
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    await updateReviewStatus(rejectTarget.id, 'rejected', rejectReason);
    setRejectTarget(null);
    setRejectReason('');
    showToast({ title: 'Review rejected', variant: 'info' });
    load();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    await editReviewText(editTarget.id, editTitle, editComment);
    setEditTarget(null);
    showToast({ title: 'Review copy updated', variant: 'success' });
    load();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteReview(deleteTarget.id);
    setDeleteTarget(null);
    showToast({ title: 'Review deleted', variant: 'success' });
    load();
  };

  const columns: DataTableColumn<ProductReview>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product',
        sortable: true,
        sortValue: (r) => r.productName,
        render: (r) => (
          <div className="flex items-center gap-2.5 min-w-[200px] max-w-[260px]">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={r.productImage} alt={r.productName} />
            </div>
            <span className="text-xs font-semibold text-[#12263F] line-clamp-2">
              {r.productName}
            </span>
          </div>
        ),
      },
      {
        key: 'reviewer',
        header: 'Reviewer',
        sortable: true,
        sortValue: (r) => r.reviewerName,
        render: (r) => (
          <div className="min-w-[140px]">
            <div className="flex items-center gap-1.5">
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
            <p className="text-[11px] text-[#5B6B82] font-mono">{r.reviewerMobileMasked}</p>
          </div>
        ),
      },
      {
        key: 'review',
        header: 'Rating & Comment',
        render: (r) => (
          <div className="max-w-md space-y-1">
            <div className="flex items-center gap-2">
              <Stars rating={r.rating} />
              <span className="text-xs font-semibold text-[#12263F]">{r.title}</span>
            </div>
            <p className="text-xs text-[#5B6B82] line-clamp-2">{r.comment}</p>
            {r.images.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                {r.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="h-8 w-8 overflow-hidden rounded border border-[#DCE6F2]"
                  >
                    <SafeImage src={img} alt="Review upload" />
                  </div>
                ))}
              </div>
            )}
            {r.rejectionReason && (
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
        render: (r) => (
          <div className="space-y-1 whitespace-nowrap">
            <p className="text-xs text-[#5B6B82] tabular-nums">
              {formatShortDate(r.createdAt)}
            </p>
            <StatusBadge status={r.status} />
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            {r.status !== 'approved' && (
              <button
                type="button"
                onClick={() => handleApprove(r)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </button>
            )}
            {r.status !== 'rejected' && (
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(r);
                  setRejectReason('');
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#B85A0E] hover:bg-[#F28C38]/10"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditTarget(r);
                setEditTitle(r.title);
                setEditComment(r.comment);
              }}
              className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#1D5FAF]"
              title="Edit review text"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(r)}
              className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-red-600 hover:bg-red-50"
              title="Delete review"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const bulkActions: BulkAction<ProductReview>[] = [
    {
      key: 'bulk_approve',
      label: 'Bulk Approve',
      onClick: async (rows) => {
        await bulkUpdateReviews(
          rows.map((r) => r.id),
          'approved'
        );
        showToast({ title: `Approved ${rows.length} reviews`, variant: 'success' });
        load();
      },
    },
    {
      key: 'bulk_reject',
      label: 'Bulk Reject',
      variant: 'danger',
      onClick: async (rows) => {
        await bulkUpdateReviews(
          rows.map((r) => r.id),
          'rejected',
          'Moderation policy rejection'
        );
        showToast({ title: `Rejected ${rows.length} reviews`, variant: 'info' });
        load();
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Reviews</h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">
          Moderate customer reviews, verify buyer badges, and monitor product-wise ratings.
        </p>
      </div>

      {/* Product-wise Rating Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {productSummary.map((item) => (
          <div
            key={item.productId}
            className="rounded-xl border border-[#DCE6F2] bg-white p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#12263F] truncate">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-[#5B6B82] tabular-nums">
                {item.count} {item.count === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[#EAF2FC] px-2.5 py-1 text-xs font-bold text-[#1D5FAF] tabular-nums shrink-0">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              {item.avg}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[#DCE6F2] bg-white p-1.5 w-fit">
        {REVIEW_TABS.map((tab) => {
          const active = statusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-[#F6F9FD] text-[#5B6B82]'
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <DataTable
        data={reviews}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        selectable
        bulkActions={bulkActions}
        searchKeys={(r) => `${r.productName} ${r.reviewerName} ${r.title} ${r.comment}`}
        searchPlaceholder="Search product, reviewer, or comment..."
        emptyTitle={`No ${statusTab} reviews`}
        emptyDescription="All reviews in this moderation queue have been processed."
      />

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/50 p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[#12263F]">Reject Review</h3>
            <FormField label="Rejection Reason" required>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Contains spam link or unverified claim"
                className={textareaClass}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
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
            <h3 className="text-base font-semibold text-[#12263F]">Moderate Review Copy</h3>
            <FormField label="Review Headline" required>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Review Comment" required>
              <textarea
                rows={4}
                required
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
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product Review"
        description={`Permanently delete review "${deleteTarget?.title}" by ${deleteTarget?.reviewerName}?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
