import type { StockAdjustmentReason, StockItem, StockMovement, StockStatus } from '@/types/admin';
import { downloadCsv, mockDelay } from './client';
import { INITIAL_STOCK_ITEMS, INITIAL_STOCK_MOVEMENTS } from './mockData';

let stockItemsStore: StockItem[] = structuredClone(INITIAL_STOCK_ITEMS);
let stockMovementsStore: StockMovement[] = structuredClone(INITIAL_STOCK_MOVEMENTS);

export function getStockItemsStore(): StockItem[] {
  return stockItemsStore;
}

function computeStockStatus(available: number, threshold: number): StockStatus {
  if (available <= 0) return 'out_of_stock';
  if (available <= threshold) return 'low_stock';
  return 'in_stock';
}

export async function listStockItems(filters?: {
  search?: string;
  status?: 'all' | StockStatus | 'low_or_out';
  warehouseId?: string;
}): Promise<StockItem[]> {
  await mockDelay(130);
  let list = [...stockItemsStore];

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.variantName && item.variantName.toLowerCase().includes(q))
    );
  }

  if (filters?.warehouseId && filters.warehouseId !== 'all') {
    list = list.filter((item) => item.warehouseId === filters.warehouseId);
  }

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'low_or_out') {
      list = list.filter((item) => item.status === 'low_stock' || item.status === 'out_of_stock');
    } else {
      list = list.filter((item) => item.status === filters.status);
    }
  }

  return structuredClone(list);
}

export async function adjustStockItem(params: {
  id: string;
  delta: number;
  reason: StockAdjustmentReason;
  note: string;
  performedBy: string;
}): Promise<StockItem> {
  await mockDelay(160);
  const existing = stockItemsStore.find((s) => s.id === params.id);
  if (!existing) throw new Error('Stock item not found');

  const nextAvailable = Math.max(0, existing.availableStock + params.delta);
  const now = new Date().toISOString();

  const updated: StockItem = {
    ...existing,
    availableStock: nextAvailable,
    status: computeStockStatus(nextAvailable, existing.lowStockThreshold),
    updatedAt: now,
  };

  stockItemsStore = stockItemsStore.map((s) => (s.id === params.id ? updated : s));

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    stockItemId: existing.id,
    sku: existing.sku,
    delta: nextAvailable - existing.availableStock,
    previousStock: existing.availableStock,
    newStock: nextAvailable,
    reason: params.reason,
    note: params.note || `Adjusted by ${params.delta > 0 ? `+${params.delta}` : params.delta}`,
    performedBy: params.performedBy,
    createdAt: now,
  };
  stockMovementsStore = [movement, ...stockMovementsStore];

  return structuredClone(updated);
}

export async function getStockMovements(stockItemId: string): Promise<StockMovement[]> {
  await mockDelay(100);
  return structuredClone(
    stockMovementsStore.filter((m) => m.stockItemId === stockItemId)
  );
}

export function exportStockCsv(items: StockItem[]): void {
  downloadCsv(
    `buydenmed-stock-${new Date().toISOString().slice(0, 10)}.csv`,
    ['SKU', 'Product', 'Variant', 'Warehouse', 'Available', 'Reserved', 'Low Threshold', 'Status'],
    items.map((s) => [
      s.sku,
      s.productName,
      s.variantName || 'Default',
      s.warehouseName,
      s.availableStock,
      s.reservedStock,
      s.lowStockThreshold,
      s.status,
    ])
  );
}
