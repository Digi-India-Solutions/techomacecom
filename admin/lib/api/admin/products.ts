import type { Product, ProductFilters, ProductFormPayload } from '@/types/admin';
import { AdminApiError, adminDelete, adminFetch, adminGet, adminPost, adminPut, uploadImages } from './client';

// ---------------------------------------------------------------------------
// Live API — backend/src/modules/catalog/products (/api/v1/admin/products)
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100; // API maximum
const MAX_PAGES = 50; // safety stop (5 000 products) for pages that load "everything"

function toQuery(filters: ProductFilters | undefined, page: number): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (filters?.search?.trim()) params.set('q', filters.search.trim());
  if (filters?.categoryId && filters.categoryId !== 'all') params.set('categoryId', filters.categoryId);
  if (filters?.brandId && filters.brandId !== 'all') params.set('brandId', filters.brandId);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.stockLevel && filters.stockLevel !== 'all') params.set('stockLevel', filters.stockLevel);
  if (filters?.emiEnabled) params.set('emi', 'true');
  if (filters?.rentEnabled) params.set('rent', 'true');
  if (filters?.codEnabled) params.set('cod', 'true');
  return params.toString();
}

/**
 * Products matching the filters (filtering + search run on the server).
 * The admin tables paginate on the client, so this follows the API's pages.
 */
export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, meta } = await adminFetch<Product[]>(`/admin/products?${toQuery(filters, page)}`);
    all.push(...data);
    if (!meta || page * PAGE_SIZE >= meta.total) break;
  }
  return all;
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await adminGet<Product>(`/admin/products/${id}`);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) return null;
    throw err;
  }
}

export async function createProduct(payload: ProductFormPayload): Promise<Product> {
  return adminPost<Product>('/admin/products', payload);
}

export async function updateProduct(id: string, payload: ProductFormPayload): Promise<Product> {
  return adminPut<Product>(`/admin/products/${id}`, payload);
}

/** Copies a product as a draft (stock 0, new slug + SKUs). */
export async function duplicateProduct(id: string): Promise<Product> {
  return adminPost<Product>(`/admin/products/${id}/duplicate`);
}

/** Soft delete — the product disappears from admin + storefront; order history keeps it. */
export async function deleteProduct(id: string): Promise<void> {
  await adminDelete(`/admin/products/${id}`);
}

export async function bulkUpdateProducts(
  action: 'activate' | 'deactivate' | 'delete' | 'change_category',
  ids: string[],
  categoryId?: string
): Promise<{ count: number; message: string }> {
  return adminPost('/admin/products/bulk', { action, ids, ...(categoryId ? { categoryId } : {}) });
}

/** Is this SKU free across all other products and variants? */
export async function checkSkuAvailable(sku: string, excludeProductId?: string): Promise<boolean> {
  const params = new URLSearchParams({ sku });
  if (excludeProductId) params.set('excludeProductId', excludeProductId);
  const res = await adminGet<{ available: boolean }>(`/admin/products/sku-check?${params}`);
  return res.available;
}

/** Storefront URL of a product (for "Preview on site"). */
export function storefrontProductUrl(slug: string): string {
  const base =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_STOREFRONT_URL as string | undefined)) ||
    'http://localhost:3000';
  return `${base.replace(/\/+$/, '')}/product/${slug}`;
}

// ---------------------------------------------------------------------------
// Variant images
// ---------------------------------------------------------------------------

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

/** Uploads one image to the server (stored as WebP) and returns its URL + stored path. */
export async function uploadImage(file: File): Promise<{ url: string; path: string }> {
  const error = validateVariantImageFile(file);
  if (error) throw new Error(error);
  const [uploaded] = await uploadImages([file], 'products');
  return { url: uploaded.url, path: uploaded.path };
}

export const api = {
  admin: {
    uploadImage,
  },
};
