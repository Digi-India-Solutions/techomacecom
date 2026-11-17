import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  Eye,
  MessageSquare,
  Send,
} from 'lucide-react';
import type { RentalBooking, RentalStatus } from '@/types/admin';
import {
  getAllRentalsForCounts,
  listRentals,
  sendOverdueReminder,
} from '@/lib/api/admin/rentals';
import { formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';

const RENTAL_STATUS_TABS: { key: 'all' | RentalStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_approval', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'active', label: 'Active' },
  { key: 'extension_requested', label: 'Extension Requested' },
  { key: 'return_scheduled', label: 'Return Scheduled' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
  { key: 'deposit_refunded', label: 'Deposit Refunded' },
  { key: 'cancelled', label: 'Cancelled' },
];

const REFERENCE_TODAY = new Date('2026-11-17T00:00:00');

function getDaysRemaining(endDate: string): number {
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return 0;
  return Math.ceil((end.getTime() - REFERENCE_TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

export function RentalsPage() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const initialStatusParam = searchParams.get('status');

  const mappedStatus: 'all' | RentalStatus =
    initialFilter === 'kyc_pending'
      ? 'pending_approval'
      : (RENTAL_STATUS_TABS.find((t) => t.key === initialStatusParam)?.key ?? 'all');

  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rentals, setRentals] = useState<RentalBooking[]>([]);
  const [allRentals, setAllRentals] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusTab, setStatusTab] = useState<'all' | RentalStatus>(mappedStatus);
  const [dueIn7Days, setDueIn7Days] = useState(initialFilter === 'due_7d');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [filtered, all] = await Promise.all([
        listRentals({
          search,
          status: statusTab,
          dueIn7Days,
        }),
        getAllRentalsForCounts(),
      ]);
      setRentals(filtered);
      setAllRentals(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusTab, dueIn7Days]);

  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = { all: allRentals.length };
    RENTAL_STATUS_TABS.forEach((tab) => {
      if (tab.key !== 'all') {
        map[tab.key] = allRentals.filter((r) => r.status === tab.key).length;
      }
    });
    return map;
  }, [allRentals]);

  const overdueCount = countsByStatus.overdue ?? 0;

  const handleSendReminder = async (
    e: React.MouseEvent,
    rental: RentalBooking,
    channel: 'WhatsApp' | 'SMS'
  ) => {
    e.stopPropagation();
    setSendingId(rental.id);
    try {
      await sendOverdueReminder(rental.id, channel, user?.name || 'Admin');
      showToast({
        title: `${channel} reminder sent`,
        description: `Dispatched overdue alert to ${rental.customerName} (${rental.customerPhone}).`,
        variant: 'success',
      });
      load();
    } finally {
      setSendingId(null);
    }
  };

  const columns: DataTableColumn<RentalBooking>[] = useMemo(
    () => [
      {
        key: 'rentalNumber',
        header: 'Rental ID',
        sortable: true,
        sortValue: (r) => r.rentalNumber,
        csvValue: (r) => r.rentalNumber,
        render: (r) => (
          <div>
            <Link
              to={`/admin/rentals/${r.id}`}
              className="font-mono text-xs font-semibold text-[#1D5FAF] hover:underline whitespace-nowrap"
            >
              {r.rentalNumber}
            </Link>
            <div className="mt-1">
              <StatusBadge status={r.status} />
            </div>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        sortable: true,
        sortValue: (r) => r.customerName,
        csvValue: (r) => r.customerName,
        render: (r) => (
          <div className="min-w-[160px]">
            <p className="text-sm font-semibold text-[#12263F]">{r.customerName}</p>
            <p className="text-xs text-[#5B6B82]">
              {r.deliveryAddress.city} · {r.customerPhone}
            </p>
          </div>
        ),
      },
      {
        key: 'product',
        header: 'Product & Plan',
        sortable: true,
        sortValue: (r) => r.productName,
        csvValue: (r) => `${r.productName} (${r.planType})`,
        render: (r) => (
          <div className="flex items-center gap-2.5 min-w-[220px] max-w-[280px]">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={r.productImage} alt={r.productName} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#12263F] truncate">{r.productName}</p>
              <p className="text-[11px] text-[#5B6B82] capitalize">
                {r.planType} plan · {formatINR(r.planRate)}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'dates',
        header: 'Dates & Remaining',
        sortable: true,
        sortValue: (r) => r.endDate,
        csvValue: (r) => `${r.startDate} to ${r.endDate}`,
        render: (r) => {
          const days = getDaysRemaining(r.endDate);
          const isTerminal =
            r.status === 'returned' ||
            r.status === 'deposit_refunded' ||
            r.status === 'cancelled';
          const isOverdue = !isTerminal && (r.status === 'overdue' || days < 0);

          return (
            <div className="whitespace-nowrap">
              <p className="text-xs text-[#12263F] tabular-nums">
                {formatShortDate(r.startDate)} → {formatShortDate(r.endDate)}
              </p>
              {!isTerminal && (
                <p
                  className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
                    isOverdue
                      ? 'text-red-600'
                      : days <= 7
                        ? 'text-[#B85A0E]'
                        : 'text-[#5B6B82]'
                  }`}
                >
                  {isOverdue
                    ? `${Math.abs(days)}d overdue`
                    : days === 0
                      ? 'Due today'
                      : `${days}d remaining`}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: 'unit',
        header: 'Assigned Unit Serial',
        sortable: true,
        sortValue: (r) => r.assignedUnitSerial || '',
        csvValue: (r) => r.assignedUnitSerial || 'Unassigned',
        render: (r) =>
          r.assignedUnitSerial ? (
            <div className="whitespace-nowrap">
              <span className="font-mono text-xs font-semibold text-[#12263F]">
                {r.assignedUnitSerial}
              </span>
              <p className="text-[11px] text-[#5B6B82]">{r.assignedUnitCode}</p>
            </div>
          ) : (
            <span className="rounded bg-[#F28C38]/12 px-2 py-0.5 text-[11px] font-medium text-[#B85A0E] whitespace-nowrap">
              Not assigned
            </span>
          ),
      },
      {
        key: 'deposit',
        header: 'Deposit & Paid',
        align: 'right',
        sortable: true,
        sortValue: (r) => r.amountPaid,
        csvValue: (r) => r.amountPaid,
        render: (r) => (
          <div className="text-right whitespace-nowrap">
            <p className="text-sm font-bold text-[#12263F] tabular-nums">
              {formatINR(r.amountPaid)}
            </p>
            <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] text-[#5B6B82] tabular-nums">
              <span>Dep: {formatINR(r.depositAmount)}</span>
              <StatusBadge status={r.depositStatus} />
            </div>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (r) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {r.status === 'overdue' && (
              <>
                <button
                  type="button"
                  disabled={sendingId === r.id}
                  onClick={(e) => handleSendReminder(e, r, 'WhatsApp')}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#F28C38] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#d97724] disabled:opacity-60 whitespace-nowrap"
                  title="Send WhatsApp overdue reminder"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  disabled={sendingId === r.id}
                  onClick={(e) => handleSendReminder(e, r, 'SMS')}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#F28C38]/40 bg-[#F28C38]/10 px-2.5 py-1.5 text-xs font-semibold text-[#B85A0E] hover:bg-[#F28C38]/20 disabled:opacity-60 whitespace-nowrap"
                  title="Send SMS overdue reminder"
                >
                  <Send className="h-3.5 w-3.5" />
                  SMS
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => navigate(`/admin/rentals/${r.id}`)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] whitespace-nowrap"
            >
              <Eye className="h-3.5 w-3.5" />
              Manage
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, sendingId]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Rentals</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Verify KYC &amp; prescriptions, assign serial units, approve extensions, inspect returns, and refund deposits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDueIn7Days((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              dueIn7Days
                ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#1D5FAF]'
                : 'border-[#DCE6F2] bg-white text-[#12263F] hover:bg-[#EAF2FC]'
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Due within 7 Days
          </button>

          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setDueIn7Days(false);
                setStatusTab(statusTab === 'overdue' ? 'all' : 'overdue');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                statusTab === 'overdue'
                  ? 'border-[#F28C38] bg-[#F28C38] text-white'
                  : 'border-[#F28C38]/40 bg-[#F28C38]/10 text-[#B85A0E] hover:bg-[#F28C38]/20'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue Rentals ({overdueCount})
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs with Counts */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE6F2] bg-white p-1.5">
        {RENTAL_STATUS_TABS.map((tab) => {
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

      <DataTable
        data={rentals}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rental #, customer, product, or unit serial..."
        exportFilename="buydenmed-rentals.csv"
        onRowClick={(r) => navigate(`/admin/rentals/${r.id}`)}
        emptyTitle="No rental bookings match"
        emptyDescription="Switch tabs or clear active due-date filters to see all rental bookings."
      />
    </div>
  );
}
