import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { ActivityLogEntry, StaffMember } from '@/types/admin';
import { listActivityLogs, listStaff } from '@/lib/api/admin/staff';
import { formatDateTime } from '@/lib/api/admin/client';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [staffId, setStaffId] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    listStaff().then(setStaff);
  }, []);

  useEffect(() => {
    setLoading(true);
    listActivityLogs({
      staffId,
      module: moduleFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [staffId, moduleFilter, dateFrom, dateTo]);

  const modules = ['Orders', 'Products', 'Inventory', 'Rentals', 'Settings', 'Staff'];

  const columns: DataTableColumn<ActivityLogEntry>[] = useMemo(
    () => [
      {
        key: 'timestamp',
        header: 'Date & Time',
        sortable: true,
        sortValue: (a) => a.timestamp,
        csvValue: (a) => a.timestamp,
        render: (a) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {formatDateTime(a.timestamp)}
          </span>
        ),
      },
      {
        key: 'staffName',
        header: 'Staff Member',
        sortable: true,
        sortValue: (a) => a.staffName,
        csvValue: (a) => a.staffName,
        render: (a) => (
          <span className="text-xs font-semibold text-[#12263F] whitespace-nowrap">
            {a.staffName}
          </span>
        ),
      },
      {
        key: 'module',
        header: 'Module',
        sortable: true,
        sortValue: (a) => a.module,
        csvValue: (a) => a.module,
        render: (a) => (
          <span className="rounded bg-[#EAF2FC] px-2 py-0.5 text-[11px] font-semibold text-[#1D5FAF]">
            {a.module}
          </span>
        ),
      },
      {
        key: 'action',
        header: 'Action',
        csvValue: (a) => a.action,
        render: (a) => (
          <span className="text-xs font-medium text-[#12263F] whitespace-nowrap">
            {a.action}
          </span>
        ),
      },
      {
        key: 'record',
        header: 'Record',
        csvValue: (a) => a.recordLabel,
        render: (a) => (
          <Link
            to={a.recordHref}
            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#1D5FAF] hover:underline whitespace-nowrap"
          >
            {a.recordLabel}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ),
      },
      {
        key: 'changesSummary',
        header: 'Changes (Old → New)',
        csvValue: (a) => a.changesSummary,
        render: (a) => (
          <span className="text-xs text-[#5B6B82]">{a.changesSummary}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Activity Log</h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">
          Audit trail of admin actions across orders, catalog pricing, stock adjustments, and rentals.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F]"
          aria-label="Filter by staff member"
        >
          <option value="all">All Staff Members</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F]"
          aria-label="Filter by module"
        >
          <option value="all">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
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
        data={logs}
        columns={columns}
        getRowId={(a) => a.id}
        loading={loading}
        searchKeys={(a) => `${a.staffName} ${a.module} ${a.action} ${a.recordLabel} ${a.changesSummary}`}
        searchPlaceholder="Search record ID, staff, or change..."
        exportFilename="buydenmed-activity-log.csv"
      />
    </div>
  );
}
