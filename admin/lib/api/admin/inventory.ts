import type { StockAdjustmentReason, StockItem, StockMovement, StockStatus } from '@/types/admin';
import { adminGet, adminPost, downloadCsv } from './client';

let cachedStockItems: StockItem[] = [];

type StockChangeListener = (items: StockItem[]) => void;
const stockListeners = new Set<StockChangeListener>();

export function onStockChange(listener: StockChangeListener): () => void {
  stockListeners.add(listener);
  return () => stockListeners.delete(listener);
}

function notifyStockChanged(items: StockItem[]): void {
  stockListeners.forEach((fn) => {
    try {
      fn(items);
    } catch (err) {
      console.error('Error in stock change listener:', err);
    }
  });
}

export function getStockItemsStore(): StockItem[] {
  return cachedStockItems;
}

export function setStockItemsStore(items: StockItem[]): void {
  cachedStockItems = items;
  notifyStockChanged(cachedStockItems);
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
}

export async function listWarehouses(): Promise<WarehouseOption[]> {
  return await adminGet<WarehouseOption[]>('/admin/inventory/warehouses');
}

export async function listStockItems(filters?: {
  search?: string;
  status?: 'all' | StockStatus | 'low_or_out';
  warehouseId?: string;
}): Promise<StockItem[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.warehouseId) params.set('warehouseId', filters.warehouseId);

  const query = params.toString() ? `?${params.toString()}` : '';
  const items = await adminGet<StockItem[]>(`/admin/inventory/stock${query}`);
  cachedStockItems = items;
  notifyStockChanged(items);
  return items;
}

export async function adjustStockItem(params: {
  id: string;
  delta?: number;
  availableStock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  reason: StockAdjustmentReason;
  note?: string;
  performedBy?: string;
}): Promise<StockItem> {
  const payload: Record<string, unknown> = {
    reason: params.reason,
    note: params.note || '',
  };
  if (params.delta !== undefined) payload.delta = params.delta;
  if (params.availableStock !== undefined) payload.availableStock = params.availableStock;
  if (params.reservedStock !== undefined) payload.reservedStock = params.reservedStock;
  if (params.lowStockThreshold !== undefined) payload.lowStockThreshold = params.lowStockThreshold;

  const updated = await adminPost<StockItem>(`/admin/inventory/stock/${params.id}/adjust`, payload);

  cachedStockItems = cachedStockItems.map((item) =>
    item.id === updated.id ? updated : item
  );
  notifyStockChanged(cachedStockItems);

  return updated;
}

export async function getStockMovements(stockItemId: string): Promise<StockMovement[]> {
  return await adminGet<StockMovement[]>(`/admin/inventory/stock/${stockItemId}/movements`);
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
