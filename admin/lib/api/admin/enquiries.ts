import type { EnquiryCategory, EnquiryRecord, EnquiryStatus } from '@/types/admin';
import { adminFetch, adminGet, adminPatch, adminPost, downloadCsv, type ListMeta } from './client';

/**
 * Enquiries — live data from the API (backend/src/modules/enquiries).
 *
 *   GET   /admin/enquiries            ?type=&status=&kind=&q=&customerId=&page=&limit=
 *   GET   /admin/enquiries/assignees  active staff for "Assign to"
 *   GET   /admin/enquiries/:id
 *   PATCH /admin/enquiries/:id        { status?, assignedTo?, nextFollowUpDate? }   (enquiries.edit)
 *   POST  /admin/enquiries/:id/notes  { note }                                     (enquiries.edit)
 *
 * Sources: sleep-test form / quiz → sleep_test · /bulk-enquiry → bulk ·
 * /contact → contact (kind contact_us) · /sell → contact (kind seller_registration).
 */

/** API row (enquiries/service.js → toAdminDto) */
interface ApiEnquiry {
  id: string;
  code: string;
  type: 'sleep_test' | 'bulk' | 'contact' | 'seller_registration';
  name: string;
  mobile: string;
  email: string;
  city: string;
  message: string;
  status: EnquiryStatus;
  sourcePage: string;
  testType: string | null;
  preferredDate: string | null;
  sellerDetails: EnquiryRecord['sellerDetails'];
  quiz: EnquiryRecord['quiz'];
  customerId: string | null;
  subject: string | null;
  organization: string | null;
  gstin: string | null;
  productsSummary: string | null;
  estimatedBudget: string | null;
  timeline: string | null;
  state: string | null;
  pincode: string | null;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  nextFollowUpDate: string | null;
  notes: { id: string; author: string; text: string; createdAt: string }[];
  createdAt: string;
}

const CATEGORY_TO_TYPE: Record<EnquiryCategory, 'sleep_test' | 'bulk' | 'contact'> = {
  sleep_test: 'sleep_test',
  bulk_b2b: 'bulk',
  contact: 'contact',
  seller_registration: 'contact',
};

const opt = <T>(v: T | null | undefined) => (v === null || v === undefined || v === '' ? undefined : v);

function toRecord(e: ApiEnquiry): EnquiryRecord {
  const category: EnquiryCategory =
    e.type === 'seller_registration'
      ? 'seller_registration'
      : e.type === 'sleep_test'
        ? 'sleep_test'
        : e.type === 'bulk'
          ? 'bulk_b2b'
          : 'contact';
  return {
    id: e.id,
    enquiryNumber: e.code,
    category,
    kind: e.type === 'seller_registration' ? 'seller_registration' : e.type === 'contact' ? 'contact_us' : e.type,
    name: e.name,
    mobile: e.mobile,
    email: e.email,
    city: e.city,
    testType: opt(e.testType),
    preferredDate: opt(e.preferredDate),
    organization: opt(e.organization),
    gstin: opt(e.gstin),
    productsSummary: opt(e.productsSummary),
    estimatedBudget: opt(e.estimatedBudget),
    timeline: opt(e.timeline),
    state: opt(e.state),
    pincode: opt(e.pincode),
    sourcePage: opt(e.sourcePage),
    quiz: e.quiz,
    sellerDetails: e.sellerDetails,
    subject: opt(e.subject),
    message: e.message,
    status: e.status,
    assignedStaffId: opt(e.assignedStaffId),
    assignedStaffName: opt(e.assignedStaffName),
    nextFollowUpDate: opt(e.nextFollowUpDate),
    notes: e.notes || [],
    createdAt: e.createdAt,
  };
}

export interface EnquiryFilters {
  category?: EnquiryCategory;
  status?: 'all' | EnquiryStatus;
  search?: string;
  /** Contact tab only: Contact Us messages vs seller registrations */
  kind?: 'all' | 'contact_us' | 'seller_registration';
  risk?: 'all' | 'low' | 'moderate' | 'high';
  customerId?: string;
  page?: number;
  limit?: number;
}

