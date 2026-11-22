import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Eye,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import type {
  EnquiryCategory,
  EnquiryRecord,
  EnquiryStatus,
} from '@/types/admin';
import {
  addEnquiryNote,
  exportEnquiriesCsv,
  listAssignees,
  listEnquiriesPage,
  updateEnquiry,
  type EnquiryFilters,
  type EnquiryPatch,
} from '@/lib/api/admin/enquiries';
import { formatDateTime, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

/**
 * Enquiries — every lead form on the storefront, stored in the `enquiries` table:
 *   Sleep Test           → /sleep-test form + sleep-apnea quiz (with STOP-BANG risk)
 *   Bulk / B2B           → /bulk-enquiry
 *   Contact Form         → /contact (Contact Us messages)
 *   Seller Registration  → /sell (vendor partner onboarding registrations)
 * Staff follow up here: status, assigned staff, next follow-up date and a notes timeline.
 */

const CATEGORY_TABS: { key: EnquiryCategory; label: string }[] = [
  { key: 'sleep_test', label: 'Sleep Test' },
  { key: 'bulk_b2b', label: 'Bulk / B2B Enquiry' },
  { key: 'contact', label: 'Contact Form' },
  { key: 'seller_registration', label: 'Seller Registration' },
];

const STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
];

const PAGE_SIZE = 50;
const RISK_TONE = { low: 'success', moderate: 'warning', high: 'danger' } as const;
const errorText = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

function RiskBadge({ quiz }: { quiz: EnquiryRecord['quiz'] }) {
  if (!quiz) return null;
  return (
    <StatusBadge status={quiz.risk} label={`${quiz.risk} risk · ${quiz.score}/8`} tone={RISK_TONE[quiz.risk]} />
  );
}

