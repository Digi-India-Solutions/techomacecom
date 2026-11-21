import type {
  Order,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  ReturnRequest,
} from '@/types/admin';
import { adminFetch, mockDelay } from './client';
import { PRODUCT_IMAGES } from './mockData';

let ordersStore: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-2026-8841',
    customerId: 'cust-1',
    customerName: 'Apex Dental Studio',
    customerEmail: 'procurement@apexdental.in',
    customerPhone: '+91 98451 22109',
    shippingAddress: {
      name: 'Dr. Raghavendra Rao — Apex Dental Studio',
      phone: '+91 98451 22109',
      line1: 'Plot 42, 100 Feet Road, Indiranagar',
      line2: 'Near Metro Station',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    billingAddress: {
      name: 'Apex Dental Studio Pvt Ltd',
      phone: '+91 98451 22109',
      line1: 'Plot 42, 100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    gstDetails: {
      companyName: 'Apex Dental Studio Pvt Ltd',
      gstin: '29AABCA4821K1Z5',
    },
    items: [
      {
        id: 'oi-1',
        productId: 'prod-dental-chair',
        productName: 'DentaLux 5000 Electromechanical Dental Chair Unit',
        variantName: 'Navy Upholstery / Top Delivery',
        sku: 'BDM-DNT-5000-NVT',
        imageUrl: PRODUCT_IMAGES.dentalChair,
        qty: 1,
        unitPrice: 165179,
        gstPercent: 12,
        gstAmount: 19821,
        lineTotal: 185000,
      },
      {
        id: 'oi-2',
        productId: 'prod-wheelchair',
        productName: 'Karma ErgoLite Ultra-Light Folding Wheelchair',
        variantName: '16" Seat Width',
        sku: 'BDM-WCH-EL16',
        imageUrl: PRODUCT_IMAGES.wheelchair,
        qty: 1,
        unitPrice: 14095,
        gstPercent: 5,
        gstAmount: 705,
        lineTotal: 14800,
      },
    ],
    subtotal: 179274,
    discount: 0,
    shippingCharge: 0,
    gstTotal: 20526,
    total: 199800,
    paymentMethod: 'EMI',
    paymentStatus: 'paid',
    razorpayPaymentId: 'pay_PK98a8210Lmx9Q',
    emiPlan: 'HDFC 12-Month No-Cost EMI (₹16,650/mo)',
    orderStatus: 'packed',
    timeline: [
      {
        id: 'tl-1',
        status: 'Order Placed',
        note: 'Prepaid via Razorpay EMI',
        actor: 'System',
        timestamp: '2026-11-17T08:15:00Z',
      },
      {
        id: 'tl-2',
        status: 'Confirmed',
        note: 'GSTIN verified for B2B Tax Invoice',
        actor: 'Rohan Malhotra',
        timestamp: '2026-11-17T08:30:00Z',
      },
      {
        id: 'tl-3',
        status: 'Packed',
        note: 'Wooden crate packed for freight pickup',
        actor: 'Vikram Singh',
        timestamp: '2026-11-17T09:45:00Z',
      },
    ],
    internalNotes: ['Schedule Bengaluru technician installation within 48 hrs of delivery.'],
    createdAt: '2026-11-17T08:15:00Z',
    updatedAt: '2026-11-17T09:45:00Z',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-2026-8840',
    customerId: 'cust-2',
    customerName: 'Rajeshwari Care Clinic',
    customerEmail: 'accounts@rajeshwaricare.com',
    customerPhone: '+91 98220 44180',
    shippingAddress: {
      name: 'Rajeshwari Care Clinic',
      phone: '+91 98220 44180',
      line1: '18, Prabhat Road, Deccan Gymkhana',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
    },
    billingAddress: {
      name: 'Rajeshwari Care Clinic',
      phone: '+91 98220 44180',
      line1: '18, Prabhat Road, Deccan Gymkhana',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
    },
    gstDetails: {
      companyName: 'Rajeshwari Healthcare LLP',
      gstin: '27AAECR9012B1Z2',
    },
    items: [
      {
        id: 'oi-3',
        productId: 'prod-oxy-5l',
        productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
        variantName: '5L Standard Edition',
        sku: 'BDM-OXY-5L-01-STD',
        imageUrl: PRODUCT_IMAGES.oxygenConcentrator,
        qty: 2,
        unitPrice: 35625,
        gstPercent: 12,
        gstAmount: 8550,
        lineTotal: 79800,
      },
    ],
    subtotal: 71250,
    discount: 2000,
    couponCode: 'CLINIC2000',
    shippingCharge: 500,
    gstTotal: 8550,
    total: 78300,
    paymentMethod: 'Razorpay',
    paymentStatus: 'paid',
    razorpayPaymentId: 'pay_PK97x1028Bvw4A',
    orderStatus: 'confirmed',
    timeline: [
      {
        id: 'tl-21',
        status: 'Order Placed',
        note: 'Paid via Razorpay UPI',
        actor: 'System',
        timestamp: '2026-11-17T06:40:00Z',
      },
      {
        id: 'tl-22',
        status: 'Confirmed',
        note: 'Inventory allocated at Okhla Hub',
        actor: 'Priya Nair',
        timestamp: '2026-11-17T07:10:00Z',
      },
    ],
    internalNotes: [],
    createdAt: '2026-11-17T06:40:00Z',
    updatedAt: '2026-11-17T07:10:00Z',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-2026-8839',
    customerId: 'cust-3',
    customerName: 'Nitin Kapoor',
    customerPhone: '+91 98111 77820',
    customerEmail: 'nitin.kapoor82@gmail.com',
    shippingAddress: {
      name: 'Nitin Kapoor',
      phone: '+91 98111 77820',
      line1: 'B-24, Greater Kailash Part 1',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110048',
    },
    billingAddress: {
      name: 'Nitin Kapoor',
      phone: '+91 98111 77820',
      line1: 'B-24, Greater Kailash Part 1',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110048',
    },
    items: [
      {
        id: 'oi-4',
        productId: 'prod-oxy-5l',
        productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
        variantName: '5L Standard Edition',
        sku: 'BDM-OXY-5L-01-STD',
        imageUrl: PRODUCT_IMAGES.oxygenConcentrator,
        qty: 1,
        unitPrice: 37946,
        gstPercent: 12,
        gstAmount: 4554,
        lineTotal: 42500,
      },
    ],
    subtotal: 37946,
    discount: 0,
    shippingCharge: 0,
    gstTotal: 4554,
    total: 42500,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    orderStatus: 'new',
    timeline: [
      {
        id: 'tl-31',
        status: 'Order Placed',
        note: 'Cash on Delivery requested — IVR confirmation pending',
        actor: 'System',
        timestamp: '2026-11-16T19:10:00Z',
      },
    ],
    internalNotes: ['Call customer before dispatch to verify COD readiness.'],
    createdAt: '2026-11-16T19:10:00Z',
    updatedAt: '2026-11-16T19:10:00Z',
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-2026-8838',
    customerId: 'cust-4',
    customerName: 'LifeLine Diagnostics',
    customerEmail: 'admin@lifelinedx.in',
    customerPhone: '+91 97011 55200',
    shippingAddress: {
      name: 'LifeLine Diagnostics Center',
      phone: '+91 97011 55200',
      line1: 'Road No. 12, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
    billingAddress: {
      name: 'LifeLine Diagnostics Center',
      phone: '+91 97011 55200',
      line1: 'Road No. 12, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
    items: [
      {
        id: 'oi-5',
        productId: 'prod-patient-monitor',
        productName: 'MediCore Med-Vitals 7000 5-Para Patient Monitor',
        variantName: '5-Para Standard',
        sku: 'BDM-MON-7000-5P',
        imageUrl: PRODUCT_IMAGES.patientMonitor,
        qty: 2,
        unitPrice: 29018,
        gstPercent: 12,
        gstAmount: 6964,
        lineTotal: 65000,
      },
    ],
    subtotal: 58036,
    discount: 0,
    shippingCharge: 0,
    gstTotal: 6964,
    total: 65000,
    paymentMethod: 'Razorpay',
    paymentStatus: 'paid',
    razorpayPaymentId: 'pay_PK91z9923Npq7D',
    orderStatus: 'shipped',
    shipment: {
      courier: 'BlueDart Air Express',
      awb: 'BD778492018IN',
      trackingUrl: 'https://shiprocket.co/tracking/BD778492018IN',
      weightKg: 9.4,
      lengthCm: 42,
      widthCm: 34,
      heightCm: 36,
      shippedAt: '2026-11-16T16:30:00Z',
    },
    timeline: [
      {
        id: 'tl-41',
        status: 'Order Placed',
        note: 'Paid via Razorpay NetBanking',
        actor: 'System',
        timestamp: '2026-11-16T14:22:00Z',
      },
      {
        id: 'tl-42',
        status: 'Shipped',
        note: 'AWB BD778492018IN generated via Shiprocket',
        actor: 'Vikram Singh',
        timestamp: '2026-11-16T16:30:00Z',
      },
    ],
    internalNotes: [],
    createdAt: '2026-11-16T14:22:00Z',
    updatedAt: '2026-11-16T16:30:00Z',
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-2026-8837',
    customerId: 'cust-5',
    customerName: 'Ananya Sharma',
    customerEmail: 'ananya.sharma@outlook.com',
    customerPhone: '+91 98207 61209',
    shippingAddress: {
      name: 'Ananya Sharma',
      phone: '+91 98207 61209',
      line1: '702, Sea Breeze Residency, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    },
    billingAddress: {
      name: 'Ananya Sharma',
      phone: '+91 98207 61209',
      line1: '702, Sea Breeze Residency, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    },
    items: [
      {
        id: 'oi-6',
        productId: 'prod-wheelchair',
        productName: 'Karma ErgoLite Ultra-Light Folding Wheelchair',
        variantName: '18" Seat Width',
        sku: 'BDM-WCH-EL18',
        imageUrl: PRODUCT_IMAGES.wheelchair,
        qty: 1,
        unitPrice: 14476,
        gstPercent: 5,
        gstAmount: 724,
        lineTotal: 15200,
      },
    ],
    subtotal: 14476,
    discount: 0,
    shippingCharge: 0,
    gstTotal: 724,
    total: 15200,
    paymentMethod: 'Razorpay',
    paymentStatus: 'paid',
    razorpayPaymentId: 'pay_PK88p1190Klm2W',
    orderStatus: 'delivered',
    shipment: {
      courier: 'Delhivery Surface',
      awb: 'DLV409281723',
      trackingUrl: 'https://shiprocket.co/tracking/DLV409281723',
      weightKg: 12.2,
      lengthCm: 92,
      widthCm: 34,
      heightCm: 89,
      shippedAt: '2026-11-14T11:00:00Z',
    },
    timeline: [
      {
        id: 'tl-51',
        status: 'Order Placed',
        note: 'Paid via Razorpay Card',
        actor: 'System',
        timestamp: '2026-11-13T17:10:00Z',
      },
      {
        id: 'tl-52',
        status: 'Delivered',
        note: 'POD signed by recipient',
        actor: 'Shiprocket Webhook',
        timestamp: '2026-11-15T11:05:00Z',
      },
    ],
    internalNotes: [],
    createdAt: '2026-11-13T17:10:00Z',
    updatedAt: '2026-11-15T11:05:00Z',
  },
];

let returnsStore: ReturnRequest[] = [
  {
    id: 'ret-1',
    returnNumber: 'RMA-2026-104',
    orderId: 'ord-5',
    orderNumber: 'ORD-2026-8837',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98207 61209',
    paymentMethod: 'Razorpay',
    items: [
      {
        productName: 'Karma ErgoLite Ultra-Light Folding Wheelchair (18")',
        sku: 'BDM-WCH-EL18',
        qty: 1,
        refundEligibleAmount: 15200,
      },
    ],
    reason: 'Wrong seat width ordered (need 16" instead of 18")',
    customerNote: 'Box opened carefully; wheelchair unused indoors. Would like refund so I can order 16".',
    photos: [PRODUCT_IMAGES.wheelchair],
    status: 'requested',
    refundHistory: [],
    createdAt: '2026-11-16T11:20:00Z',
  },
  {
    id: 'ret-2',
    returnNumber: 'RMA-2026-103',
    orderId: 'ord-3',
    orderNumber: 'ORD-2026-8839',
    customerName: 'Meenakshi Iyer',
    customerPhone: '+91 98401 33912',
    paymentMethod: 'COD',
    items: [
      {
        productName: 'MedixPulse 5L Stationary Oxygen Concentrator',
        sku: 'BDM-OXY-5L-01-STD',
        qty: 1,
        refundEligibleAmount: 42500,
      },
    ],
    reason: 'Transit dent on lower side louver',
    customerNote: 'Observed dent when unboxing; device powers on but requesting replacement/refund.',
    photos: [PRODUCT_IMAGES.oxygenConcentrator],
    status: 'received',
    adminNote: 'Approved for pickup; unit arrived at Okhla warehouse and verified.',
    pickupDate: '2026-11-14',
    pickupCourier: 'BlueDart Reverse',
    bankDetails: {
      accountHolder: 'Meenakshi Iyer',
      accountNumber: 'XXXX XXXX 4921',
      ifsc: 'HDFC0001204',
    },
    refundHistory: [],
    createdAt: '2026-11-12T09:15:00Z',
  },
];

export async function listOrders(filters?: {
  search?: string;
  status?: 'all' | OrderStatus;
  paymentMethod?: 'all' | OrderPaymentMethod;
  paymentStatus?: 'all' | OrderPaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Order[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') params.set('paymentMethod', filters.paymentMethod);
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') params.set('paymentStatus', filters.paymentStatus);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);

    const qs = params.toString();
    const { data } = await adminFetch<Order[]>(`/admin/orders${qs ? `?${qs}` : ''}`);
    return data;
  } catch (err) {
    console.warn('Falling back to local orders store:', err);
    await mockDelay(130);
    let list = [...ordersStore];

    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          o.items.some((it) => it.sku.toLowerCase().includes(q))
      );
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((o) => o.orderStatus === filters.status);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      list = list.filter((o) => o.paymentMethod === filters.paymentMethod);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      list = list.filter((o) => o.paymentStatus === filters.paymentStatus);
    }
    if (filters?.dateFrom) {
      list = list.filter((o) => o.createdAt.slice(0, 10) >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      list = list.filter((o) => o.createdAt.slice(0, 10) <= filters.dateTo!);
    }

    return structuredClone(list);
  }
}

export async function getAllOrdersForCounts(): Promise<Order[]> {
  try {
    const { data } = await adminFetch<Order[]>('/admin/orders');
    return data;
  } catch {
    return structuredClone(ordersStore);
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const { data } = await adminFetch<Order>(`/admin/orders/${id}`);
    return data;
  } catch {
    await mockDelay(100);
    const found = ordersStore.find((o) => o.id === id);
    return found ? structuredClone(found) : null;
  }
}

export async function updateOrderStatus(params: {
  id: string;
  status: OrderStatus;
  actor: string;
  note?: string;
}): Promise<Order> {
  try {
    const { data } = await adminFetch<Order>(`/admin/orders/${params.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: params.status, note: params.note }),
    });
    return data;
  } catch {
    await mockDelay(160);
    const existing = ordersStore.find((o) => o.id === params.id);
    if (!existing) throw new Error('Order not found');

    const now = new Date().toISOString();
    const isCancelPrepaid =
      params.status === 'cancelled' && existing.paymentStatus === 'paid';

    const updated: Order = {
      ...existing,
      orderStatus: params.status,
      paymentStatus: isCancelPrepaid ? 'refunded' : existing.paymentStatus,
      cancelReason: params.status === 'cancelled' ? params.note : existing.cancelReason,
      updatedAt: now,
      timeline: [
        ...existing.timeline,
        {
          id: `tl-${Date.now()}`,
          status: params.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          note: isCancelPrepaid
            ? `${params.note || 'Cancelled by admin'} · Auto-refund triggered via ${existing.paymentMethod}`
            : params.note || `Marked as ${params.status}`,
          actor: params.actor,
          timestamp: now,
        },
      ],
    };

    ordersStore = ordersStore.map((o) => (o.id === params.id ? updated : o));
    return structuredClone(updated);
  }
}

export async function createOrderShipment(params: {
  id: string;
  courier: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actor: string;
}): Promise<Order> {
  try {
    const { data } = await adminFetch<Order>(`/admin/orders/${params.id}/shipment`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  } catch {
    await mockDelay(220);
    const existing = ordersStore.find((o) => o.id === params.id);
    if (!existing) throw new Error('Order not found');

    const awb = `SR${Math.floor(100000000 + Math.random() * 900000000)}`;
    const now = new Date().toISOString();

    const updated: Order = {
      ...existing,
      orderStatus: 'shipped',
      updatedAt: now,
      shipment: {
        courier: params.courier,
        awb,
        trackingUrl: `https://shiprocket.co/tracking/${awb}`,
        weightKg: params.weightKg,
        lengthCm: params.lengthCm,
        widthCm: params.widthCm,
        heightCm: params.heightCm,
        shippedAt: now,
      },
      timeline: [
        ...existing.timeline,
        {
          id: `tl-${Date.now()}`,
          status: 'Shipped',
          note: `Shiprocket AWB ${awb} via ${params.courier}`,
          actor: params.actor,
          timestamp: now,
        },
      ],
    };

    ordersStore = ordersStore.map((o) => (o.id === params.id ? updated : o));
    return structuredClone(updated);
  }
}

export async function addOrderInternalNote(id: string, note: string): Promise<Order> {
  try {
    const { data } = await adminFetch<Order>(`/admin/orders/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    return data;
  } catch {
    await mockDelay(100);
    const existing = ordersStore.find((o) => o.id === id);
    if (!existing) throw new Error('Order not found');
    const updated: Order = {
      ...existing,
      internalNotes: [note, ...existing.internalNotes],
      updatedAt: new Date().toISOString(),
    };
    ordersStore = ordersStore.map((o) => (o.id === id ? updated : o));
    return structuredClone(updated);
  }
}

export async function bulkMarkOrdersPacked(ids: string[], actor: string): Promise<void> {
  try {
    await adminFetch('/admin/orders/bulk-packed', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  } catch {
    await mockDelay(180);
    const now = new Date().toISOString();
    ordersStore = ordersStore.map((o) =>
      ids.includes(o.id) && (o.orderStatus === 'new' || o.orderStatus === 'confirmed')
        ? {
            ...o,
            orderStatus: 'packed',
            updatedAt: now,
            timeline: [
              ...o.timeline,
              {
                id: `tl-${Date.now()}-${o.id}`,
                status: 'Packed',
                note: 'Bulk marked packed',
                actor,
                timestamp: now,
              },
            ],
          }
        : o
    );
  }
}

// --- RETURNS & REFUNDS ---
export async function listReturnRequests(): Promise<ReturnRequest[]> {
  try {
    return await adminGet<ReturnRequest[]>('/returns');
  } catch {
    return structuredClone(returnsStore);
  }
}

export async function updateReturnRequest(params: {
  id: string;
  status: ReturnRequest['status'];
  adminNote?: string;
  pickupDate?: string;
  pickupCourier?: string;
}): Promise<ReturnRequest> {
  try {
    return await adminPatch<ReturnRequest>(`/returns/${encodeURIComponent(params.id)}/status`, params);
  } catch {
    const existing = returnsStore.find((r) => r.id === params.id);
    if (!existing) throw new Error('Return request not found');
    const updated: ReturnRequest = {
      ...existing,
      status: params.status,
      adminNote: params.adminNote ?? existing.adminNote,
      pickupDate: params.pickupDate ?? existing.pickupDate,
      pickupCourier: params.pickupCourier ?? existing.pickupCourier,
    };
    returnsStore = returnsStore.map((r) => (r.id === params.id ? updated : r));
    return structuredClone(updated);
  }
}

export async function processReturnRefund(params: {
  id: string;
  amount: number;
  method: 'Razorpay' | 'Bank Transfer (NEFT/IMPS)';
  reference: string;
  processedBy: string;
}): Promise<ReturnRequest> {
  try {
    return await adminPost<ReturnRequest>(`/returns/${encodeURIComponent(params.id)}/refund`, params);
  } catch {
    const existing = returnsStore.find((r) => r.id === params.id);
    if (!existing) throw new Error('Return request not found');

    const updated: ReturnRequest = {
      ...existing,
      status: 'refunded',
      refundHistory: [
        {
          id: `ref-${Date.now()}`,
          amount: params.amount,
          method: params.method,
          reference: params.reference || `REF-${Date.now().toString().slice(-6)}`,
          processedBy: params.processedBy,
          processedAt: new Date().toISOString(),
        },
        ...existing.refundHistory,
      ],
    };

    returnsStore = returnsStore.map((r) => (r.id === params.id ? updated : r));
    return structuredClone(updated);
  }
}
