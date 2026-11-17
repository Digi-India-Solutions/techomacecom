import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Eye,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import type {
  EnquiryCategory,
  EnquiryRecord,
  EnquiryStatus,
  StaffMember,
} from '@/types/admin';
import {
  addEnquiryNote,
  exportEnquiriesCsv,
  listEnquiries,
  updateEnquiry,
} from '@/lib/api/admin/enquiries';
import { listStaff } from '@/lib/api/admin/staff';
import { formatDateTime, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

const CATEGORY_TABS: { key: EnquiryCategory; label: string }[] = [
  { key: 'sleep_test', label: 'Sleep Test' },
  { key: 'bulk_b2b', label: 'Bulk / B2B Enquiry' },
  { key: 'contact', label: 'Contact Form' },
];

export function EnquiriesPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as 'all' | EnquiryStatus | null;

  const { user } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<EnquiryCategory>('sleep_test');
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>(
    initialStatus || 'all'
  );
  const [search, setSearch] = useState('');
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeEnquiry, setActiveEnquiry] = useState<EnquiryRecord | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, staffRows] = await Promise.all([
        listEnquiries({ category, status: statusFilter, search }),
        listStaff(),
      ]);
      setEnquiries(rows);
      setStaff(staffRows.filter((s) => s.status === 'active'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, statusFilter, search]);

  const handleFieldUpdate = async (
    patch: Partial<
      Pick<EnquiryRecord, 'status' | 'assignedStaffId' | 'assignedStaffName' | 'nextFollowUpDate'>
    >
  ) => {
    if (!activeEnquiry) return;
    setSaving(true);
    try {
      const updated = await updateEnquiry(activeEnquiry.id, patch);
      setActiveEnquiry(updated);
      setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      showToast({ title: 'Enquiry updated', variant: 'success' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiry || !noteInput.trim()) return;
    setSaving(true);
    try {
      const updated = await addEnquiryNote(
        activeEnquiry.id,
        user?.name || 'Admin',
        noteInput.trim()
      );
      setActiveEnquiry(updated);
      setEnquiries((prev) => prev.map((en) => (en.id === updated.id ? updated : en)));
      setNoteInput('');
      showToast({ title: 'Follow-up note added', variant: 'success' });
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
            <span className="font-mono text-xs font-semibold text-[#1D5FAF]">
              {e.enquiryNumber}
            </span>
            <p className="text-[11px] text-[#5B6B82] tabular-nums">
              {formatDateTime(e.createdAt)}
            </p>
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
              {e.mobile} · {e.city}
            </p>
          </div>
        ),
      },
      {
        key: 'details',
        header:
          category === 'sleep_test'
            ? 'Test Type & Preferred Date'
            : category === 'bulk_b2b'
              ? 'Clinic / Products & Qty'
              : 'Subject',
        render: (e) => {
          if (e.category === 'sleep_test') {
            return (
              <div className="text-xs">
                <p className="font-semibold text-[#12263F]">{e.testType}</p>
                <p className="text-[#5B6B82]">
                  Preferred: {e.preferredDate ? formatShortDate(e.preferredDate) : 'Flexible'}
                </p>
              </div>
            );
          }
          if (e.category === 'bulk_b2b') {
            return (
              <div className="text-xs max-w-xs">
                <p className="font-semibold text-[#12263F] truncate">{e.organization}</p>
                <p className="text-[#5B6B82] truncate">
                  {e.productsSummary} ({e.estimatedQty} units)
                </p>
              </div>
            );
          }
          return (
            <div className="text-xs max-w-xs">
              <p className="font-semibold text-[#12263F] truncate">{e.subject}</p>
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
        render: (e) => (
          <span className="text-xs text-[#12263F]">
            {e.assignedStaffName || 'Unassigned'}
          </span>
        ),
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Enquiries</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Manage home sleep apnea tests, institutional bulk quotes, and contact form leads.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportEnquiriesCsv(enquiries)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
        >
          <Download className="h-3.5 w-3.5 text-[#5B6B82]" />
          Export CSV
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE6F2] bg-white p-2">
        <div className="flex items-center gap-1">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategory(tab.key)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#1D5FAF] text-white'
                    : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | EnquiryStatus)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-1.5 text-xs font-medium text-[#12263F]"
          aria-label="Filter by enquiry status"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="follow_up">Follow-up</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <DataTable
        data={enquiries}
        columns={columns}
        getRowId={(e) => e.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search lead name, mobile, city, or clinic..."
        onRowClick={(e) => setActiveEnquiry(e)}
        emptyTitle="No enquiries in this category"
        emptyDescription="Switch enquiry tabs or clear your status filter."
      />

      {/* Enquiry Detail Drawer */}
      <Drawer
        open={Boolean(activeEnquiry)}
        onClose={() => setActiveEnquiry(null)}
        title={activeEnquiry ? `${activeEnquiry.enquiryNumber} — ${activeEnquiry.name}` : ''}
        subtitle={
          activeEnquiry
            ? `${activeEnquiry.city} · Received ${formatDateTime(activeEnquiry.createdAt)}`
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
                href={`https://wa.me/${activeEnquiry.mobile.replace(/[^0-9]/g, '')}`}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#5B6B82]">Email:</span>{' '}
                  <span className="font-medium text-[#12263F]">{activeEnquiry.email}</span>
                </div>
                <div>
                  <span className="text-[#5B6B82]">City:</span>{' '}
                  <span className="font-medium text-[#12263F]">{activeEnquiry.city}</span>
                </div>
              </div>
              {activeEnquiry.testType && (
                <p>
                  <span className="text-[#5B6B82]">Sleep Study Type:</span>{' '}
                  <span className="font-semibold text-[#12263F]">{activeEnquiry.testType}</span>
                  {activeEnquiry.preferredDate &&
                    ` (Preferred: ${formatShortDate(activeEnquiry.preferredDate)})`}
                </p>
              )}
              {activeEnquiry.organization && (
                <p>
                  <span className="text-[#5B6B82]">Organization:</span>{' '}
                  <span className="font-semibold text-[#12263F]">
                    {activeEnquiry.organization}
                  </span>
                  {activeEnquiry.gstin && ` · GSTIN: ${activeEnquiry.gstin}`}
                </p>
              )}
              {activeEnquiry.productsSummary && (
                <p>
                  <span className="text-[#5B6B82]">Requested Items:</span>{' '}
                  <span className="font-semibold text-[#12263F]">
                    {activeEnquiry.productsSummary}
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
                <p className="text-[#12263F] leading-relaxed">{activeEnquiry.message}</p>
              </div>
            </div>

            {/* Assignment & Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Status">
                <select
                  disabled={saving}
                  value={activeEnquiry.status}
                  onChange={(e) =>
                    handleFieldUpdate({ status: e.target.value as EnquiryStatus })
                  }
                  className={selectClass}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </FormField>

              <FormField label="Assign to Staff">
                <select
                  disabled={saving}
                  value={activeEnquiry.assignedStaffId || ''}
                  onChange={(e) => {
                    const selected = staff.find((s) => s.id === e.target.value);
                    handleFieldUpdate({
                      assignedStaffId: selected?.id,
                      assignedStaffName: selected?.name,
                    });
                  }}
                  className={selectClass}
                >
                  <option value="">Unassigned</option>
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
                  disabled={saving}
                  value={activeEnquiry.nextFollowUpDate || ''}
                  onChange={(e) =>
                    handleFieldUpdate({ nextFollowUpDate: e.target.value })
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            {/* Notes History */}
            <div className="space-y-3 pt-2 border-t border-[#DCE6F2]">
              <h4 className="text-sm font-semibold text-[#12263F]">Follow-up Notes History</h4>
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Log call outcome, quotation details, or next steps..."
                  className={textareaClass}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Add Note
                </button>
              </form>

              <div className="space-y-2">
                {activeEnquiry.notes.length === 0 ? (
                  <p className="text-xs text-[#5B6B82]">No notes recorded yet.</p>
                ) : (
                  activeEnquiry.notes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex justify-between text-[#5B6B82] mb-1">
                        <span className="font-semibold text-[#12263F]">{n.author}</span>
                        <span className="tabular-nums">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="text-[#12263F]">{n.text}</p>
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
