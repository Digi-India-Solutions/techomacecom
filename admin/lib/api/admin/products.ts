import type { Product, ProductFilters, ProductFormPayload, StockItem } from '@/types/admin';
import { adminDelete, adminGet, adminPost, adminPut, mockDelay, slugify } from './client';
import { INITIAL_BRANDS, INITIAL_PRODUCTS } from './mockData';
import { getCategoryPathById } from './categories';
import {
  adjustStockItem,
  getStockItemsStore,
  listStockItems,
  onStockChange,
} from './inventory';

let productsStore: Product[] = structuredClone(INITIAL_PRODUCTS);

export function syncProductsWithInventory(stockItems: StockItem[]): void {
  if (!stockItems || stockItems.length === 0) return;

  const stockMap = new Map<string, StockItem>();
  for (const item of stockItems) {
    if (item.sku) stockMap.set(item.sku.trim().toUpperCase(), item);
  }

  productsStore = productsStore.map((prod) => {
    let hasChanges = false;
    let threshold = prod.lowStockThreshold;

    const updatedVariants = (prod.variants || []).map((v) => {
      const matched = stockMap.get(v.sku.trim().toUpperCase());
      if (matched) {
        hasChanges = true;
        threshold = matched.lowStockThreshold;
        return {
          ...v,
          stock: matched.availableStock,
        };
      }
      return v;
    });

    let totalStock = prod.stock;
    let totalReserved = prod.reservedStock;

    if (updatedVariants.length > 0) {
      const anyMatched = updatedVariants.some((v) => stockMap.has(v.sku.trim().toUpperCase()));
      if (anyMatched) {
        hasChanges = true;
        totalStock = updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
        totalReserved = updatedVariants.reduce((sum, v) => {
          const m = stockMap.get(v.sku.trim().toUpperCase());
          return sum + (m ? m.reservedStock : 0);
        }, 0);
      }
    } else {
      const matched = stockMap.get(prod.sku.trim().toUpperCase());
      if (matched) {
        hasChanges = true;
        totalStock = matched.availableStock;
        totalReserved = matched.reservedStock;
        threshold = matched.lowStockThreshold;
      }
    }

    if (!hasChanges) return prod;

    return {
      ...prod,
      stock: totalStock,
      reservedStock: totalReserved,
      lowStockThreshold: threshold,
      variants: updatedVariants,
    };
  });
}

// Automatically subscribe to inventory stock adjustments
onStockChange(syncProductsWithInventory);

export function getProductsStore(): Product[] {
  return productsStore;
}

export function setProductsStore(next: Product[]): void {
  productsStore = next;
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.categoryId && filters.categoryId !== 'all') params.set('categoryId', filters.categoryId);
  if (filters?.brandId && filters.brandId !== 'all') params.set('brandId', filters.brandId);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.stockLevel && filters.stockLevel !== 'all') params.set('stockLevel', filters.stockLevel);

  try {
    const query = params.toString() ? `?${params.toString()}` : '';
    const serverProducts = await adminGet<Product[]>(`/admin/products${query}`);
    if (serverProducts && Array.isArray(serverProducts) && serverProducts.length > 0) {
      const serverIds = new Set(serverProducts.map((p) => p.id));
      const serverSkus = new Set(serverProducts.map((p) => p.sku));
      const remaining = productsStore.filter((p) => !serverIds.has(p.id) && !serverSkus.has(p.sku));
      productsStore = [...serverProducts, ...remaining];
      return serverProducts;
    }
  } catch {
    // Backend unreachable or returned empty, fallback to local store
  }

  try {
    const cached = getStockItemsStore();
    const stockItems = cached.length > 0 ? cached : await listStockItems();
    if (stockItems && stockItems.length > 0) {
      syncProductsWithInventory(stockItems);
    }
  } catch {}

  let list = [...productsStore];

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.categoryPath.toLowerCase().includes(q)
    );
  }

  if (filters?.categoryId && filters.categoryId !== 'all') {
    list = list.filter((p) => p.categoryId === filters.categoryId);
  }

  if (filters?.brandId && filters.brandId !== 'all') {
    list = list.filter((p) => p.brandId === filters.brandId);
  }

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((p) => p.status === filters.status);
  }

  if (filters?.stockLevel && filters.stockLevel !== 'all') {
    if (filters.stockLevel === 'out_of_stock') {
      list = list.filter((p) => p.stock === 0);
    } else if (filters.stockLevel === 'low_stock') {
      list = list.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
    } else if (filters.stockLevel === 'in_stock') {
      list = list.filter((p) => p.stock > p.lowStockThreshold);
    }
  }

  if (filters?.emiEnabled) {
    list = list.filter((p) => p.emiEnabled);
  }
  if (filters?.rentEnabled) {
    list = list.filter((p) => p.showAvailableOnRent || p.rental.enabled);
  }
  if (filters?.codEnabled) {
    list = list.filter((p) => p.codEnabled);
  }

  return list;
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const serverProduct = await adminGet<Product>(`/admin/products/${id}`);
    if (serverProduct) {
      productsStore = [serverProduct, ...productsStore.filter((p) => p.id !== serverProduct.id)];
      return structuredClone(serverProduct);
    }
  } catch {
    // fallback
  }

  const cached = getStockItemsStore();
  if (cached.length > 0) {
    syncProductsWithInventory(cached);
  }
  const found = productsStore.find((p) => p.id === id || p.slug === id);
  return found ? structuredClone(found) : null;
}

