import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  History,
  Minus,
  Plus,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  StockAdjustmentReason,
  StockItem,
  StockMovement,
  StockStatus,
} from '@/types/admin';
import {
  adjustStockItem,
  getStockMovements,
  listStockItems,
} from '@/lib/api/admin/inventory';
import { formatDateTime } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { SafeImage } from '@/components/admin/SafeImage';
import { FormField, inputClass, selectClass } from '@/components/admin/FormField';

export function InventoryStockPage() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') === 'low_stock' ? 'low_or_out' : 'all';

  const { user, can } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus | 'low_or_out'>(initialFilter);
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  // Inline adjust modal
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [delta, setDelta] = useState<number>(1);
  const [reason, setReason] = useState<StockAdjustmentReason>('purchase');
  const [note, setNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Movement history drawer
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(
        await listStockItems({
          search,
          status: statusFilter,
          warehouseId: warehouseFilter,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, warehouseFilter]);

  const openMovementHistory = async (item: StockItem) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      setMovements(await getStockMovements(item.id));
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget || delta === 0) return;
    setAdjusting(true);
    try {
      const updated = await adjustStockItem({
        id: adjustTarget.id,
        delta,
        reason,
        note,
        performedBy: user?.name || 'Admin',
      });
      showToast({
        title: `Stock updated for ${updated.sku}`,
        description: `Available stock is now ${updated.availableStock} units.`,
        variant: 'success',
      });
      setAdjustTarget(null);
      setDelta(1);
      setNote('');
      load();
    } finally {
      setAdjusting(false);
    }
  };

  const canAdjust = can('inventory.adjust');

  const columns: DataTableColumn<StockItem>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product / Variant',
        sortable: true,
        sortValue: (s) => s.productName,
        csvValue: (s) => `${s.productName}${s.variantName ? ` (${s.variantName})` : ''}`,
        render: (s) => (
          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F6F9FD]">
              <SafeImage src={s.imageUrl} alt={s.productName} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#12263F] line-clamp-1">
                {s.productName}
              </p>
              <p className="text-xs text-[#5B6B82] truncate">
                {s.variantName || 'Default Variant'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'sku',
        header: 'SKU',
        sortable: true,
        sortValue: (s) => s.sku,
        csvValue: (s) => s.sku,
        render: (s) => (
          <span className="font-mono text-xs font-semibold text-[#12263F]">{s.sku}</span>
        ),
      },
      {
        key: 'warehouse',
        header: 'Warehouse',
        sortable: true,
        sortValue: (s) => s.warehouseName,
        csvValue: (s) => s.warehouseName,
        render: (s) => (
          <span className="text-xs text-[#5B6B82] whitespace-nowrap">{s.warehouseName}</span>
        ),
      },
      {
        key: 'available',
        header: 'Available',
        align: 'right',
        sortable: true,
        sortValue: (s) => s.availableStock,
        csvValue: (s) => s.availableStock,
        render: (s) => (
          <span
            className={`text-sm font-bold tabular-nums ${
              s.status === 'out_of_stock'
                ? 'text-red-600'
                : s.status === 'low_stock'
                  ? 'text-[#B85A0E]'
                  : 'text-[#12263F]'
            }`}
          >
            {s.availableStock}
          </span>
        ),
      },
      {
        key: 'reserved',
        header: 'Reserved',
        align: 'right',
        sortable: true,
        sortValue: (s) => s.reservedStock,
        csvValue: (s) => s.reservedStock,
        render: (s) => (
          <span className="text-xs font-medium text-[#5B6B82] tabular-nums">
            {s.reservedStock}
          </span>
        ),
      },
      {
        key: 'threshold',
        header: 'Low Threshold',
        align: 'right',
        sortable: true,
        sortValue: (s) => s.lowStockThreshold,
        csvValue: (s) => s.lowStockThreshold,
        render: (s) => (
          <span className="text-xs text-[#5B6B82] tabular-nums">{s.lowStockThreshold}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (s) => s.status,
        csvValue: (s) => s.status,
        render: (s) => <StatusBadge status={s.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (s) => (
          <div className="flex items-center justify-end gap-1.5">
            {canAdjust && (
              <button
                type="button"
                onClick={() => {
                  setAdjustTarget(s);
                  setDelta(1);
                  setReason('purchase');
                  setNote('');
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] whitespace-nowrap"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Adjust
              </button>
            )}
            <button
              type="button"
              onClick={() => openMovementHistory(s)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC] whitespace-nowrap"
            >
              <History className="h-3.5 w-3.5 text-[#5B6B82]" />
              Log
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canAdjust]
  );

  const lowOrOutCount = items.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Inventory — Stock</h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Track sellable warehouse inventory, pending order reservations, and audit stock adjustments.
          </p>
        </div>

        {lowOrOutCount > 0 && (
          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) =>
                prev === 'low_or_out' ? 'all' : 'low_or_out'
              )
            }
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
              statusFilter === 'low_or_out'
                ? 'border-[#F28C38] bg-[#F28C38] text-white'
                : 'border-[#F28C38]/40 bg-[#F28C38]/12 text-[#B85A0E] hover:bg-[#F28C38]/20'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            {lowOrOutCount} Low / Out-of-Stock SKUs
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3.5">
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="rounded-lg border border-[#DCE6F2] bg-white px-3 py-2 text-xs font-medium text-[#12263F] focus:border-[#1D5FAF] focus:outline-none"
          aria-label="Warehouse filter"
        >
          <option value="all">All Warehouses</option>
          <option value="wh-main">Main Warehouse (Okhla, Delhi)</option>
        </select>

        <div className="inline-flex items-center rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-1">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'in_stock', label: 'In Stock' },
              { key: 'low_or_out', label: 'Low & Out' },
              { key: 'out_of_stock', label: 'Out of Stock' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-white text-[#12263F] shadow-sm'
                  : 'text-[#5B6B82] hover:text-[#12263F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={items}
        columns={columns}
        getRowId={(s) => s.id}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product, variant, or SKU..."
        exportFilename="buydenmed-warehouse-stock.csv"
        emptyTitle="No stock records match"
        emptyDescription="Clear filters to view all warehouse inventory."
      />

      {/* Inline Stock Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#DCE6F2] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#12263F]">Adjust Stock</h3>
                <p className="text-xs font-mono text-[#5B6B82] truncate">{adjustTarget.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="rounded-lg p-1 text-[#5B6B82] hover:bg-[#EAF2FC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#12263F]">{adjustTarget.productName}</p>
                  <p className="text-[#5B6B82]">{adjustTarget.warehouseName}</p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-[#5B6B82]">Current</p>
                  <p className="text-base font-bold text-[#12263F]">
                    {adjustTarget.availableStock}
                  </p>
                </div>
              </div>

              <FormField label="Quantity Delta (+ add / - deduct)" required>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDelta((d) => d - 1)}
                    className="rounded-lg border border-[#DCE6F2] bg-white p-2.5 text-[#12263F] hover:bg-[#EAF2FC]"
                    aria-label="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    required
                    value={delta}
                    onChange={(e) => setDelta(Number(e.target.value))}
                    className={`${inputClass} text-center font-semibold tabular-nums`}
                  />
                  <button
                    type="button"
                    onClick={() => setDelta((d) => d + 1)}
                    className="rounded-lg border border-[#DCE6F2] bg-white p-2.5 text-[#12263F] hover:bg-[#EAF2FC]"
                    aria-label="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-[#5B6B82] tabular-nums">
                  Resulting available stock:{' '}
                  <strong className="text-[#1D5FAF]">
                    {Math.max(0, adjustTarget.availableStock + delta)}
                  </strong>
                </p>
              </FormField>

              <FormField label="Adjustment Reason" required>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
                  className={selectClass}
                >
                  <option value="purchase">Purchase / Inbound PO</option>
                  <option value="return">Customer Return Restock</option>
                  <option value="damage">Damage / QC Rejection</option>
                  <option value="correction">Cycle Count Correction</option>
                </select>
              </FormField>

              <FormField label="Reference / Note">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. PO-2026-1192 or physical audit note"
                  className={inputClass}
                />
              </FormField>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting || delta === 0}
                  className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50"
                >
                  {adjusting ? 'Updating...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement History Drawer */}
      <Drawer
        open={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        title="Stock Movement Log"
        subtitle={historyItem ? `${historyItem.sku} · ${historyItem.productName}` : ''}
      >
        {loadingHistory ? (
          <p className="text-xs text-[#5B6B82]">Loading stock movements...</p>
        ) : movements.length === 0 ? (
          <p className="text-xs text-[#5B6B82]">
            No manual stock movements recorded yet for this SKU.
          </p>
        ) : (
          <div className="space-y-3">
            {movements.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-white border border-[#DCE6F2] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#12263F]">
                    {m.reason}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      m.delta >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {m.delta >= 0 ? `+${m.delta}` : m.delta}
                  </span>
                </div>
                <p className="text-xs text-[#12263F]">{m.note}</p>
                <div className="flex items-center justify-between text-[11px] text-[#5B6B82] tabular-nums">
                  <span>
                    {m.previousStock} → <strong>{m.newStock}</strong> · {m.performedBy}
                  </span>
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
