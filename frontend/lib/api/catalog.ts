import type { Brand, Category, FilterOptions, Product } from '@/types';
import { ApiClientError, publicGet } from './backend';

/**
 * Storefront catalog — live data from the API (backend/src/modules/catalog/storefront).
 * Everything here is what the admin saved: only active products under active
 * brands and visible categories ever come back.
 *
 *   GET /categories              GET /categories/:slug
 *   GET /brands                  GET /brands/:slug
 *   GET /products?…filters       GET /products/:slug      GET /products/:id/related
 *   GET /search/suggestions?q=
 *
 * Lists degrade to [] if the API is unreachable (the page still renders);
 * single-item lookups return null on 404 so pages can call notFound().
 */

const MAX_LIMIT = 100; // API maximum per page

async function list<T>(path: string, label: string): Promise<T[]> {
  try {
    return (await publicGet<T[]>(path)).data;
  } catch (err) {
    console.error(`[catalog] ${label} failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function one<T>(path: string): Promise<T | null> {
  try {
    return (await publicGet<T>(path)).data;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}

const slugPath = (slug: string) => encodeURIComponent((slug || '').toLowerCase().trim());

// ---------------------------------------------------------------------------
// Categories & brands
// ---------------------------------------------------------------------------

/** Visible Level-1 categories with their subcategories (menus, home tiles). */
export async function getCategories(): Promise<Category[]> {
  return list<Category>('/categories', 'categories');
}

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  'dental-equipment': 'dental-chairs',
  'dental': 'dental-chairs',
  'dental-autoclave': 'dental-autoclaves',
  'respiratory-care': 'oxygen-concentrators',
  'respiratory': 'oxygen-concentrators',
  'sleep-apnea-therapy': 'bipap-cpap',
  'sleep-apnea': 'bipap-cpap',
  'cpap-bipap': 'bipap-cpap',
  'diagnostic-monitoring': 'patient-monitors',
  'patient-monitoring': 'patient-monitors',
  'hospital-furniture': 'icu-beds',
  'mobility': 'manual-wheelchairs',
  'wheelchairs': 'manual-wheelchairs',
};

/** Any visible category (Level 1–3) by slug, with breadcrumbs & alias resolution. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!slug) return null;
  const direct = await one<Category>(`/categories/${slugPath(slug)}`);
  if (direct) return direct;

  const cleanSlug = slug.toLowerCase().trim();
  const alias = CATEGORY_SLUG_ALIASES[cleanSlug];
  if (alias) {
    const aliased = await one<Category>(`/categories/${slugPath(alias)}`);
    if (aliased) return aliased;
  }

  // Also try exact ID match, subcategory match, or partial match against list of categories
  try {
    const all = await getCategories();
    const rawId = cleanSlug.replace(/^cat-/, '');

    for (const c of all) {
      if (String(c.id).toLowerCase() === cleanSlug || String(c.id).replace(/^cat-/, '') === rawId) {
        return c;
      }
      if (c.slug && c.slug.toLowerCase() === cleanSlug) {
        return c;
      }
      if (c.subCategories?.length) {
        for (const sub of c.subCategories) {
          if (
            String(sub.id).toLowerCase() === cleanSlug ||
            String(sub.id).replace(/^cat-/, '') === rawId ||
            (sub.slug && sub.slug.toLowerCase() === cleanSlug)
          ) {
            const fullSub = await one<Category>(`/categories/${slugPath(sub.slug)}`);
            if (fullSub) return fullSub;
            return {
              id: String(sub.id),
              name: sub.name,
              slug: sub.slug,
              icon: sub.icon || c.icon || '',
              image: sub.image || c.image || '',
              description: '',
              itemCount: sub.itemCount || 0,
              subCategories: [],
              breadcrumbs: [
                { id: String(c.id), name: c.name, slug: c.slug },
                { id: String(sub.id), name: sub.name, slug: sub.slug },
              ],
            };
          }
        }
      }
    }

    const clean = cleanSlug.replace(/[-_]/g, '');
    const found = all.find((c) => {
      const cs = (c.slug || '').toLowerCase().replace(/[-_]/g, '');
      const cn = (c.name || '').toLowerCase().replace(/[-_]/g, '');
      return cs.includes(clean) || clean.includes(cs) || cn.includes(clean) || clean.includes(cn);
    });
    if (found) return found;
  } catch {}

  return null;
}

export async function getBrands(options: { featured?: boolean } = {}): Promise<Brand[]> {
  return list<Brand>(`/brands${options.featured ? '?featured=true' : ''}`, 'brands');
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  if (!slug) return null;
  return one<Brand>(`/brands/${slugPath(slug)}`);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const SORT_MAP: Record<NonNullable<FilterOptions['sortBy']>, string> = {
  popularity: 'popularity',
  'price-asc': 'price-asc',
  'price-desc': 'price-desc',
  newest: 'newest',
  discount: 'discount',
};

function productQuery(options: ProductListOptions): string {
  const params = new URLSearchParams();
  const set = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) params.set(key, String(value));
  };
  set('categoryId', options.categoryId);
  set('sub', options.subCategorySlug);
  if (options.brandIds?.length) set('brandIds', options.brandIds.join(','));
  set('minPrice', options.minPrice);
  set('maxPrice', options.maxPrice);
  set('minDiscount', options.minDiscount);
  set('inStock', options.inStockOnly);
  set('rent', options.rentOnly);
  set('emi', options.emiOnly);
  set('q', options.query?.trim());
  set('sort', options.sortBy ? SORT_MAP[options.sortBy] : undefined);
  set('page', options.page);
  set('limit', Math.min(options.limit || 24, MAX_LIMIT));
  // flags used by the home page rows
  set('deal', options.deal);
  set('bestSeller', options.bestSeller);
  set('newArrival', options.newArrival);
  set('featured', options.featured);
  return params.toString();
}

type ProductListOptions = FilterOptions & {
  deal?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
};

/** Filtered + sorted + paginated products (filtering runs on the server). */
export async function getProducts(options: ProductListOptions = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const { data, meta } = await publicGet<Product[]>(`/products?${productQuery(options)}`);
    return {
      products: data,
      total: meta?.total ?? data.length,
      page: meta?.page ?? 1,
      totalPages: meta?.totalPages ?? 1,
    };
  } catch (err) {
    console.error('[catalog] products failed:', err instanceof Error ? err.message : err);
    return { products: [], total: 0, page: options.page || 1, totalPages: 1 };
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;
  return one<Product>(`/products/${slugPath(slug)}`);
}

/** Same subcategory first, then the same top-level category. */
export async function getRelatedProducts(productId: string, _categoryId?: string, limit = 4): Promise<Product[]> {
  return list<Product>(`/products/${encodeURIComponent(productId)}/related?limit=${limit}`, 'related products');
}

/** Products with a running Deal of the Day. */
export async function getDealsOfTheDay(): Promise<Product[]> {
  return (await getProducts({ deal: true, limit: 20, sortBy: 'discount' })).products;
}

export async function getBestSellers(): Promise<Product[]> {
  const res = await getProducts({ bestSeller: true, limit: 24, sortBy: 'popularity' });
  if (res.products && res.products.length > 0) {
    return res.products;
  }
  // Fallback: If no products are explicitly tagged with bestSeller in DB,
  // return top products sorted by popularity so best-sellers is NEVER empty!
  return (await getProducts({ limit: 24, sortBy: 'popularity' })).products;
}

export async function getNewArrivals(): Promise<Product[]> {
  const res = await getProducts({ newArrival: true, limit: 24, sortBy: 'newest' });
  if (res.products && res.products.length > 0) {
    return res.products;
  }
  return (await getProducts({ limit: 24, sortBy: 'newest' })).products;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const res = await getProducts({ featured: true, limit: 24 });
  if (res.products && res.products.length > 0) {
    return res.products;
  }
  return (await getProducts({ limit: 24, sortBy: 'popularity' })).products;
}

/** Products available on rent (at least one active rental plan). */
export async function getRentableProducts(): Promise<Product[]> {
  return (await getProducts({ rentOnly: true, limit: MAX_LIMIT })).products;
}

export interface SearchSuggestions {
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnail: string;
    brandName: string;
    rentEnabled?: boolean;
    rentPricePerMonth?: number | null;
  }[];
  categories: { id: string; name: string; slug: string; path?: string }[];
  brands: { id: string; name: string; slug: string }[];
}

/** Header autocomplete. */
export async function searchSuggestions(query: string): Promise<SearchSuggestions> {
  const q = query.trim();
  if (!q) return { products: [], categories: [], brands: [] };
  try {
    return (await publicGet<SearchSuggestions>(`/search/suggestions?q=${encodeURIComponent(q.slice(0, 100))}`)).data;
  } catch {
    return { products: [], categories: [], brands: [] };
  }
}
