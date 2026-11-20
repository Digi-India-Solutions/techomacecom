import type { Product } from '@/types/admin';
import { INITIAL_PRODUCTS } from './mockData';

/**
 * LEGACY — in-memory product list for admin modules that are still on mock data
 * (Dashboard, Bulk Import, Rental Units). The Catalog pages (Products / Categories /
 * Brands) use the live API in ./products.ts; move these modules to the API when
 * their backend is built, then delete this file.
 */
let store: Product[] = structuredClone(INITIAL_PRODUCTS);

export function getProductsStore(): Product[] {
  return store;
}

export function setProductsStore(next: Product[]): void {
  store = next;
}