export async function createProduct(payload: ProductFormPayload): Promise<Product> {
  try {
    const created = await adminPost<Product>('/admin/products', payload);
    productsStore = [created, ...productsStore.filter((p) => p.id !== created.id)];
    listStockItems().catch(() => {});
    return created;
  } catch (err) {
    console.warn('Backend createProduct failed, falling back to local store:', err);
    const brand = INITIAL_BRANDS.find((b) => b.id === payload.brandId);
    const categoryPath = getCategoryPathById(payload.categoryId) || 'Uncategorized';

    const now = new Date().toISOString();
    const created: Product = {
      ...structuredClone(payload),
      id: `prod-${Date.now()}`,
      slug: payload.slug || slugify(payload.name),
      brandName: brand?.name || 'Buy Denmed',
      categoryPath,
      createdAt: now,
      updatedAt: now,
    };

    productsStore = [created, ...productsStore];
    return structuredClone(created);
  }
}

export async function updateProduct(id: string, payload: ProductFormPayload): Promise<Product> {
  try {
    const updated = await adminPut<Product>(`/admin/products/${id}`, payload);
    productsStore = productsStore.map((p) => (p.id === id ? updated : p));
    listStockItems().catch(() => {});
    return updated;
  } catch (err) {
    console.warn('Backend updateProduct failed, updating local store:', err);
    const idx = productsStore.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const brand = INITIAL_BRANDS.find((b) => b.id === payload.brandId);
    const categoryPath = getCategoryPathById(payload.categoryId) || productsStore[idx].categoryPath;

    const updated: Product = {
      ...productsStore[idx],
      ...structuredClone(payload),
      id,
      brandName: brand?.name || productsStore[idx].brandName,
      categoryPath,
      updatedAt: new Date().toISOString(),
    };

    productsStore = productsStore.map((p) => (p.id === id ? updated : p));
    return structuredClone(updated);
  }
}

export async function duplicateProduct(id: string): Promise<Product> {
  await mockDelay(180);
  const original = await getProductById(id);
  if (!original) throw new Error('Product not found');

  const copySuffix = Math.floor(100 + Math.random() * 900);
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original;

  return await createProduct({
    ...rest,
    name: `${original.name} (Copy)`,
    slug: `${original.slug}-copy-${copySuffix}`,
    sku: `${original.sku}-COPY-${copySuffix}`,
    status: 'draft',
  });
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await adminDelete(`/admin/products/${id}`);
  } catch (err) {
    console.warn('Backend deleteProduct failed, removing from local store:', err);
  }
  productsStore = productsStore.filter((p) => p.id !== id);
}

export async function bulkUpdateProducts(
  action: 'activate' | 'deactivate' | 'delete' | 'change_category',
  ids: string[],
  categoryId?: string
): Promise<Product[]> {
  await mockDelay(200);
  if (action === 'delete') {
    productsStore = productsStore.filter((p) => !ids.includes(p.id));
  } else if (action === 'activate') {
    productsStore = productsStore.map((p) =>
      ids.includes(p.id) ? { ...p, status: 'active', updatedAt: new Date().toISOString() } : p
    );
  } else if (action === 'deactivate') {
    productsStore = productsStore.map((p) =>
      ids.includes(p.id) ? { ...p, status: 'draft', updatedAt: new Date().toISOString() } : p
    );
  } else if (action === 'change_category' && categoryId) {
    const path = getCategoryPathById(categoryId) || 'Uncategorized';
    productsStore = productsStore.map((p) =>
      ids.includes(p.id)
        ? { ...p, categoryId, categoryPath: path, updatedAt: new Date().toISOString() }
        : p
    );
  }

  return structuredClone(productsStore);
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function validateVariantImageFile(file: File): string | null {
  const typeValid =
    ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
    ALLOWED_IMAGE_EXTENSIONS.test(file.name);
  if (!typeValid) {
    return 'Only JPG, JPEG, PNG, or WEBP images are allowed.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image size must be 2 MB or less.';
  }
  return null;
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const error = validateVariantImageFile(file);
  if (error) {
    throw new Error(error);
  }
  await mockDelay(120);
  return { url: URL.createObjectURL(file) };
}

export function getExternalCatalogSkus(excludeProductId?: string): string[] {
  const skus: string[] = [];
  for (const p of productsStore) {
    if (excludeProductId && p.id === excludeProductId) continue;
    if (p.sku?.trim()) skus.push(p.sku.trim().toUpperCase());
    for (const v of p.variants) {
      if (v.sku?.trim()) skus.push(v.sku.trim().toUpperCase());
    }
  }
  return skus;
}

export const api = {
  admin: {
    uploadImage,
  },
};

