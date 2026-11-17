import type {
  KycDocStatus,
  RentalBooking,
  RentalDeductionLine,
  RentalStatus,
} from '@/types/admin';
import { mockDelay } from './client';
import { PRODUCT_IMAGES } from './mockData';
import { updateRentalUnit } from './rentalUnits';

let rentalsStore: RentalBooking[] = [
  {
    id: 'rnt-1',
    rentalNumber: 'RNT-2026-429',
    customerId: 'cust-6',
    customerName: 'Sunita Deshmukh',
    customerPhone: '+91 98230 19842',
    customerEmail: 'sunita.deshmukh@gmail.com',
    deliveryAddress: {
      name: 'Sunita Deshmukh',
      phone: '+91 98230 19842',
      line1: 'Flat 402, Silver Oak Apartments, Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    productId: 'prod-wheelchair',
    productName: 'Karma ErgoLite Ultra-Light Folding Wheelchair',
    productImage: PRODUCT_IMAGES.wheelchair,
    planType: 'monthly',
    planRate: 1600,
    startDate: '2026-11-18',
    endDate: '2026-12-18',
    status: 'pending_approval',
    depositAmount: 2000,
    depositStatus: 'held',
    amountPaid: 3900,
    kycStatus: 'pending',
    kycDocs: [
      {
        id: 'kyc-1',
        label: 'Aadhaar Front & Back',
        docType: 'Aadhaar Card',
        imageUrl: PRODUCT_IMAGES.wheelchair,
        status: 'pending',
        uploadedAt: '2026-11-17T07:20:00Z',
      },
      {
        id: 'kyc-2',
        label: 'Electricity Bill (Address Proof)',
        docType: 'Address Proof',
        imageUrl: PRODUCT_IMAGES.patientMonitor,
        status: 'pending',
        uploadedAt: '2026-11-17T07:22:00Z',
      },
    ],
    ledger: [
      {
        id: 'led-1',
        type: 'rent',
        description: 'Monthly Rental Plan (1 Month)',
        amount: 1600,
        status: 'paid',
        reference: 'pay_PK99r2301',
        date: '2026-11-17',
      },
      {
        id: 'led-2',
        type: 'deposit',
        description: 'Refundable Security Deposit',
        amount: 2000,
        status: 'paid',
        reference: 'pay_PK99r2301',
        date: '2026-11-17',
      },
      {
        id: 'led-3',
        type: 'delivery_charge',
        description: 'Delivery & Pickup Charge',
        amount: 300,
        status: 'paid',
        reference: 'pay_PK99r2301',
        date: '2026-11-17',
      },
    ],
    timeline: [
      {
        id: 'rtl-1',
        event: 'Rental Booking Created',
        actor: 'Customer Checkout',
        note: 'Paid ₹3,900 via Razorpay UPI; uploaded 2 KYC documents',
        timestamp: '2026-11-17T07:25:00Z',
      },
    ],
    internalNotes: ['Customer requested afternoon delivery slot (2 PM – 5 PM).'],
    createdAt: '2026-11-17T07:25:00Z',
  },
  {
    id: 'rnt-2',
    rentalNumber: 'RNT-2026-412',
    customerId: 'cust-7',
    customerName: 'Arvind Khanna',
    customerPhone: '+91 98112 44019',
    customerEmail: 'arvind.khanna@yahoo.in',
    deliveryAddress: {
      name: 'Arvind Khanna',
      phone: '+91 98112 44019',
      line1: 'House 19, Sector 45',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122003',
    },
    productId: 'prod-oxy-5l',
    productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
    productImage: PRODUCT_IMAGES.oxygenConcentrator,
    planType: 'monthly',
    planRate: 4500,
    startDate: '2026-10-21',
    endDate: '2026-11-21',
    status: 'extension_requested',
    assignedUnitId: 'ru-1',
    assignedUnitCode: 'RU-OXY-001',
    assignedUnitSerial: 'MP5L-2026-88410',
    depositAmount: 5000,
    depositStatus: 'held',
    amountPaid: 10000,
    kycStatus: 'approved',
    kycDocs: [
      {
        id: 'kyc-21',
        label: 'Aadhaar Card',
        docType: 'Aadhaar Card',
        imageUrl: PRODUCT_IMAGES.oxygenConcentrator,
        status: 'approved',
        uploadedAt: '2026-10-20T10:00:00Z',
      },
      {
        id: 'kyc-22',
        label: 'Pulmonologist Prescription',
        docType: 'Doctor Prescription',
        imageUrl: PRODUCT_IMAGES.patientMonitor,
        status: 'approved',
        uploadedAt: '2026-10-20T10:05:00Z',
      },
    ],
    shipment: {
      courier: 'Buy Denmed Van Delivery',
      awb: 'BDMV-GGN-9921',
      trackingUrl: 'https://shiprocket.co/tracking/BDMV-GGN-9921',
    },
    extensionRequest: {
      requestedEndDate: '2026-12-21',
      additionalAmount: 4500,
      paymentStatus: 'paid',
      approved: false,
    },
    ledger: [
      {
        id: 'led-21',
        type: 'rent',
        description: 'Month 1 Rent (21 Oct – 21 Nov)',
        amount: 4500,
        status: 'paid',
        reference: 'pay_PJ22k901',
        date: '2026-10-20',
      },
      {
        id: 'led-22',
        type: 'deposit',
        description: 'Refundable Security Deposit',
        amount: 5000,
        status: 'paid',
        reference: 'pay_PJ22k901',
        date: '2026-10-20',
      },
      {
        id: 'led-23',
        type: 'delivery_charge',
        description: 'Delivery & Setup',
        amount: 500,
        status: 'paid',
        reference: 'pay_PJ22k901',
        date: '2026-10-20',
      },
      {
        id: 'led-24',
        type: 'extension',
        description: 'Extension Request (+1 Month until 21 Dec)',
        amount: 4500,
        status: 'paid',
        reference: 'pay_PK98ext11',
        date: '2026-11-16',
      },
    ],
    timeline: [
      {
        id: 'rtl-21',
        event: 'KYC Approved & Unit Assigned',
        actor: 'Priya Nair',
        note: 'Assigned RU-OXY-001 (MP5L-2026-88410)',
        timestamp: '2026-10-20T12:15:00Z',
      },
      {
        id: 'rtl-22',
        event: 'Delivered & Installed',
        actor: 'Vikram Singh',
        note: 'Purity checked on site at 94%',
        timestamp: '2026-10-21T11:30:00Z',
      },
      {
        id: 'rtl-23',
        event: 'Extension Requested',
        actor: 'Arvind Khanna',
        note: 'Paid ₹4,500 for extension to 21 Dec 2026',
        timestamp: '2026-11-16T18:00:00Z',
      },
    ],
    internalNotes: ['Due in 4 days — approve paid extension request.'],
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'rnt-3',
    rentalNumber: 'RNT-2026-398',
    customerId: 'cust-8',
    customerName: 'Dr. Kavita Rao (Home ICU)',
    customerPhone: '+91 98450 22190',
    customerEmail: 'kavita.rao@medcare.in',
    deliveryAddress: {
      name: 'Dr. Kavita Rao',
      phone: '+91 98450 22190',
      line1: '14, Defence Colony',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110024',
    },
    productId: 'prod-icu-bed',
    productName: 'Paramount ProCare 5-Function Electric ICU Hospital Bed',
    productImage: PRODUCT_IMAGES.hospitalBed,
    planType: 'monthly',
    planRate: 6500,
    startDate: '2026-10-14',
    endDate: '2026-11-14',
    status: 'overdue',
    assignedUnitId: 'ru-3',
    assignedUnitCode: 'RU-BED-001',
    assignedUnitSerial: 'PMB5-2025-11904',
    depositAmount: 10000,
    depositStatus: 'held',
    amountPaid: 17700,
    kycStatus: 'approved',
    kycDocs: [
      {
        id: 'kyc-31',
        label: 'Aadhaar Card',
        docType: 'Aadhaar Card',
        imageUrl: PRODUCT_IMAGES.hospitalBed,
        status: 'approved',
        uploadedAt: '2026-10-13T09:00:00Z',
      },
    ],
    ledger: [
      {
        id: 'led-31',
        type: 'rent',
        description: 'Monthly ICU Bed Rental',
        amount: 6500,
        status: 'paid',
        reference: 'pay_PJ10m882',
        date: '2026-10-13',
      },
      {
        id: 'led-32',
        type: 'deposit',
        description: 'Security Deposit',
        amount: 10000,
        status: 'paid',
        reference: 'pay_PJ10m882',
        date: '2026-10-13',
      },
      {
        id: 'led-33',
        type: 'delivery_charge',
        description: 'Heavy Freight & Assembly',
        amount: 1200,
        status: 'paid',
        reference: 'pay_PJ10m882',
        date: '2026-10-13',
      },
    ],
    timeline: [
      {
        id: 'rtl-31',
        event: 'Rental Active',
        actor: 'Vikram Singh',
        note: 'Bed assembled at customer home',
        timestamp: '2026-10-14T14:00:00Z',
      },
      {
        id: 'rtl-32',
        event: 'Marked Overdue',
        actor: 'System',
        note: 'End date 14 Nov 2026 passed without return or extension payment',
        timestamp: '2026-11-15T00:05:00Z',
      },
    ],
    internalNotes: ['3 days overdue — send WhatsApp payment/pickup link.'],
    lastReminderSentAt: '2026-11-16T10:00:00Z',
    createdAt: '2026-10-13T09:00:00Z',
  },
  {
    id: 'rnt-4',
    rentalNumber: 'RNT-2026-389',
    customerId: 'cust-9',
    customerName: 'Ramesh Kulkarni',
    customerPhone: '+91 99104 33890',
    customerEmail: 'ramesh.kulkarni@gmail.com',
    deliveryAddress: {
      name: 'Ramesh Kulkarni',
      phone: '+91 99104 33890',
      line1: 'A-12, Vasant Kunj',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
    },
    productId: 'prod-oxy-5l',
    productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
    productImage: PRODUCT_IMAGES.oxygenConcentrator,
    planType: 'monthly',
    planRate: 4500,
    startDate: '2026-09-28',
    endDate: '2026-10-28',
    status: 'returned',
    assignedUnitId: 'ru-2',
    assignedUnitCode: 'RU-OXY-002',
    assignedUnitSerial: 'MP5L-2026-88411',
    depositAmount: 5000,
    depositStatus: 'held',
    amountPaid: 10000,
    kycStatus: 'approved',
    kycDocs: [],
    returnInfo: {
      pickupDate: '2026-10-30',
      receivedAt: '2026-10-30T17:00:00Z',
      inspectionCondition: 'needs_service',
      inspectionNotes: '2 extra rental days (₹700). Sieve bed inspection needed.',
      inspectionPhotos: [PRODUCT_IMAGES.oxygenConcentrator],
    },
    ledger: [
      {
        id: 'led-41',
        type: 'rent',
        description: 'Monthly Rent',
        amount: 4500,
        status: 'paid',
        date: '2026-09-28',
      },
      {
        id: 'led-42',
        type: 'deposit',
        description: 'Security Deposit',
        amount: 5000,
        status: 'paid',
        date: '2026-09-28',
      },
    ],
    timeline: [
      {
        id: 'rtl-41',
        event: 'Returned & Inspected',
        actor: 'Vikram Singh',
        note: 'Ready for deposit refund calculation',
        timestamp: '2026-10-30T17:30:00Z',
      },
    ],
    internalNotes: ['Deduct 2-day late extension ₹700 and refund ₹4,300 deposit.'],
    createdAt: '2026-09-28T09:00:00Z',
  },
];

export async function listRentals(filters?: {
  search?: string;
  status?: 'all' | RentalStatus;
  dueIn7Days?: boolean;
}): Promise<RentalBooking[]> {
  await mockDelay(130);
  let list = [...rentalsStore];

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.rentalNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.assignedUnitSerial && r.assignedUnitSerial.toLowerCase().includes(q))
    );
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters?.dueIn7Days) {
    const today = new Date('2026-11-17');
    const in7 = new Date('2026-11-24');
    list = list.filter((r) => {
      const end = new Date(r.endDate);
      return (
        (r.status === 'active' || r.status === 'extension_requested') &&
        end >= today &&
        end <= in7
      );
    });
  }

  return structuredClone(list);
}

