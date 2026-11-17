import type { Brand, BrandPayload } from '@/types/admin';
import { mockDelay, slugify } from './client';
import { INITIAL_BRANDS } from './mockData';

let brandsStore: Brand[] = structuredClone(INITIAL_BRANDS);

export async function listBrands(): Promise<Brand[]> {
  await mockDelay(120);
  return structuredClone(brandsStore);
}

export async function saveBrand(payload: BrandPayload): Promise<Brand> {
  await mockDelay(180);
  const now = new Date().toISOString();

  if (payload.id) {
    const existing = brandsStore.find((b) => b.id === payload.id);
    if (!existing) throw new Error('Brand not found');
    const updated: Brand = {
      ...existing,
      ...payload,
      id: payload.id,
      slug: payload.slug || slugify(payload.name),
      updatedAt: now,
    };
    brandsStore = brandsStore.map((b) => (b.id === payload.id ? updated : b));
    return structuredClone(updated);
  }

  const created: Brand = {
    ...payload,
    id: `brand-${Date.now()}`,
    slug: payload.slug || slugify(payload.name),
    productCount: 0,
    updatedAt: now,
  };
  brandsStore = [created, ...brandsStore];
  return structuredClone(created);
}

export async function deleteBrand(id: string): Promise<void> {
  await mockDelay(140);
  const target = brandsStore.find((b) => b.id === id);
  if (target && target.productCount > 0) {
    throw new Error(
      `Cannot delete "${target.name}" while ${target.productCount} products are linked to it.`
    );
  }
  brandsStore = brandsStore.filter((b) => b.id !== id);
}
