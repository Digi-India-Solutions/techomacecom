import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  Layers,
  Plus,
  X,
} from 'lucide-react';
import type {
  Product,
  RentalUnit,
  RentalUnitCondition,
  RentalUnitStatus,
} from '@/types/admin';
import {
  bulkAddRentalUnits,
  createRentalUnit,
  listRentalUnits,
} from '@/lib/api/admin/rentalUnits';
import { listProducts } from '@/lib/api/admin/products';
import { formatShortDate } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass, textareaClass } from '@/components/admin/FormField';

export function RentalUnitsPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as RentalUnitStatus) || 'all';

  const { can } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [rentableProducts, setRentableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RentalUnitStatus>(initialStatus);
  const [conditionFilter, setConditionFilter] = useState<'all' | RentalUnitCondition>('all');
  const [serviceDueOnly, setServiceDueOnly] = useState(false);

  // Add Single Unit Modal
  const [addOpen, setAddOpen] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState('2026-11-17');
  const [newCondition, setNewCondition] = useState<RentalUnitCondition>('new');
  const [newNotes, setNewNotes] = useState('');

  // Bulk Add Modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkSerialsText, setBulkSerialsText] = useState('');
  const [bulkPurchaseDate, setBulkPurchaseDate] = useState('2026-11-17');
  const [bulkCondition, setBulkCondition] = useState<RentalUnitCondition>('new');

  const load = async () => {
    setLoading(true);
    try {
      const [unitList, prodList] = await Promise.all([
        listRentalUnits({
          search,
          productId: productFilter,
          status: statusFilter,
          condition: conditionFilter,
          serviceDueOnly,
        }),
        listProducts({ rentEnabled: true }),
      ]);
      setUnits(unitList);
      setRentableProducts(prodList);
      if (prodList.length > 0 && !newProductId) {
        setNewProductId(prodList[0].id);
        setBulkProductId(prodList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, productFilter, statusFilter, conditionFilter, serviceDueOnly]);

  const isServiceDueSoon = (unit: RentalUnit) => {
    if (unit.condition === 'needs_service') return true;
    const due = new Date(unit.nextServiceDue);
    const limit = new Date('2026-11-17');
    limit.setDate(limit.getDate() + 14);
    return due <= limit;
  };

  const serviceDueCount = units.filter(isServiceDueSoon).length;

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createRentalUnit({
        productId: newProductId,
        serialNumber: newSerial,
        purchaseDate: newPurchaseDate,
        condition: newCondition,
        notes: newNotes,
      });
      showToast({
        title: `Added rental unit ${created.unitCode}`,
        description: `S/N: ${created.serialNumber}`,
        variant: 'success',
      });
      setAddOpen(false);
      setNewSerial('');
      setNewNotes('');
      load();
    } catch (err) {
      showToast({
        title: 'Unable to add unit',
        description: err instanceof Error ? err.message : 'Check serial number',
        variant: 'error',
      });
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = bulkSerialsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return;

    try {
      const res = await bulkAddRentalUnits({
        productId: bulkProductId,
        serialNumbers: list,
        purchaseDate: bulkPurchaseDate,
        condition: bulkCondition,
      });
      showToast({
        title: `Registered ${res.added.length} rental units`,
        description:
          res.skipped.length > 0
            ? `Skipped ${res.skipped.length} duplicate serial(s).`
            : undefined,
        variant: res.skipped.length > 0 ? 'warning' : 'success',
      });
      setBulkOpen(false);
      setBulkSerialsText('');
      load();
    } catch (err) {
      showToast({
        title: 'Bulk add failed',
        description: err instanceof Error ? err.message : 'Check input',
        variant: 'error',
      });
    }
  };

  const canManage = can('rental_units.manage');

  const columns: DataTableColumn<RentalUnit>[] = useMemo(
    () => [
      {
        key: 'unitCode',
        header: 'Unit ID',
        sortable: true,
        sortValue: (u) => u.unitCode,
        csvValue: (u) => u.unitCode,
        render: (u) => (
          <Link
            to={`/admin/rental-units/${u.id}`}
            className="font-mono text-xs font-semibold text-[#1D5FAF] hover:underline whitespace-nowrap"
          >
            {u.unitCode}
          </Link>
        ),
      },
      {
        key: 'product',
        header: 'Product & Serial #',
        sortable: true,
        sortValue: (u) => u.productName,
        csvValue: (u) => `${u.productName} (${u.serialNumber})`,
        render: (u) => (
          <div className="flex items-center gap-3 min-w-[230px]">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={u.productImage} alt={u.productName} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#12263F] line-clamp-1">
                {u.productName}
              </p>
              <p className="text-[11px] font-mono text-[#5B6B82]">SN: {u.serialNumber}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'purchaseDate',
        header: 'Purchased',
        sortable: true,
        sortValue: (u) => u.purchaseDate,
        csvValue: (u) => u.purchaseDate,
        render: (u) => (
          <span className="text-xs text-[#5B6B82] tabular-nums whitespace-nowrap">
            {formatShortDate(u.purchaseDate)}
          </span>
        ),
      },
      {
        key: 'condition',
        header: 'Condition',
        sortable: true,
        sortValue: (u) => u.condition,
        csvValue: (u) => u.condition,
        render: (u) => <StatusBadge status={u.condition} />,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (u) => u.status,
        csvValue: (u) => u.status,
        render: (u) => <StatusBadge status={u.status} />,
      },
      {
        key: 'customer',
        header: 'Current Customer / Rental',
        csvValue: (u) =>
          u.currentCustomerName
            ? `${u.currentCustomerName} (${u.currentRentalId})`
            : '',
        render: (u) =>
          u.currentCustomerName ? (
            <div className="text-xs">
              <p className="font-medium text-[#12263F]">{u.currentCustomerName}</p>
              <p className="font-mono text-[11px] text-[#1D5FAF]">{u.currentRentalId}</p>
            </div>
          ) : (
            <span className="text-xs text-[#5B6B82]">—</span>
          ),
      },
      {
        key: 'expectedReturn',
        header: 'Expected Return',
        sortable: true,
        sortValue: (u) => u.expectedReturnDate || '',
        csvValue: (u) => u.expectedReturnDate || '',
        render: (u) => (
          <span className="text-xs text-[#12263F] tabular-nums whitespace-nowrap">
            {u.expectedReturnDate ? formatShortDate(u.expectedReturnDate) : '—'}
          </span>
        ),
      },
      {
        key: 'serviceDates',
        header: 'Last / Next Service',
        sortable: true,
        sortValue: (u) => u.nextServiceDue,
        csvValue: (u) => `${u.lastServiceDate} / ${u.nextServiceDue}`,
        render: (u) => {
          const dueSoon = isServiceDueSoon(u);
          return (
            <div className="text-xs tabular-nums whitespace-nowrap">
              <p className="text-[#5B6B82]">Last: {formatShortDate(u.lastServiceDate)}</p>
              <p className={dueSoon ? 'font-semibold text-[#B85A0E]' : 'text-[#12263F]'}>
                Due: {formatShortDate(u.nextServiceDue)}
              </p>
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (u) => (
          <button
            type="button"
            onClick={() => navigate(`/admin/rental-units/${u.id}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">
            Inventory — Rental Units
          </h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Track serialized physical medical equipment units, deployments, preventive servicing, and sanitisation logs.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
            >
              <Layers className="h-3.5 w-3.5 text-[#1D5FAF]" />
              Bulk Add Serials
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              <Plus className="h-4 w-4" />
              Add Rental Unit
            </button>
          </div>
        )}
      </div>

      {/* Service Due Alert Banner */}
      {serviceDueCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F28C38]/40 bg-[#F28C38]/10 px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs text-[#12263F]">
            <AlertTriangle className="h-4 w-4 text-[#F28C38] shrink-0" />
            <span>
              <strong className="tabular-nums">{serviceDueCount}</strong> rental{' '}
              {serviceDueCount === 1 ? 'unit requires' : 'units require'} preventive maintenance or
              calibration within 14 days.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setServiceDueOnly((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              serviceDueOnly
                ? 'bg-[#F28C38] text-white'
                : 'bg-white border border-[#F28C38]/40 text-[#B85A0E] hover:bg-[#F28C38]/15'
            }`}
          >
            {serviceDueOnly ? 'Showing Service Due Only' : 'Filter Service Due'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none max-w-xs"
          aria-label="Filter by product"
        >
          <option value="all">All Rentable Products</option>
          {rentableProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | RentalUnitStatus)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="with_customer">With Customer</option>
          <option value="in_transit">In Transit</option>
          <option value="under_service">Under Service</option>
          <option value="retired">Retired</option>
        </select>

        <select
          value={conditionFilter}
          onChange={(e) =>
            setConditionFilter(e.target.value as 'all' | RentalUnitCondition)
          }
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none"
          aria-label="Filter by condition"
        >
          <option value="all">All Conditions</option>
          <option value="new">New</option>
          <option value="good">Good</option>
          <option value="needs_service">Needs Service</option>
          <option value="damaged">Damaged</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <DataTable
        data={units}
        columns={columns}
        getRowId={(u) => u.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search unit ID, serial #, product, customer, rental ID..."
        exportFilename="buydenmed-rental-units.csv"
        emptyTitle="No rental units found"
        emptyDescription="Adjust filters or register new serialized equipment units."
      />

      {/* Add Single Unit Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">Register Rental Unit</h3>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSingle} className="p-5 space-y-4">
              <FormField label="Rentable Product" required>
                <select
                  required
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className={selectClass}
                >
                  {rentableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Manufacturer Serial Number" required>
                <input
                  type="text"
                  required
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  placeholder="e.g. MP5L-2026-99120"
                  className={`${inputClass} font-mono`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Purchase Date" required>
                  <input
                    type="date"
                    required
                    value={newPurchaseDate}
                    onChange={(e) => setNewPurchaseDate(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
                <FormField label="Initial Condition" required>
                  <select
                    value={newCondition}
                    onChange={(e) =>
                      setNewCondition(e.target.value as RentalUnitCondition)
                    }
                    className={selectClass}
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="needs_service">Needs Service</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Accessories bundled, calibration batch, etc."
                  className={textareaClass}
                />
              </FormField>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Units Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <h3 className="text-base font-semibold text-[#12263F]">Bulk Add Rental Units</h3>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleBulkAdd} className="p-5 space-y-4">
              <FormField label="Rentable Product" required>
                <select
                  required
                  value={bulkProductId}
                  onChange={(e) => setBulkProductId(e.target.value)}
                  className={selectClass}
                >
                  {rentableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Serial Numbers List"
                required
                hint="Enter one serial number per line or comma-separated"
              >
                <textarea
                  required
                  value={bulkSerialsText}
                  onChange={(e) => setBulkSerialsText(e.target.value)}
                  placeholder={'MP5L-2026-99121\nMP5L-2026-99122\nMP5L-2026-99123'}
                  className={`${textareaClass} font-mono text-xs min-h-[120px]`}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Purchase Date" required>
                  <input
                    type="date"
                    required
                    value={bulkPurchaseDate}
                    onChange={(e) => setBulkPurchaseDate(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </FormField>
                <FormField label="Initial Condition" required>
                  <select
                    value={bulkCondition}
                    onChange={(e) =>
                      setBulkCondition(e.target.value as RentalUnitCondition)
                    }
                    className={selectClass}
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                  </select>
                </FormField>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
                >
                  Register All Serials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