export async function getAllRentalsForCounts(): Promise<RentalBooking[]> {
  return structuredClone(rentalsStore);
}

export async function getRentalById(id: string): Promise<RentalBooking | null> {
  await mockDelay(100);
  const found = rentalsStore.find((r) => r.id === id);
  return found ? structuredClone(found) : null;
}

export async function updateKycDocumentStatus(params: {
  rentalId: string;
  docId: string;
  status: KycDocStatus;
  reason?: string;
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(150);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  const docs = existing.kycDocs.map((d) =>
    d.id === params.docId
      ? { ...d, status: params.status, rejectionReason: params.reason }
      : d
  );

  const allApproved = docs.length > 0 && docs.every((d) => d.status === 'approved');
  const anyRejected = docs.some((d) => d.status === 'rejected');
  const anyReupload = docs.some((d) => d.status === 'reupload_requested');

  const overallKyc: KycDocStatus = allApproved
    ? 'approved'
    : anyRejected
      ? 'rejected'
      : anyReupload
        ? 'reupload_requested'
        : 'pending';

  const nextStatus: RentalStatus =
    allApproved && existing.status === 'pending_approval'
      ? 'approved'
      : existing.status;

  const updated: RentalBooking = {
    ...existing,
    kycDocs: docs,
    kycStatus: overallKyc,
    status: nextStatus,
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: `KYC ${params.status.replace('_', ' ')}`,
        actor: params.actor,
        note: params.reason || `Updated document status`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function assignRentalUnit(params: {
  rentalId: string;
  unitId: string;
  unitCode: string;
  serialNumber: string;
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(170);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  await updateRentalUnit(params.unitId, { status: 'reserved' });

  const updated: RentalBooking = {
    ...existing,
    assignedUnitId: params.unitId,
    assignedUnitCode: params.unitCode,
    assignedUnitSerial: params.serialNumber,
    status: existing.status === 'pending_approval' ? 'approved' : existing.status,
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Unit Assigned',
        actor: params.actor,
        note: `Assigned ${params.unitCode} (${params.serialNumber}) — unit marked Reserved`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function dispatchRentalShipment(params: {
  rentalId: string;
  courier: string;
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(180);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  if (existing.assignedUnitId) {
    await updateRentalUnit(existing.assignedUnitId, { status: 'in_transit' });
  }

  const awb = `SR-RNT-${Math.floor(100000 + Math.random() * 900000)}`;
  const updated: RentalBooking = {
    ...existing,
    status: 'dispatched',
    shipment: {
      courier: params.courier,
      awb,
      trackingUrl: `https://shiprocket.co/tracking/${awb}`,
    },
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Dispatched via Shiprocket',
        actor: params.actor,
        note: `AWB ${awb} (${params.courier}) — Unit In Transit`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function markRentalDelivered(rentalId: string, actor: string): Promise<RentalBooking> {
  await mockDelay(150);
  const existing = rentalsStore.find((r) => r.id === rentalId);
  if (!existing) throw new Error('Rental booking not found');

  if (existing.assignedUnitId) {
    await updateRentalUnit(existing.assignedUnitId, { status: 'with_customer' });
  }

  const updated: RentalBooking = {
    ...existing,
    status: 'active',
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Delivered & Rental Active',
        actor,
        note: 'Unit marked With Customer',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === rentalId ? updated : r));
  return structuredClone(updated);
}

export async function approveRentalExtension(params: {
  rentalId: string;
  newEndDate: string;
  paymentStatus: 'paid' | 'pending';
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(150);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  const updated: RentalBooking = {
    ...existing,
    endDate: params.newEndDate,
    status: 'active',
    extensionRequest: existing.extensionRequest
      ? {
          ...existing.extensionRequest,
          requestedEndDate: params.newEndDate,
          paymentStatus: params.paymentStatus,
          approved: true,
        }
      : {
          requestedEndDate: params.newEndDate,
          additionalAmount: existing.planRate,
          paymentStatus: params.paymentStatus,
          approved: true,
        },
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Extension Approved',
        actor: params.actor,
        note: `New end date: ${params.newEndDate} (Payment: ${params.paymentStatus})`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function scheduleRentalReturnPickup(params: {
  rentalId: string;
  pickupDate: string;
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(140);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  const updated: RentalBooking = {
    ...existing,
    status: 'return_scheduled',
    returnInfo: {
      ...existing.returnInfo,
      pickupDate: params.pickupDate,
    },
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Reverse Pickup Scheduled',
        actor: params.actor,
        note: `Pickup scheduled for ${params.pickupDate}`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function completeRentalReturnInspection(params: {
  rentalId: string;
  condition: 'good' | 'needs_service' | 'damaged';
  notes: string;
  photos: string[];
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(170);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  if (existing.assignedUnitId) {
    await updateRentalUnit(existing.assignedUnitId, {
      condition: params.condition,
      status: params.condition === 'good' ? 'available' : 'under_service',
    });
  }

  const updated: RentalBooking = {
    ...existing,
    status: 'returned',
    returnInfo: {
      pickupDate: existing.returnInfo?.pickupDate || new Date().toISOString().slice(0, 10),
      receivedAt: new Date().toISOString(),
      inspectionCondition: params.condition,
      inspectionNotes: params.notes,
      inspectionPhotos: params.photos,
    },
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Unit Received & Inspected',
        actor: params.actor,
        note: `Condition: ${params.condition.replace('_', ' ')} — unit inventory updated`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function refundRentalDeposit(params: {
  rentalId: string;
  deductions: RentalDeductionLine[];
  method: 'Razorpay' | 'Bank Transfer' | 'UPI';
  reference: string;
  actor: string;
}): Promise<RentalBooking> {
  await mockDelay(180);
  const existing = rentalsStore.find((r) => r.id === params.rentalId);
  if (!existing) throw new Error('Rental booking not found');

  const totalDeduction = params.deductions.reduce((acc, d) => acc + d.amount, 0);
  const netRefund = Math.max(0, existing.depositAmount - totalDeduction);
  const now = new Date().toISOString();

  const updated: RentalBooking = {
    ...existing,
    status: 'deposit_refunded',
    depositStatus: totalDeduction > 0 ? 'partial_refunded' : 'refunded',
    depositRefund: {
      deductions: params.deductions,
      netRefundAmount: netRefund,
      method: params.method,
      reference: params.reference || `DEP-${Date.now().toString().slice(-6)}`,
      refundedAt: now,
    },
    ledger: [
      ...existing.ledger,
      ...(totalDeduction > 0
        ? [
            {
              id: `led-ded-${Date.now()}`,
              type: 'deduction' as const,
              description: params.deductions.map((d) => d.reason).join(', '),
              amount: totalDeduction,
              status: 'paid' as const,
              date: now.slice(0, 10),
            },
          ]
        : []),
      {
        id: `led-ref-${Date.now()}`,
        type: 'refund',
        description: `Security Deposit Refund (${params.method})`,
        amount: netRefund,
        status: 'refunded',
        reference: params.reference,
        date: now.slice(0, 10),
      },
    ],
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: 'Deposit Refunded',
        actor: params.actor,
        note: `Refunded ₹${netRefund.toLocaleString('en-IN')} via ${params.method} (Ref: ${params.reference})`,
        timestamp: now,
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === params.rentalId ? updated : r));
  return structuredClone(updated);
}

export async function sendOverdueReminder(
  rentalId: string,
  channel: 'WhatsApp' | 'SMS',
  actor: string
): Promise<RentalBooking> {
  await mockDelay(120);
  const existing = rentalsStore.find((r) => r.id === rentalId);
  if (!existing) throw new Error('Rental booking not found');

  const now = new Date().toISOString();
  const updated: RentalBooking = {
    ...existing,
    lastReminderSentAt: now,
    timeline: [
      ...existing.timeline,
      {
        id: `rtl-${Date.now()}`,
        event: `${channel} Overdue Reminder Sent`,
        actor,
        note: `Sent to ${existing.customerPhone}`,
        timestamp: now,
      },
    ],
  };

  rentalsStore = rentalsStore.map((r) => (r.id === rentalId ? updated : r));
  return structuredClone(updated);
}

export async function addRentalInternalNote(rentalId: string, note: string): Promise<RentalBooking> {
  await mockDelay(90);
  const existing = rentalsStore.find((r) => r.id === rentalId);
  if (!existing) throw new Error('Rental booking not found');
  const updated: RentalBooking = {
    ...existing,
    internalNotes: [note, ...existing.internalNotes],
  };
  rentalsStore = rentalsStore.map((r) => (r.id === rentalId ? updated : r));
  return structuredClone(updated);
}
