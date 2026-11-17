import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Layers } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { INITIAL_RECENT_ENQUIRIES, INITIAL_RECENT_ORDERS } from '@/lib/api/admin/mockData';
import { formatINR, formatDateTime } from '@/lib/api/admin/client';

interface PlaceholderSectionPageProps {
  title: string;
  sectionGroup: string;
  description: string;
  moduleKey: string;
}

export function PlaceholderSectionPage({
  title,
  sectionGroup,
  description,
  moduleKey,
}: PlaceholderSectionPageProps) {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || searchParams.get('status') || searchParams.get('search');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1D5FAF]">
            {sectionGroup}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-[#12263F] tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-[#5B6B82]">{description}</p>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {filterParam && (
        <div className="rounded-xl border border-[#1D5FAF]/25 bg-[#EAF2FC] px-4 py-3 text-xs text-[#12263F] flex items-center justify-between gap-3">
          <span>
            Active filter from dashboard link: <strong className="font-mono">{filterParam}</strong>
          </span>
          <StatusBadge status="info" label="Filtered Queue" tone="info" />
        </div>
      )}

      {/* Contextual preview for Orders & Enquiries when navigated from Dashboard */}
      {moduleKey === 'orders' && (
        <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
          <div className="border-b border-[#DCE6F2] px-5 py-3.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#12263F]">Order Queue Preview (Part 2 Full Module)</h2>
            <StatusBadge status="info" label="Phase 2 Scope" tone="info" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {INITIAL_RECENT_ORDERS.filter((o) =>
                  filterParam === 'to_ship' ? o.status === 'to_ship' : true
                ).map((o) => (
                  <tr key={o.id} className="hover:bg-[#F6F9FD]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1D5FAF]">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#12263F]">{o.customerName}</td>
                    <td className="px-4 py-3 text-[#5B6B82]">{o.customerCity}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatINR(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5B6B82] tabular-nums">
                      {formatDateTime(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {moduleKey === 'enquiries' && (
        <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
          <div className="border-b border-[#DCE6F2] px-5 py-3.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#12263F]">Enquiries Queue Preview (Part 2 Full Module)</h2>
            <StatusBadge status="info" label="Phase 2 Scope" tone="info" />
          </div>
          <div className="divide-y divide-[#DCE6F2]">
            {INITIAL_RECENT_ENQUIRIES.map((e) => (
              <div key={e.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#12263F]">
                    <span className="font-mono text-xs text-[#1D5FAF] mr-2">{e.enquiryNumber}</span>
                    {e.subject}
                  </p>
                  <p className="text-xs text-[#5B6B82] mt-0.5">
                    {e.customerName} · {e.organization} · {e.phone}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Part 2 Module Card */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white p-8">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FC] text-[#1D5FAF]">
            <Layers className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-[#12263F]">
            {title} Workspace (Scheduled for Part 2)
          </h2>
          <p className="text-sm text-[#5B6B82] leading-relaxed">
            This route is pre-wired in the Buy Denmed Admin navigation, RBAC permission matrix, and
            typed API structure. Part 1 focuses on Dashboard, Catalog (Products, Categories, Brands,
            Bulk Import), and Inventory (Warehouse Stock &amp; Serialized Rental Units).
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/admin/products"
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] transition-colors"
            >
              Manage Products
            </Link>
            <Link
              to="/admin/rental-units"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
            >
              <CalendarClock className="h-3.5 w-3.5 text-[#5B6B82]" />
              Inspect Rental Units
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
