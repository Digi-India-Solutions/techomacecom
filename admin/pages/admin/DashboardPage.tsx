import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Phone,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { DashboardOverview, DateRangeValue } from '@/types/admin';
import { getDashboardOverview } from '@/lib/api/admin/dashboard';
import { formatINR, formatDateTime } from '@/lib/api/admin/client';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { KpiGridSkeleton } from '@/components/admin/SkeletonLoader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  OrdersByStateChart,
  OrdersStatusDonutChart,
  SalesTrendLineChart,
  TopSellingProductsChart,
} from '@/components/admin/DashboardCharts';

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 6);
    return {
      preset: '7d',
      from: fromDate.toISOString().slice(0, 10),
      to,
    };
  });
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboardOverview(dateRange)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">
            Operations Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Sales, equipment rentals, fulfillment queue, and inventory health for Buy Denmed.
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* 8 KPI Cards */}
      {loading || !overview ? (
        <KpiGridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overview.kpis.map((kpi) => {
            const isPositive = kpi.deltaPercent >= 0;
            return (
              <Link
                key={kpi.key}
                to={kpi.href}
                className="group rounded-xl border border-[#DCE6F2] bg-white p-4 transition-colors hover:border-[#1D5FAF]/50 hover:bg-[#EAF2FC]/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#5B6B82]">{kpi.label}</span>
                  {kpi.isAlert ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F28C38]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#B85A0E]">
                      Alert
                    </span>
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#5B6B82] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                <div className="mt-2 text-2xl font-bold text-[#12263F] tabular-nums">
                  {kpi.formattedValue}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {kpi.deltaPercent !== 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                        isPositive ? 'text-emerald-600' : 'text-[#B85A0E]'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {isPositive ? '+' : ''}
                      {kpi.deltaPercent}%
                    </span>
                  )}
                  <span className="text-[#5B6B82]">{kpi.deltaLabel}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Charts Row 1: Line + Donut */}
      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <SalesTrendLineChart data={overview.salesTrend} />
          </div>
          <div>
            <OrdersStatusDonutChart slices={overview.ordersByStatus} />
          </div>
        </div>
      )}

      {/* Charts Row 2: Action Needed + Top 5 Products + Orders by State */}
      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Action Needed Panel */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-[#12263F]">Action Needed</h3>
                  <p className="text-xs text-[#5B6B82]">
                    Priority operational queues requiring team review
                  </p>
                </div>
                <span className="rounded-md bg-[#F28C38]/15 px-2.5 py-1 text-xs font-semibold text-[#B85A0E] tabular-nums">
                  {overview.actionNeeded.reduce((acc, i) => acc + i.count, 0)} items
                </span>
              </div>

              <div className="divide-y divide-[#DCE6F2]">
                {overview.actionNeeded.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1 hover:bg-[#F6F9FD] -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          item.severity === 'urgent' || item.severity === 'warning'
                            ? 'bg-[#F28C38]/15 text-[#B85A0E]'
                            : 'bg-[#EAF2FC] text-[#1D5FAF]'
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#12263F] truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#5B6B82] truncate">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                          item.severity === 'urgent' || item.severity === 'warning'
                            ? 'bg-[#F28C38] text-white'
                            : 'bg-[#EAF2FC] text-[#1D5FAF]'
                        }`}
                      >
                        {item.count}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#5B6B82]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <TopSellingProductsChart products={overview.topProducts} />

          <OrdersByStateChart
            orderStates={overview.ordersByState}
            rentalStates={overview.rentalsByState}
          />
        </div>
      )}

      {/* Recent Orders & Recent Enquiries */}
      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Recent Orders */}
          <div className="xl:col-span-2 rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#12263F]">Recent Orders</h3>
                <p className="text-xs text-[#5B6B82]">Latest equipment orders across India</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-[#1D5FAF] hover:underline whitespace-nowrap"
              >
                View all orders
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F2] text-sm">
                  {overview.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F6F9FD]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders?search=${encodeURIComponent(ord.orderNumber)}`}
                          className="font-mono text-xs font-semibold text-[#1D5FAF] hover:underline"
                        >
                          {ord.orderNumber}
                        </Link>
                        <p className="text-[11px] text-[#5B6B82] tabular-nums">
                          {formatDateTime(ord.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#12263F]">{ord.customerName}</p>
                        <p className="text-xs text-[#5B6B82]">
                          {ord.customerCity} · {ord.itemsCount} {ord.itemsCount === 1 ? 'item' : 'items'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[#12263F]">
                        {ord.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#12263F] tabular-nums">
                        {formatINR(ord.total)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ord.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Enquiries */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#12263F]">Recent Enquiries</h3>
                <p className="text-xs text-[#5B6B82]">Clinic quotes &amp; rental leads</p>
              </div>
              <Link
                to="/admin/enquiries"
                className="text-xs font-semibold text-[#1D5FAF] hover:underline whitespace-nowrap"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-[#DCE6F2]">
              {overview.recentEnquiries.map((enq) => (
                <div key={enq.id} className="p-4 hover:bg-[#F6F9FD] transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#1D5FAF]">
                      {enq.enquiryNumber}
                    </span>
                    <StatusBadge status={enq.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#12263F] line-clamp-1">
                    {enq.subject}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B6B82]">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {enq.customerName}
                    </span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Phone className="h-3.5 w-3.5" />
                      {enq.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
