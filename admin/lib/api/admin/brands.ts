import type { Brand, BrandPayload } from '@/types/admin';
import { adminDelete, adminGet, adminPost, adminPut } from './client';

// ---------------------------------------------------------------------------
// Live API — backend/src/modules/catalog/brands (/api/v1/admin/brands)
// ---------------------------------------------------------------------------

/** All brands (active + inactive) with product counts, sorted by name. */
export async function listBrands(): Promise<Brand[]> {
  return adminGet<Brand[]>('/admin/brands');
}

function toBody(payload: BrandPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    logoUrl: payload.logoUrl || '',
    desktopBannerUrl: payload.desktopBannerUrl || '',
    mobileBannerUrl: payload.mobileBannerUrl || '',
    description: payload.description || '',
    originCountry: payload.originCountry || '',
    authorizedDistributor: Boolean(payload.authorizedDistributor),
    featuredOnHomepage: payload.featuredOnHomepage,
    status: payload.status,
    seoTitle: payload.seoTitle || '',
    seoDescription: payload.seoDescription || '',
  };
}

export async function saveBrand(payload: BrandPayload): Promise<Brand> {
  return payload.id
    ? adminPut<Brand>(`/admin/brands/${payload.id}`, toBody(payload))
    : adminPost<Brand>('/admin/brands', toBody(payload));
}

/** Soft delete. The API refuses (409) while products are linked to the brand. */
export async function deleteBrand(id: string): Promise<void> {
  await adminDelete(`/admin/brands/${id}`);
}
