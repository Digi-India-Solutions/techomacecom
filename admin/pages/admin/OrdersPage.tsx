import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Printer } from 'lucide-react';
import type {
  Order,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
} from '@/types/admin';
import {
  bulkMarkOrdersPacked,
  getAllOrdersForCounts,
  listOrders,
} from '@/lib/api/admin/orders';
import { formatDateTime, formatINR } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type BulkAction, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

const STATUS_TABS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function OrdersPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialStatusParam = searchParams.get('status');
  const mappedInitialStatus: 'all' | OrderStatus =
    initialStatusParam === 'to_ship'
      ? 'packed'
      : (STATUS_TABS.find((t) => t.key === initialStatusParam)?.key ?? 'all');

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch);
  const [statusTab, setStatusTab] = useState<'all' | OrderStatus>(mappedInitialStatus);
  const [paymentMethod, setPaymentMethod] = useState<'all' | OrderPaymentMethod>('all');
  const [paymentStatus, setPaymentStatus] = useState<'all' | OrderPaymentStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [filtered, all] = await Promise.all([
        listOrders({
          search,
          status: statusTab,
          paymentMethod,
          paymentStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
        getAllOrdersForCounts(),
      ]);
      setOrders(filtered);
      setAllOrders(all);
    } catch (err) {
      showToast({
        title: 'Could not load orders',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusTab, paymentMethod, paymentStatus, dateFrom, dateTo]);

  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = { all: allOrders.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== 'all') {
        map[t.key] = allOrders.filter((o) => o.orderStatus === t.key).length;
      }
    });
    return map;
  }, [allOrders]);

  const columns: DataTableColumn<Order>[] = useMemo(
    () => [
      {
        key: 'orderNumber',
        header: 'Order ID',
        sortable: true,
        sortValue: (o) => o.orderNumber,
        csvValue: (o) => o.orderNumber,
        render: (o) => (
          <Link
            to={`/admin/orders/${o.id}`}
            className="font-mono text-xs font-semibold text-[#1D5FAF] hover:underline whitespace-nowrap"
          >
            {o.orderNumber}
          </Link>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        sortValue: (o) => o.createdAt,
        csvValue: (o) => o.createdAt,
        render: (o) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {formatDateTime(o.createdAt)}
          </span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        sortable: true,
        sortValue: (o) => o.customerName,
        csvValue: (o) => o.customerName,
        render: (o) => (
          <div className="min-w-[170px]">
            <p className="text-sm font-semibold text-[#12263F]">{o.customerName}</p>
            <p className="text-xs text-[#5B6B82]">
              {o.shippingAddress.city} · {o.customerPhone}
            </p>
          </div>
        ),
      },
      {
        key: 'items',
        header: 'Items',
        align: 'right',
        sortable: true,
        sortValue: (o) => o.items.reduce((s, i) => s + i.qty, 0),
        csvValue: (o) => o.items.reduce((s, i) => s + i.qty, 0),
        render: (o) => (
          <span className="text-xs font-medium text-[#12263F] tabular-nums">
            {o.items.reduce((s, i) => s + i.qty, 0)}
          </span>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        sortable: true,
        sortValue: (o) => o.total,
        csvValue: (o) => o.total,
        render: (o) => (
          <span className="text-sm font-bold text-[#12263F] tabular-nums whitespace-nowrap">
            {formatINR(o.total)}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Method',
        sortable: true,
        sortValue: (o) => o.paymentMethod,
        csvValue: (o) => o.paymentMethod,
        render: (o) => (
          <div className="text-xs">
            <span className="font-semibold text-[#12263F]">{o.paymentMethod}</span>
            {o.gstDetails && (
              <span className="ml-1.5 rounded bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-semibold text-[#1D5FAF]">
                B2B GST
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        sortable: true,
        sortValue: (o) => o.paymentStatus,
        csvValue: (o) => o.paymentStatus,
        render: (o) => <StatusBadge status={o.paymentStatus} />,
      },
      {
        key: 'orderStatus',
        header: 'Order Status',
        sortable: true,
        sortValue: (o) => o.orderStatus,
        csvValue: (o) => o.orderStatus,
        render: (o) => <StatusBadge status={o.orderStatus} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (o) => (
          <button
            type="button"
            onClick={() => navigate(`/admin/orders/${o.id}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5" />
            Manage
          </button>
        ),
      },
    ],
    [navigate]
  );

  const bulkActions: BulkAction<Order>[] = [
    {
      key: 'pack',
      label: 'Mark Packed',
      onClick: async (rows) => {
        try {
          await bulkMarkOrdersPacked(
            rows.map((r) => r.id),
            user?.name || 'Admin'
          );
          showToast({
            title: `Marked eligible orders as Packed`,
            variant: 'success',
          });
        } catch (err) {
          showToast({ title: 'Could not update orders', description: err instanceof Error ? err.message : undefined, variant: 'error' });
        }
        load();
      },
    },
    {
      key: 'print_invoices',
      label: 'Print Invoices',
      onClick: (rows) => {
        showToast({
          title: `Prepared ${rows.length} GST invoices for print`,
          description: `Orders: ${rows.map((r) => r.orderNumber).join(', ')}`,
          variant: 'info',
        });
        window.print();
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Orders</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Fulfill B2C and B2B medical equipment orders, generate Shiprocket AWBs, and issue GST invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
        >
          <Printer className="h-3.5 w-3.5 text-[#5B6B82]" />
          Print Queue
        </button>
      </div>

      {/* Status Tabs with Counts */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE6F2] bg-white p-1.5">
        {STATUS_TABS.map((tab) => {
          const active = statusTab === tab.key;
          const count = countsByStatus[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <select
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(e.target.value as 'all' | OrderPaymentMethod)
          }
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F]"
          aria-label="Payment method filter"
        >
          <option value="all">All Payment Methods</option>
          <option value="Razorpay">Razorpay</option>
          <option value="COD">COD</option>
          <option value="EMI">EMI</option>
        </select>

        <select
          value={paymentStatus}
          onChange={(e) =>
            setPaymentStatus(e.target.value as 'all' | OrderPaymentStatus)
          }
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F]"
          aria-label="Payment status filter"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <div className="flex items-center gap-2 text-xs text-[#5B6B82]">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs text-[#12263F] tabular-nums"
          />
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs text-[#12263F] tabular-nums"
          />
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        getRowId={(o) => o.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order #, customer, phone, or SKU..."
        selectable
        bulkActions={bulkActions}
        exportFilename="buydenmed-orders.csv"
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
        emptyTitle="No orders match"
        emptyDescription="Clear status or date filters to see all customer orders."
      />
    </div>
  );
}
