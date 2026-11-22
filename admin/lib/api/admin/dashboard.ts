import type {
  DashboardOverview,
  DateRangeValue,
  GlobalSearchResult,
  SalesTrendPoint,
} from '@/types/admin';
import { formatINR, mockDelay } from './client';
import {
  INITIAL_RECENT_ENQUIRIES,
  INITIAL_RECENT_ORDERS,
} from './mockData';
import { getProductsStore } from './legacyProductStore';
import { getStockItemsStore } from './inventory';
import { getRentalUnitsStore } from './rentalUnits';

const TREND_BY_PRESET: Record<string, SalesTrendPoint[]> = {
  today: [
    { date: '08:00', label: '08:00', sales: 42500, rentalRevenue: 6500, orders: 2 },
    { date: '10:00', label: '10:00', sales: 85000, rentalRevenue: 11200, orders: 4 },
    { date: '12:00', label: '12:00', sales: 199800, rentalRevenue: 14500, orders: 5 },
    { date: '14:00', label: '14:00', sales: 124000, rentalRevenue: 9800, orders: 3 },
    { date: '16:00', label: '16:00', sales: 168500, rentalRevenue: 16200, orders: 6 },
  ],
  '7d': [
    { date: '2026-11-11', label: '11 Nov', sales: 245000, rentalRevenue: 42000, orders: 9 },
    { date: '2026-11-12', label: '12 Nov', sales: 312000, rentalRevenue: 48500, orders: 11 },
    { date: '2026-11-13', label: '13 Nov', sales: 198000, rentalRevenue: 51000, orders: 8 },
    { date: '2026-11-14', label: '14 Nov', sales: 428000, rentalRevenue: 56200, orders: 14 },
    { date: '2026-11-15', label: '15 Nov', sales: 389000, rentalRevenue: 59800, orders: 13 },
    { date: '2026-11-16', label: '16 Nov', sales: 462000, rentalRevenue: 61500, orders: 16 },
    { date: '2026-11-17', label: '17 Nov', sales: 514000, rentalRevenue: 64800, orders: 18 },
  ],
  '30d': [
    { date: '2026-10-20', label: '20 Oct', sales: 980000, rentalRevenue: 145000, orders: 38 },
    { date: '2026-10-25', label: '25 Oct', sales: 1120000, rentalRevenue: 162000, orders: 42 },
    { date: '2026-10-30', label: '30 Oct', sales: 1340000, rentalRevenue: 184000, orders: 49 },
    { date: '2026-11-04', label: '04 Nov', sales: 1185000, rentalRevenue: 198000, orders: 44 },
    { date: '2026-11-09', label: '09 Nov', sales: 1490000, rentalRevenue: 214000, orders: 56 },
    { date: '2026-11-14', label: '14 Nov', sales: 1680000, rentalRevenue: 238000, orders: 62 },
    { date: '2026-11-17', label: '17 Nov', sales: 1825000, rentalRevenue: 254000, orders: 67 },
  ],
};