function query(f: EnquiryFilters = {}): string {
  const p = new URLSearchParams();
  if (f.category === 'seller_registration') {
    p.set('type', 'contact');
    p.set('kind', 'seller_registration');
  } else if (f.category === 'contact') {
    p.set('type', 'contact');
    p.set('kind', f.kind && f.kind !== 'all' ? f.kind : 'contact_us');
  } else if (f.category) {
    p.set('type', CATEGORY_TO_TYPE[f.category]);
    if (f.kind && f.kind !== 'all') p.set('kind', f.kind);
  }
  if (f.status && f.status !== 'all') p.set('status', f.status);
  if (f.risk && f.risk !== 'all') p.set('risk', f.risk);
  if (f.search?.trim()) p.set('q', f.search.trim().slice(0, 100));
  if (f.customerId) p.set('customerId', f.customerId);
  p.set('page', String(f.page || 1));
  p.set('limit', String(Math.min(f.limit || 50, 100)));
  return p.toString();
}

/** One page of enquiries + list meta (total, hasNextPage …). */
export async function listEnquiriesPage(filters: EnquiryFilters = {}): Promise<{ rows: EnquiryRecord[]; meta?: ListMeta }> {
  const { data, meta } = await adminFetch<ApiEnquiry[]>(`/admin/enquiries?${query(filters)}`);
  return { rows: data.map(toRecord), meta };
}

/** First page (max 100) — used by the customer detail page. */
export async function listEnquiries(filters: EnquiryFilters = {}): Promise<EnquiryRecord[]> {
  return (await listEnquiriesPage({ limit: 100, ...filters })).rows;
}

export async function getEnquiry(id: string): Promise<EnquiryRecord> {
  return toRecord(await adminGet<ApiEnquiry>(`/admin/enquiries/${encodeURIComponent(id)}`));
}

/** Active staff for the "Assign to" dropdown. */
export async function listAssignees(): Promise<{ id: string; name: string }[]> {
  return adminGet<{ id: string; name: string }[]>('/admin/enquiries/assignees');
}

export interface EnquiryPatch {
  status?: EnquiryStatus;
  /** staff id, or null to unassign */
  assignedTo?: string | null;
  /** 'YYYY-MM-DD', or '' to clear */
  nextFollowUpDate?: string;
}

/** Every change is also written as a timeline note on the server. */
export async function updateEnquiry(id: string, patch: EnquiryPatch): Promise<EnquiryRecord> {
  return toRecord(await adminPatch<ApiEnquiry>(`/admin/enquiries/${encodeURIComponent(id)}`, patch));
}

/** The author is the signed-in staff member (taken from the session on the server). */
export async function addEnquiryNote(id: string, text: string): Promise<EnquiryRecord> {
  return toRecord(await adminPost<ApiEnquiry>(`/admin/enquiries/${encodeURIComponent(id)}/notes`, { note: text }));
}

const CATEGORY_LABEL: Record<EnquiryCategory, string> = {
  sleep_test: 'Sleep test',
  bulk_b2b: 'Bulk / B2B',
  contact: 'Contact',
  seller_registration: 'Seller registration',
};

/** Downloads every enquiry matching the filters (all pages, not only the ones on screen). */
export async function exportEnquiriesCsv(filters: EnquiryFilters = {}): Promise<number> {
  const rows: EnquiryRecord[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await listEnquiriesPage({ ...filters, page, limit: 100 });
    rows.push(...res.rows);
    if (!res.meta?.hasNextPage) break;
  }
  downloadCsv(
    `buydenmed-enquiries-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      'Enquiry #', 'Type', 'Date', 'Name', 'Mobile', 'Email', 'City', 'Organisation', 'Details', 'Message',
      'Risk', 'Status', 'Assigned Staff', 'Follow-up', 'Source',
    ],
    rows.map((e) => [
      e.enquiryNumber,
      e.kind === 'seller_registration' ? 'Seller registration' : CATEGORY_LABEL[e.category],
      e.createdAt.slice(0, 10),
      e.name,
      e.mobile,
      e.email,
      e.city,
      e.organization || '',
      e.testType || e.productsSummary || e.subject || '',
      e.message,
      e.quiz?.risk || '',
      e.status,
      e.assignedStaffName || 'Unassigned',
      e.nextFollowUpDate || '',
      e.sourcePage || '',
    ])
  );
  return rows.length;
}