export function EnquiriesPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as 'all' | EnquiryStatus | null;

  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can('enquiries.edit');

  const [category, setCategory] = useState<EnquiryCategory>('sleep_test');
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>(
    initialStatus && (initialStatus === 'all' || STATUS_OPTIONS.some((o) => o.value === initialStatus))
      ? initialStatus
      : 'all'
  );
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'moderate' | 'high'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [activeEnquiry, setActiveEnquiry] = useState<EnquiryRecord | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Draft edit state for active enquiry
  const [draftStatus, setDraftStatus] = useState<EnquiryStatus>('new');
  const [draftAssignedTo, setDraftAssignedTo] = useState<string>('');
  const [draftFollowUpDate, setDraftFollowUpDate] = useState<string>('');

  useEffect(() => {
    if (activeEnquiry) {
      setDraftStatus(activeEnquiry.status);
      setDraftAssignedTo(activeEnquiry.assignedStaffId || '');
      setDraftFollowUpDate(activeEnquiry.nextFollowUpDate || '');
    }
  }, [activeEnquiry]);

  const isDirty = useMemo(() => {
    if (!activeEnquiry) return false;
    const statusChanged = draftStatus !== activeEnquiry.status;
    const staffChanged = (draftAssignedTo || '') !== (activeEnquiry.assignedStaffId || '');
    const dateChanged = (draftFollowUpDate || '') !== (activeEnquiry.nextFollowUpDate || '');
    return statusChanged || staffChanged || dateChanged;
  }, [activeEnquiry, draftStatus, draftAssignedTo, draftFollowUpDate]);

  // Server-side search, debounced so typing does not fire one request per key
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: EnquiryFilters = useMemo(
    () => ({
      category,
      status: statusFilter,
      search,
      risk: category === 'sleep_test' ? riskFilter : undefined,
    }),
    [category, statusFilter, search, riskFilter]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listEnquiriesPage({ ...filters, page: 1, limit: PAGE_SIZE })
      .then(({ rows, meta }) => {
        if (cancelled) return;
        setEnquiries(rows);
        setPage(1);
        setTotal(meta?.total ?? rows.length);
        setHasMore(Boolean(meta?.hasNextPage));
      })
      .catch((err) => {
        if (!cancelled) {
          setEnquiries([]);
          setTotal(0);
          setHasMore(false);
          showToast({ title: 'Could not load enquiries', description: errorText(err, 'Please try again'), variant: 'error' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey, showToast]);

  useEffect(() => {
    listAssignees()
      .then(setStaff)
      .catch(() => setStaff([]));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const { rows, meta } = await listEnquiriesPage({ ...filters, page: next, limit: PAGE_SIZE });
      setEnquiries((prev) => [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))]);
      setPage(next);
      if (meta?.total !== undefined) setTotal(meta.total);
      setHasMore(Boolean(meta?.hasNextPage));
    } catch (err) {
      showToast({ title: 'Could not load more', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const count = await exportEnquiriesCsv(filters);
      showToast({ title: `Exported ${count} enquir${count === 1 ? 'y' : 'ies'}`, variant: 'success' });
    } catch (err) {
      showToast({ title: 'Export failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const applyUpdated = (updated: EnquiryRecord) => {
    setActiveEnquiry(updated);
    setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleSaveEnquiry = async () => {
    if (!activeEnquiry || !canEdit || !isDirty) return;
    setSaving(true);
    try {
      const patch: EnquiryPatch = {};
      if (draftStatus !== activeEnquiry.status) patch.status = draftStatus;
      if ((draftAssignedTo || '') !== (activeEnquiry.assignedStaffId || '')) {
        patch.assignedTo = draftAssignedTo || null;
      }
      if ((draftFollowUpDate || '') !== (activeEnquiry.nextFollowUpDate || '')) {
        patch.nextFollowUpDate = draftFollowUpDate;
      }
      const updated = await updateEnquiry(activeEnquiry.id, patch);
      applyUpdated(updated);
      showToast({ title: 'Enquiry updated successfully', variant: 'success' });
    } catch (err) {
      showToast({ title: 'Update failed', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiry || !noteInput.trim() || !canEdit) return;
    setSaving(true);
    try {
      applyUpdated(await addEnquiryNote(activeEnquiry.id, noteInput.trim()));
      setNoteInput('');
      showToast({ title: 'Follow-up note added', variant: 'success' });
    } catch (err) {
      showToast({ title: 'Could not add note', description: errorText(err, 'Please try again'), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<EnquiryRecord>[] = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date & ID',
        sortable: true,
        sortValue: (e) => e.createdAt,
        csvValue: (e) => e.createdAt,
        render: (e) => (
          <div>
            <span className="font-mono text-xs font-semibold text-[#1D5FAF]">{e.enquiryNumber}</span>
            <p className="text-[11px] text-[#5B6B82] tabular-nums">{formatDateTime(e.createdAt)}</p>
          </div>
        ),
      },
      {
        key: 'name',
        header: 'Lead / Contact',
        sortable: true,
        sortValue: (e) => e.name,
        csvValue: (e) => e.name,
        render: (e) => (
          <div>
            <p className="text-sm font-semibold text-[#12263F]">{e.name}</p>
            <p className="text-xs text-[#5B6B82]">
              {e.mobile}
              {e.city ? ` · ${e.city}` : ''}
            </p>
          </div>
        ),
      },
      {
        key: 'details',
        header:
          category === 'sleep_test'
            ? 'Test Type, Date & Risk'
            : category === 'bulk_b2b'
              ? 'Organisation / Equipment'
              : category === 'seller_registration'
                ? 'Company & Registration'
                : 'Subject',
        render: (e) => {
          if (e.category === 'sleep_test') {
            return (
              <div className="text-xs space-y-1">
                <p className="font-semibold text-[#12263F]">{e.testType || 'Not sure'}</p>
                <p className="text-[#5B6B82]">
                  Preferred: {e.preferredDate ? formatShortDate(e.preferredDate) : 'Flexible'}
                </p>
                <RiskBadge quiz={e.quiz} />
              </div>
            );
          }
          if (e.category === 'bulk_b2b') {
            return (
              <div className="text-xs max-w-xs">
                <p className="font-semibold text-[#12263F] truncate">{e.organization || '—'}</p>
                <p className="text-[#5B6B82] truncate">
                  {e.productsSummary || e.message || '—'}
                  {e.estimatedBudget ? ` · ${e.estimatedBudget}` : ''}
                </p>
              </div>
            );
          }
          if (category === 'seller_registration' || e.kind === 'seller_registration' || e.category === 'seller_registration') {
            return (
              <div className="text-xs max-w-xs space-y-0.5">
                <p className="font-semibold text-[#12263F] truncate">
                  {e.sellerDetails?.companyName || e.organization || e.name}
                </p>
                <p className="text-[#5B6B82] truncate">
                  {e.sellerDetails?.vendorType || 'Vendor'} · {e.sellerDetails?.registeredAs || 'Registered'}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="font-mono text-[11px] text-[#1D5FAF]">
                    {e.sellerDetails?.gstNumber ? `GST: ${e.sellerDetails.gstNumber}` : (e.sellerDetails?.originCountry || 'India')}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div className="text-xs max-w-xs space-y-1">
              <p className="font-semibold text-[#12263F] truncate">{e.subject || '—'}</p>
              <p className="text-[#5B6B82] truncate">{e.message}</p>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (e) => e.status,
        csvValue: (e) => e.status,
        render: (e) => <StatusBadge status={e.status} />,
      },
      {
        key: 'assignedStaff',
        header: 'Assigned Staff',
        sortable: true,
        sortValue: (e) => e.assignedStaffName || '',
        csvValue: (e) => e.assignedStaffName || 'Unassigned',
        render: (e) => <span className="text-xs text-[#12263F]">{e.assignedStaffName || 'Unassigned'}</span>,
      },
      {
        key: 'nextFollowUpDate',
        header: 'Next Follow-up',
        sortable: true,
        sortValue: (e) => e.nextFollowUpDate || '',
        csvValue: (e) => e.nextFollowUpDate || '',
        render: (e) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {e.nextFollowUpDate ? formatShortDate(e.nextFollowUpDate) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (e) => (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setActiveEnquiry(e);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5" />
            Open
          </button>
        ),
      },
    ],
    [category]
  );

  const filterSelectClass = 'rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-medium text-[#12263F]';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Enquiries</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Manage home sleep apnea tests, institutional bulk quotes, and contact form leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#5B6B82] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 text-[#5B6B82]" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Category Tabs + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE6F2] bg-white p-2">
        <div className="flex flex-wrap items-center gap-1">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategory(tab.key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {category === 'sleep_test' && (
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
              className={filterSelectClass}
              aria-label="Filter by quiz risk"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High risk (quiz)</option>
              <option value="moderate">Moderate risk (quiz)</option>
              <option value="low">Low risk (quiz)</option>
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | EnquiryStatus)}
            className={filterSelectClass}
            aria-label="Filter by enquiry status"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        data={enquiries}
        columns={columns}
        getRowId={(e) => e.id}
        loading={loading}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search name, mobile, email, city, message or enquiry #..."
        onRowClick={(e) => setActiveEnquiry(e)}
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyTitle="No enquiries in this category"
        emptyDescription="Switch enquiry tabs or clear your filters."
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B6B82]">
        <span className="tabular-nums">
          Loaded {enquiries.length} of {total} enquir{total === 1 ? 'y' : 'ies'}
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

      {/* Enquiry Detail Drawer */}
      <Drawer
        open={Boolean(activeEnquiry)}
        onClose={() => {
          setActiveEnquiry(null);
          setNoteInput('');
        }}
        title={activeEnquiry ? `${activeEnquiry.enquiryNumber} — ${activeEnquiry.name}` : ''}
        subtitle={
          activeEnquiry
            ? `${activeEnquiry.city || '—'} · Received ${formatDateTime(activeEnquiry.createdAt)}`
            : undefined
        }
      >
        {activeEnquiry && (
          <div className="space-y-5">
            {/* Quick Call & WhatsApp */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${activeEnquiry.mobile.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                <Phone className="h-3.5 w-3.5" />
                Call {activeEnquiry.mobile}
              </a>
              <a
                href={`https://wa.me/${(() => {
                  const digits = activeEnquiry.mobile.replace(/[^0-9]/g, '');
                  return digits.length === 10 ? `91${digits}` : digits;
                })()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp Chat
              </a>
            </div>

            {/* Submitted Data */}
            <div className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-4 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[#5B6B82]">Email:</span>{' '}
                  {activeEnquiry.email ? (
                    <a href={`mailto:${activeEnquiry.email}`} className="font-medium text-[#1D5FAF] break-all hover:underline">
                      {activeEnquiry.email}
                    </a>
                  ) : (
                    <span className="font-medium text-[#12263F]">—</span>
                  )}
                </div>
                <div>
                  <span className="text-[#5B6B82]">Location:</span>{' '}
                  <span className="font-medium text-[#12263F]">
                    {[activeEnquiry.city, activeEnquiry.state, activeEnquiry.pincode].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              </div>

              {activeEnquiry.category === 'sleep_test' && (
                <p>
                  <span className="text-[#5B6B82]">Sleep Study Type:</span>{' '}
                  <span className="font-semibold text-[#12263F]">{activeEnquiry.testType || 'Not sure'}</span>
                  {activeEnquiry.preferredDate && ` (Preferred: ${formatShortDate(activeEnquiry.preferredDate)})`}
                </p>
              )}

              {activeEnquiry.quiz && (
                <div className="rounded-lg border border-[#DCE6F2] bg-white p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#12263F]">STOP-BANG quiz result</span>
                    <RiskBadge quiz={activeEnquiry.quiz} />
                  </div>
                  <p className="text-[#5B6B82]">
                    Score {activeEnquiry.quiz.score}/8 · BMI {activeEnquiry.quiz.bmi}
                  </p>
                  {activeEnquiry.quiz.signs && activeEnquiry.quiz.signs.length > 0 && (
                    <p className="text-[#12263F]">Signs: {activeEnquiry.quiz.signs.join(', ')}</p>
                  )}
                </div>
              )}

              {activeEnquiry.organization && (
                <p>
                  <span className="text-[#5B6B82]">Organisation:</span>{' '}
                  <span className="font-semibold text-[#12263F]">{activeEnquiry.organization}</span>
                  {activeEnquiry.gstin && ` · GSTIN: ${activeEnquiry.gstin}`}
                </p>
              )}

              {activeEnquiry.sellerDetails && (
                <div className="rounded-lg border border-[#DCE6F2] bg-white p-3 space-y-1">
                  <p className="font-semibold text-[#12263F]">Seller registration</p>
                  <p>
                    <span className="text-[#5B6B82]">Registered as:</span> {activeEnquiry.sellerDetails.registeredAs || '—'}
                    {' · '}
                    <span className="text-[#5B6B82]">Vendor type:</span> {activeEnquiry.sellerDetails.vendorType || '—'}
                  </p>
                  <p>
                    <span className="text-[#5B6B82]">Origin:</span> {activeEnquiry.sellerDetails.originCountry || '—'}
                    {activeEnquiry.sellerDetails.contactPerson ? ` · Contact: ${activeEnquiry.sellerDetails.contactPerson}` : ''}
                  </p>
                  {activeEnquiry.sellerDetails.brands && activeEnquiry.sellerDetails.brands.length > 0 && (
                    <p>
                      <span className="text-[#5B6B82]">Brands:</span>{' '}
                      {activeEnquiry.sellerDetails.brands
                        .map((b) => (b.country ? `${b.name} (${b.country})` : b.name))
                        .join(', ')}
                    </p>
                  )}
                  {activeEnquiry.sellerDetails.categories && activeEnquiry.sellerDetails.categories.length > 0 && (
                    <p>
                      <span className="text-[#5B6B82]">Categories:</span> {activeEnquiry.sellerDetails.categories.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {activeEnquiry.productsSummary && (
                <p>
                  <span className="text-[#5B6B82]">Equipment required:</span>{' '}
                  <span className="font-semibold text-[#12263F]">{activeEnquiry.productsSummary}</span>
                </p>
              )}
              {(activeEnquiry.estimatedBudget || activeEnquiry.timeline) && (
                <p>
                  <span className="text-[#5B6B82]">Budget / Timeline:</span>{' '}
                  <span className="font-semibold text-[#12263F]">
                    {activeEnquiry.estimatedBudget || '—'} · {activeEnquiry.timeline || '—'}
                  </span>
                </p>
              )}
              {activeEnquiry.subject && (
                <p>
                  <span className="text-[#5B6B82]">Subject:</span>{' '}
                  <span className="font-semibold text-[#12263F]">{activeEnquiry.subject}</span>
                </p>
              )}
              <div className="pt-2 border-t border-[#DCE6F2]">
                <span className="text-[#5B6B82] block mb-1">Message:</span>
                <p className="text-[#12263F] leading-relaxed whitespace-pre-line">{activeEnquiry.message || '—'}</p>
              </div>
              {activeEnquiry.sourcePage && (
                <p className="text-[11px] text-[#5B6B82]">Source page: {activeEnquiry.sourcePage}</p>
              )}
            </div>

            {/* Assignment & Follow-up */}
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-2">
                <h4 className="text-sm font-semibold text-[#12263F]">Follow-up &amp; Assignment</h4>
                {isDirty ? (
                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Unsaved changes
                  </span>
                ) : (
                  <span className="text-[11px] text-[#5B6B82]">All changes saved</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Status">
                  <select
                    disabled={saving || !canEdit}
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as EnquiryStatus)}
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Assign to Staff">
                  <select
                    disabled={saving || !canEdit}
                    value={draftAssignedTo}
                    onChange={(e) => setDraftAssignedTo(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Unassigned</option>
                    {activeEnquiry.assignedStaffId && !staff.some((s) => s.id === activeEnquiry.assignedStaffId) && (
                      <option value={activeEnquiry.assignedStaffId}>{activeEnquiry.assignedStaffName}</option>
                    )}
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Next Follow-up Date">
                  <input
                    type="date"
                    disabled={saving || !canEdit}
                    value={draftFollowUpDate}
                    onChange={(e) => setDraftFollowUpDate(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>

              {canEdit && (
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveEnquiry}
                    disabled={saving || !isDirty}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Notes History */}
            <div className="space-y-3 pt-2 border-t border-[#DCE6F2]">
              <h4 className="text-sm font-semibold text-[#12263F]">Follow-up Notes History</h4>
              {canEdit ? (
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Log call outcome, quotation details, or next steps..."
                    className={textareaClass}
                  />
                  <button
                    type="submit"
                    disabled={saving || !noteInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Add Note
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[#5B6B82]">
                  You can view this enquiry. Updating it needs the Enquiries → Edit permission.
                </p>
              )}

              <div className="space-y-2">
                {activeEnquiry.notes.length === 0 ? (
                  <p className="text-xs text-[#5B6B82]">No notes recorded yet.</p>
                ) : (
                  activeEnquiry.notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3.5 py-2.5 text-xs">
                      <div className="flex justify-between gap-2 text-[#5B6B82] mb-1">
                        <span className="font-semibold text-[#12263F]">{n.author}</span>
                        <span className="tabular-nums">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="text-[#12263F] whitespace-pre-line">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
