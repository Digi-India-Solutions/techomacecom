import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Ban, CheckCircle2, Eye } from 'lucide-react';
import type { CustomerRecord, CustomerStatus } from '@/types/admin';
import { listCustomers, toggleCustomerBlock } from '@/lib/api/admin/customers';
import { formatINR, formatShortDate } from '@/lib/api/admin/client';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

export function CustomersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all');
  const [cityFilter, setCityFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listCustomers({
        search,
        status: statusFilter,
        city: cityFilter,
      });
      setCustomers(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, cityFilter]);

  const cities = useMemo(
    () => Array.from(new Set(customers.map((c) => c.city))).sort(),
    [customers]
  );

  const handleToggleBlock = async (e: React.MouseEvent, c: CustomerRecord) => {
    e.stopPropagation();
    const updated = await toggleCustomerBlock(c.id);
    showToast({
      title:
        updated.status === 'blocked'
          ? `Blocked ${updated.name}`
          : `Unblocked ${updated.name}`,
      variant: updated.status === 'blocked' ? 'info' : 'success',
    });
    load();
  };

  const columns: DataTableColumn<CustomerRecord>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Customer / Clinic',
        sortable: true,
        sortValue: (c) => c.name,
        csvValue: (c) => c.name,
        render: (c) => (
          <div>
            <Link
              to={`/admin/customers/${c.id}`}
              className="text-sm font-semibold text-[#12263F] hover:text-[#1D5FAF]"
            >
              {c.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-[#5B6B82]">
              <span>{c.email}</span>
              {c.gstDetails && (
                <span className="rounded bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-semibold text-[#1D5FAF]">
                  GSTIN
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'mobile',
        header: 'Mobile',
        csvValue: (c) => c.mobile,
        render: (c) => (
          <span className="font-mono text-xs text-[#12263F] whitespace-nowrap">
            {c.mobile}
          </span>
        ),
      },
      {
        key: 'city',
        header: 'City',
        sortable: true,
        sortValue: (c) => c.city,
        csvValue: (c) => `${c.city}, ${c.state}`,
        render: (c) => (
          <span className="text-xs text-[#5B6B82]">
            {c.city}, {c.state}
          </span>
        ),
      },
      {
        key: 'ordersCount',
        header: 'Orders / Rentals',
        align: 'right',
        sortable: true,
        sortValue: (c) => c.ordersCount + c.rentalsCount,
        csvValue: (c) => `${c.ordersCount} orders / ${c.rentalsCount} rentals`,
        render: (c) => (
          <span className="text-xs font-medium text-[#12263F] tabular-nums whitespace-nowrap">
            {c.ordersCount} orders · {c.rentalsCount} rentals
          </span>
        ),
      },
      {
        key: 'totalSpent',
        header: 'Total Spent',
        align: 'right',
        sortable: true,
        sortValue: (c) => c.totalSpent,
        csvValue: (c) => c.totalSpent,
        render: (c) => (
          <span className="text-sm font-bold text-[#12263F] tabular-nums whitespace-nowrap">
            {formatINR(c.totalSpent)}
          </span>
        ),
      },
      {
        key: 'joinedAt',
        header: 'Joined',
        sortable: true,
        sortValue: (c) => c.joinedAt,
        csvValue: (c) => c.joinedAt,
        render: (c) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {formatShortDate(c.joinedAt)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (c) => c.status,
        csvValue: (c) => c.status,
        render: (c) => <StatusBadge status={c.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (c) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => handleToggleBlock(e, c)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
                c.status === 'active'
                  ? 'border-[#DCE6F2] bg-white text-red-600 hover:bg-red-50'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {c.status === 'active' ? (
                <>
                  <Ban className="h-3.5 w-3.5" />
                  Block
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Unblock
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/customers/${c.id}`)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] whitespace-nowrap"
            >
              <Eye className="h-3.5 w-3.5" />
              Profile
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Customers</h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">
          Directory of B2C patients, dental clinics, and B2B hospitals with GSTIN profiles and spend history.
        </p>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        getRowId={(c) => c.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer name, mobile, email, or city..."
        exportFilename="buydenmed-customers.csv"
        onRowClick={(c) => navigate(`/admin/customers/${c.id}`)}
        filtersSlot={
          <>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F]"
              aria-label="City filter"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | CustomerStatus)}
              className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F]"
              aria-label="Status filter"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </>
        }
      />
    </div>
  );
}
