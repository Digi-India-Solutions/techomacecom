import type { EnquiryCategory, EnquiryRecord, EnquiryStatus } from '@/types/admin';
import { downloadCsv, mockDelay } from './client';

let enquiriesStore: EnquiryRecord[] = [
  {
    id: 'enq-st-1',
    enquiryNumber: 'ENQ-9045',
    category: 'sleep_test',
    name: 'Rajiv Menon',
    mobile: '+91 98452 11092',
    email: 'rajiv.menon@gmail.com',
    city: 'Bengaluru',
    testType: 'Home Level-3 Sleep Study',
    preferredDate: '2026-11-19',
    message: 'Experiencing daytime fatigue & snoring; doctor advised Home Sleep Apnea Test.',
    status: 'new',
    assignedStaffId: 'usr-2',
    assignedStaffName: 'Priya Nair',
    nextFollowUpDate: '2026-11-18',
    notes: [
      {
        id: 'en-1',
        author: 'System',
        text: 'Lead captured from Sleep Test Landing Page.',
        createdAt: '2026-11-17T07:10:00Z',
      },
    ],
    createdAt: '2026-11-17T07:10:00Z',
  },
  {
    id: 'enq-st-2',
    enquiryNumber: 'ENQ-9043',
    category: 'sleep_test',
    name: 'Deepa Chawla',
    mobile: '+91 98114 55391',
    email: 'deepa.c@outlook.com',
    city: 'Gurugram',
    testType: 'CPAP Titration',
    preferredDate: '2026-11-20',
    message: 'Need auto-CPAP titration + mask fitting at home.',
    status: 'contacted',
    assignedStaffId: 'usr-3',
    assignedStaffName: 'Vikram Singh',
    nextFollowUpDate: '2026-11-18',
    notes: [
      {
        id: 'en-2',
        author: 'Vikram Singh',
        text: 'Spoke on call; explained ₹2,500 home titration package.',
        createdAt: '2026-11-16T16:40:00Z',
      },
    ],
    createdAt: '2026-11-16T14:20:00Z',
  },
  {
    id: 'enq-b2b-1',
    enquiryNumber: 'ENQ-9042',
    category: 'bulk_b2b',
    name: 'Dr. Siddharth Mehta',
    mobile: '+91 98204 55120',
    email: 'dr.mehta@smilecraftdental.in',
    city: 'Mumbai',
    organization: 'SmileCraft Multispecialty Dental',
    gstin: '27AAACS8129M1Z9',
    productsSummary: 'DentaLux 5000 Dental Chair × 4, AuraFlow 18B Autoclave × 2',
    estimatedQty: 6,
    message: 'Setting up new Andheri West 4-chair clinic. Need turnkey institutional quote with AMC.',
    status: 'new',
    assignedStaffId: 'usr-1',
    assignedStaffName: 'Rohan Malhotra',
    nextFollowUpDate: '2026-11-18',
    notes: [],
    createdAt: '2026-11-17T07:50:00Z',
  },
  {
    id: 'enq-b2b-2',
    enquiryNumber: 'ENQ-9039',
    category: 'bulk_b2b',
    name: 'Dr. Pooja Hegde',
    mobile: '+91 99001 44781',
    email: 'procurement@orthocarerehab.in',
    city: 'Hyderabad',
    organization: 'Orthocare Rehab Center',
    gstin: '36AABCO9120F1Z4',
    productsSummary: 'Karma ErgoLite Folding Wheelchair × 6',
    estimatedQty: 6,
    message: 'Requesting GST B2B proforma invoice for 6 wheelchairs.',
    status: 'follow_up',
    assignedStaffId: 'usr-2',
    assignedStaffName: 'Priya Nair',
    nextFollowUpDate: '2026-11-19',
    notes: [
      {
        id: 'en-3',
        author: 'Priya Nair',
        text: 'Shared 8% institutional discount quote via email.',
        createdAt: '2026-11-15T18:10:00Z',
      },
    ],
    createdAt: '2026-11-15T16:45:00Z',
  },
  {
    id: 'enq-con-1',
    enquiryNumber: 'ENQ-9041',
    category: 'contact',
    name: 'Farhan Siddiqui',
    mobile: '+91 98118 90234',
    email: 'farhan.s@gmail.com',
    city: 'New Delhi',
    subject: 'Urgent 3-month Home ICU setup',
    message: 'Need 5-Function Bed + 5-Para Patient Monitor + Oxygen Concentrator delivered today.',
    status: 'new',
    assignedStaffId: 'usr-2',
    assignedStaffName: 'Priya Nair',
    nextFollowUpDate: '2026-11-17',
    notes: [],
    createdAt: '2026-11-16T21:15:00Z',
  },
];

export async function listEnquiries(filters?: {
  category?: EnquiryCategory;
  status?: 'all' | EnquiryStatus;
  search?: string;
}): Promise<EnquiryRecord[]> {
  await mockDelay(120);
  let list = [...enquiriesStore];

  if (filters?.category) {
    list = list.filter((e) => e.category === filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((e) => e.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.mobile.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.enquiryNumber.toLowerCase().includes(q) ||
        (e.organization && e.organization.toLowerCase().includes(q))
    );
  }

  return structuredClone(list);
}

export async function updateEnquiry(
  id: string,
  patch: Partial<
    Pick<EnquiryRecord, 'status' | 'assignedStaffId' | 'assignedStaffName' | 'nextFollowUpDate'>
  >
): Promise<EnquiryRecord> {
  await mockDelay(130);
  const existing = enquiriesStore.find((e) => e.id === id);
  if (!existing) throw new Error('Enquiry not found');
  const updated: EnquiryRecord = { ...existing, ...patch };
  enquiriesStore = enquiriesStore.map((e) => (e.id === id ? updated : e));
  return structuredClone(updated);
}

export async function addEnquiryNote(
  id: string,
  author: string,
  text: string
): Promise<EnquiryRecord> {
  await mockDelay(110);
  const existing = enquiriesStore.find((e) => e.id === id);
  if (!existing) throw new Error('Enquiry not found');
  const updated: EnquiryRecord = {
    ...existing,
    notes: [
      { id: `en-${Date.now()}`, author, text, createdAt: new Date().toISOString() },
      ...existing.notes,
    ],
  };
  enquiriesStore = enquiriesStore.map((e) => (e.id === id ? updated : e));
  return structuredClone(updated);
}

export function exportEnquiriesCsv(list: EnquiryRecord[]): void {
  downloadCsv(
    `buydenmed-enquiries-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Enquiry #', 'Type', 'Date', 'Name', 'Mobile', 'City', 'Details', 'Status', 'Assigned Staff', 'Follow-up'],
    list.map((e) => [
      e.enquiryNumber,
      e.category,
      e.createdAt.slice(0, 10),
      e.name,
      e.mobile,
      e.city,
      e.testType || e.productsSummary || e.subject || e.message,
      e.status,
      e.assignedStaffName || 'Unassigned',
      e.nextFollowUpDate || '',
    ])
  );
}
