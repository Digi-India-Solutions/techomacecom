import type { CustomerRecord, CustomerStatus } from '@/types/admin';
import { adminGet, adminPatch, adminPost, mockDelay } from './client';

let customersStore: CustomerRecord[] = [
  {
    id: 'cust-1',
    name: 'Apex Dental Studio',
    mobile: '+91 98451 22109',
    email: 'procurement@apexdental.in',
    city: 'Bengaluru',
    state: 'Karnataka',
    ordersCount: 4,
    rentalsCount: 0,
    totalSpent: 412800,
    joinedAt: '2026-03-14',
    status: 'active',
    addresses: [
      {
        name: 'Dr. Raghavendra Rao — Apex Dental Studio',
        phone: '+91 98451 22109',
        line1: 'Plot 42, 100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
    ],
    gstDetails: {
      companyName: 'Apex Dental Studio Pvt Ltd',
      gstin: '29AABCA4821K1Z5',
    },
    notes: ['Key B2B dental chain client; prefers 12-month no-cost EMI or NEFT invoice.'],
  },
  {
    id: 'cust-2',
    name: 'Rajeshwari Care Clinic',
    mobile: '+91 98220 44180',
    email: 'accounts@rajeshwaricare.com',
    city: 'Pune',
    state: 'Maharashtra',
    ordersCount: 3,
    rentalsCount: 1,
    totalSpent: 164500,
    joinedAt: '2026-05-02',
    status: 'active',
    addresses: [
      {
        name: 'Rajeshwari Care Clinic',
        phone: '+91 98220 44180',
        line1: '18, Prabhat Road, Deccan Gymkhana',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
      },
    ],
    gstDetails: {
      companyName: 'Rajeshwari Healthcare LLP',
      gstin: '27AAECR9012B1Z2',
    },
    notes: [],
  },
  {
    id: 'cust-5',
    name: 'Ananya Sharma',
    mobile: '+91 98207 61209',
    email: 'ananya.sharma@outlook.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    ordersCount: 2,
    rentalsCount: 0,
    totalSpent: 28400,
    joinedAt: '2026-09-18',
    status: 'active',
    addresses: [
      {
        name: 'Ananya Sharma',
        phone: '+91 98207 61209',
        line1: '702, Sea Breeze Residency, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      },
    ],
    notes: [],
  },
  {
    id: 'cust-7',
    name: 'Arvind Khanna',
    mobile: '+91 98112 44019',
    email: 'arvind.khanna@yahoo.in',
    city: 'Gurugram',
    state: 'Haryana',
    ordersCount: 1,
    rentalsCount: 2,
    totalSpent: 32800,
    joinedAt: '2026-07-22',
    status: 'active',
    addresses: [
      {
        name: 'Arvind Khanna',
        phone: '+91 98112 44019',
        line1: 'House 19, Sector 45',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122003',
      },
    ],
    notes: ['Verified Aadhar & Doctor Rx on file.'],
  },
  {
    id: 'cust-8',
    name: 'Dr. Kavita Rao (Home ICU)',
    mobile: '+91 98450 22190',
    email: 'kavita.rao@medcare.in',
    city: 'New Delhi',
    state: 'Delhi',
    ordersCount: 1,
    rentalsCount: 1,
    totalSpent: 52600,
    joinedAt: '2026-08-11',
    status: 'active',
    addresses: [
      {
        name: 'Dr. Kavita Rao',
        phone: '+91 98450 22190',
        line1: '14, Defence Colony',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110024',
      },
    ],
    notes: [],
  },
  {
    id: 'cust-10',
    name: 'Karan Malhotra (Test Blocked)',
    mobile: '+91 98990 10203',
    email: 'karan.m.test@example.com',
    city: 'Noida',
    state: 'Uttar Pradesh',
    ordersCount: 1,
    rentalsCount: 0,
    totalSpent: 0,
    joinedAt: '2026-10-05',
    status: 'blocked',
    addresses: [],
    notes: ['Blocked due to repeated fake COD orders.'],
  },
];

export async function listCustomers(filters?: {
  search?: string;
  status?: 'all' | CustomerStatus;
  city?: string;
}): Promise<CustomerRecord[]> {
  let liveCustomers: CustomerRecord[] = [];
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.city && filters.city !== 'all') params.set('city', filters.city);
    const qs = params.toString();
    liveCustomers = await adminGet<CustomerRecord[]>(`/admin/customers${qs ? `?${qs}` : ''}`);
  } catch (err) {
    console.warn('Falling back to local customers store:', err);
  }

  // Combine live customers from PostgreSQL (first) with mock customers
  const liveEmails = new Set(liveCustomers.map((c) => c.email.toLowerCase()).filter(Boolean));
  const liveMobiles = new Set(liveCustomers.map((c) => c.mobile.replace(/\D/g, '')).filter(Boolean));

  let mockList = [...customersStore];
  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    mockList = mockList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }
  if (filters?.status && filters.status !== 'all') {
    mockList = mockList.filter((c) => c.status === filters.status);
  }
  if (filters?.city && filters.city !== 'all') {
    const filterCity = filters.city.toLowerCase();
    mockList = mockList.filter((c) => c.city.toLowerCase() === filterCity);
  }

  const combined = [...liveCustomers];
  for (const mock of mockList) {
    const mockMob = mock.mobile.replace(/\D/g, '');
    if (!liveEmails.has(mock.email.toLowerCase()) && !liveMobiles.has(mockMob)) {
      combined.push(mock);
    }
  }

  return combined;
}

export async function getCustomerById(id: string): Promise<CustomerRecord | null> {
  try {
    return await adminGet<CustomerRecord>(`/admin/customers/${encodeURIComponent(id)}`);
  } catch (err) {
    console.warn('Falling back to local customers store:', err);
    await mockDelay(100);
    const found = customersStore.find((c) => c.id === id);
    return found ? structuredClone(found) : null;
  }
}

export async function toggleCustomerBlock(id: string): Promise<CustomerRecord> {
  try {
    return await adminPatch<CustomerRecord>(`/admin/customers/${encodeURIComponent(id)}/status`);
  } catch (err) {
    console.warn('Falling back to local customers store:', err);
    await mockDelay(140);
    const existing = customersStore.find((c) => c.id === id);
    if (!existing) throw new Error('Customer not found');
    const nextStatus: CustomerStatus = existing.status === 'active' ? 'blocked' : 'active';
    const updated: CustomerRecord = { ...existing, status: nextStatus };
    customersStore = customersStore.map((c) => (c.id === id ? updated : c));
    return structuredClone(updated);
  }
}

export async function addCustomerNote(id: string, note: string): Promise<CustomerRecord> {
  try {
    return await adminPost<CustomerRecord>(`/admin/customers/${encodeURIComponent(id)}/notes`, { note });
  } catch (err) {
    console.warn('Falling back to local customers store:', err);
    await mockDelay(100);
    const existing = customersStore.find((c) => c.id === id);
    if (!existing) throw new Error('Customer not found');
    const updated: CustomerRecord = { ...existing, notes: [note, ...existing.notes] };
    customersStore = customersStore.map((c) => (c.id === id ? updated : c));
    return structuredClone(updated);
  }
}