export async function getDashboardOverview(range: DateRangeValue): Promise<DashboardOverview> {
  await mockDelay(180);

  const products = getProductsStore();
  const stockItems = getStockItemsStore();
  const rentalUnits = getRentalUnitsStore();

  const lowStockCount = stockItems.filter(
    (item) => item.status === 'low_stock' || item.status === 'out_of_stock'
  ).length;
  const activeRentalsCount = rentalUnits.filter((u) => u.status === 'with_customer').length + 24;
  const overdueUnitsCount = rentalUnits.filter(
    (u) => u.rentalHistory.some((h) => h.status === 'overdue')
  ).length;

  const multiplier = range.preset === 'today' ? 0.18 : range.preset === '7d' ? 1 : range.preset === '30d' ? 3.8 : 2.1;
  const totalSales = Math.round(2548000 * multiplier);
  const totalOrders = Math.round(89 * multiplier);
  const avgOrderValue = Math.round(totalSales / Math.max(totalOrders, 1));
  const rentalRevenue = Math.round(383800 * multiplier);

  const trend = TREND_BY_PRESET[range.preset] || TREND_BY_PRESET['30d'];

  return {
    kpis: [
      {
        key: 'total_sales',
        label: 'Total Sales',
        value: totalSales,
        formattedValue: formatINR(totalSales),
        deltaPercent: 14.6,
        deltaLabel: 'vs prev. period',
        href: '/admin/orders',
      },
      {
        key: 'orders',
        label: 'Orders',
        value: totalOrders,
        formattedValue: totalOrders.toLocaleString('en-IN'),
        deltaPercent: 9.2,
        deltaLabel: 'vs prev. period',
        href: '/admin/orders',
      },
      {
        key: 'aov',
        label: 'Average Order Value',
        value: avgOrderValue,
        formattedValue: formatINR(avgOrderValue),
        deltaPercent: 4.8,
        deltaLabel: 'vs prev. period',
        href: '/admin/orders',
      },
      {
        key: 'active_rentals',
        label: 'Active Rentals',
        value: activeRentalsCount,
        formattedValue: activeRentalsCount.toString(),
        deltaPercent: 11.5,
        deltaLabel: 'units deployed',
        href: '/admin/rentals',
      },
      {
        key: 'rental_revenue',
        label: 'Rental Revenue',
        value: rentalRevenue,
        formattedValue: formatINR(rentalRevenue),
        deltaPercent: 18.4,
        deltaLabel: 'recurring MRR',
        href: '/admin/rentals',
      },
      {
        key: 'new_enquiries',
        label: 'New Enquiries',
        value: INITIAL_RECENT_ENQUIRIES.filter((e) => e.status === 'new').length + 6,
        formattedValue: String(INITIAL_RECENT_ENQUIRIES.filter((e) => e.status === 'new').length + 6),
        deltaPercent: 6.0,
        deltaLabel: 'B2B & rental leads',
        href: '/admin/enquiries?status=new',
      },
      {
        key: 'pending_reviews',
        label: 'Pending Reviews',
        value: 7,
        formattedValue: '7',
        deltaPercent: -12.5,
        deltaLabel: 'awaiting moderation',
        href: '/admin/reviews?status=pending',
      },
      {
        key: 'low_stock',
        label: 'Low Stock Items',
        value: lowStockCount,
        formattedValue: lowStockCount.toString(),
        deltaPercent: 0,
        deltaLabel: 'below threshold',
        href: '/admin/inventory?filter=low_stock',
        isAlert: lowStockCount > 0,
      },
    ],
    salesTrend: trend,
    ordersByStatus: [
      { status: 'delivered', label: 'Delivered', count: Math.round(48 * multiplier), color: '#16A34A' },
      { status: 'shipped', label: 'Shipped', count: Math.round(18 * multiplier), color: '#1D5FAF' },
      { status: 'to_ship', label: 'To Ship', count: Math.round(11 * multiplier), color: '#F28C38' },
      { status: 'confirmed', label: 'Confirmed', count: Math.round(8 * multiplier), color: '#0B2545' },
      { status: 'cancelled', label: 'Cancelled', count: Math.round(4 * multiplier), color: '#94A3B8' },
    ],
    topProducts: products.slice(0, 5).map((p, idx) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitsSold: Math.max(4, Math.round((34 - idx * 6) * Math.max(multiplier, 0.4))),
      revenue: Math.round(p.price * Math.max(3, 18 - idx * 3) * Math.max(multiplier, 0.35)),
      imageUrl: p.images[0]?.url || '',
    })),
    actionNeeded: [
      {
        id: 'act-approval',
        key: 'pending_approval',
        title: 'Rentals Awaiting Approval',
        description: 'Confirm availability and assign a serial-numbered unit before dispatch',
        count: 3,
        severity: 'urgent',
        href: '/admin/rentals?status=pending_approval',
      },
      {
        id: 'act-due-7d',
        key: 'due_7_days',
        title: 'Rentals Due for Return in 7 Days',
        description: 'Send renewal reminders or schedule doorstep pickup slots',
        count: 5,
        severity: 'warning',
        href: '/admin/rentals?filter=due_7d',
      },
      {
        id: 'act-overdue',
        key: 'overdue_rentals',
        title: 'Overdue Rentals',
        description: 'Immediate customer follow-up and late fee / extension billing required',
        count: overdueUnitsCount + 1,
        severity: 'urgent',
        href: '/admin/rentals?status=overdue',
      },
      {
        id: 'act-to-ship',
        key: 'orders_to_ship',
        title: 'Orders to Ship',
        description: 'Confirmed purchase orders awaiting AWB generation & pickup',
        count: INITIAL_RECENT_ORDERS.filter((o) => o.status === 'to_ship').length + 3,
        severity: 'warning',
        href: '/admin/orders?status=to_ship',
      },
      {
        id: 'act-reviews',
        key: 'pending_reviews',
        title: 'Pending Product Reviews',
        description: 'Verified buyer & clinic reviews queued for moderation',
        count: 7,
        severity: 'info',
        href: '/admin/reviews?status=pending',
      },
      {
        id: 'act-enquiries',
        key: 'new_enquiries',
        title: 'New B2B & Rental Enquiries',
        description: 'Unassigned clinic quotes and urgent home ICU requests',
        count: INITIAL_RECENT_ENQUIRIES.filter((e) => e.status === 'new').length + 6,
        severity: 'info',
        href: '/admin/enquiries?status=new',
      },
    ],
    recentOrders: INITIAL_RECENT_ORDERS,
    recentEnquiries: INITIAL_RECENT_ENQUIRIES,
  };
}

export async function globalSearchAdmin(query: string): Promise<GlobalSearchResult[]> {
  await mockDelay(90);
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: GlobalSearchResult[] = [];

  for (const prod of getProductsStore()) {
    if (
      prod.name.toLowerCase().includes(q) ||
      prod.sku.toLowerCase().includes(q) ||
      prod.brandName.toLowerCase().includes(q)
    ) {
      results.push({
        id: prod.id,
        type: 'product',
        title: prod.name,
        subtitle: `${prod.sku} · ${prod.brandName}`,
        meta: formatINR(prod.price),
        href: `/admin/products/${prod.id}`,
      });
    }
  }

  for (const ord of INITIAL_RECENT_ORDERS) {
    if (
      ord.orderNumber.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerCity.toLowerCase().includes(q)
    ) {
      results.push({
        id: ord.id,
        type: 'order',
        title: `${ord.orderNumber} — ${ord.customerName}`,
        subtitle: `${ord.customerCity} · ${ord.paymentMethod}`,
        meta: formatINR(ord.total),
        href: `/admin/orders?search=${encodeURIComponent(ord.orderNumber)}`,
      });
    }
  }

  for (const enq of INITIAL_RECENT_ENQUIRIES) {
    if (
      enq.customerName.toLowerCase().includes(q) ||
      enq.organization.toLowerCase().includes(q) ||
      enq.phone.toLowerCase().includes(q)
    ) {
      results.push({
        id: enq.id,
        type: 'customer',
        title: enq.customerName,
        subtitle: `${enq.organization} · ${enq.phone}`,
        meta: enq.enquiryNumber,
        href: `/admin/customers?search=${encodeURIComponent(enq.customerName)}`,
      });
    }
  }

  return results.slice(0, 10);
}

// Notifications moved to ./notifications.ts (live API).
