import type { Product, ProductFilters, ProductFormPayload } from '@/types/admin';
import { mockDelay, slugify } from './client';
import { INITIAL_BRANDS, INITIAL_PRODUCTS } from './mockData';
import { getCategoryPathById } from './categories';

let productsStore: Product[] = structuredClone(INITIAL_PRODUCTS);

export function getProductsStore(): Product[] {
  return productsStore;
}

export function setProductsStore(next: Product[]): void {
  productsStore = next;
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  await mockDelay(140);
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
  await mockDelay(120);
  const found = productsStore.find((p) => p.id === id);
  return found ? structuredClone(found) : null;
}

export async function createProduct(payload: ProductFormPayload): Promise<Product> {
  await mockDelay(200);
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

export async function updateProduct(id: string, payload: ProductFormPayload): Promise<Product> {
  await mockDelay(200);
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

export async function duplicateProduct(id: string): Promise<Product> {
  await mockDelay(180);
  const original = productsStore.find((p) => p.id === id);
  if (!original) throw new Error('Product not found');

  const now = new Date().toISOString();
  const copySuffix = Math.floor(100 + Math.random() * 900);
  const duplicated: Product = {
    ...structuredClone(original),
    id: `prod-${Date.now()}`,
    name: `${original.name} (Copy)`,
    slug: `${original.slug}-copy-${copySuffix}`,
    sku: `${original.sku}-COPY-${copySuffix}`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  productsStore = [duplicated, ...productsStore];
  return structuredClone(duplicated);
}

export async function deleteProduct(id: string): Promise<void> {
  await mockDelay(150);
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

