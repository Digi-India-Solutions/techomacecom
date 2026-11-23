import prisma from "../../../../db/db.js";
import { ApiError } from "../../../lib/http.js";
import { imageOut } from "../shared.js";
import { getCategoryIndex } from "../category-index.js";
import { productInclude, toStorefrontProduct } from "../products/dto.js";
import { searchProductIds, loadInOrder } from "../products/query.js";

/**
 * Public catalog for the storefront (no login).
 *
 * Visibility rules applied everywhere here:
 *   product   status "active", not deleted, default variant active
 *   brand     status "active", not deleted
 *   category  active AND every ancestor active (see category-index.js)
 * Drafts, inactive and deleted records never leave this service.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** Where-clause for "a shopper can see this product" (Prisma query API version). */
function visibleProductWhere(index) {
  return {
    deleted_at: null,
    status: "active",
    brand: { status: "active", deleted_at: null },
    category_id: { in: index.allVisibleIds() },
  };
}

/** Visible products per category id (own products only). */
async function visibleCountsByCategory(index) {
  const groups = await prisma.product.groupBy({
    by: ["category_id"],
    where: visibleProductWhere(index),
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [String(g.category_id), g._count._all]));
}

/** Category info the product card / page needs (top level, subcategory, breadcrumb). */
function categoryInfo(index, categoryId) {
  const chain = index.ancestry(categoryId);
  return {
    top: chain[0] || null,
    sub: chain[1] || null,
    path: chain.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug })),
  };
}

async function productsFromIds(ids, index, opts) {
  const rows = await loadInOrder(ids, productInclude());
  return rows.map((p) => toStorefrontProduct(p, categoryInfo(index, p.category_id), opts));
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function toCategory(row, index, counts) {
  const id = String(row.id);
  const visibleChildren = (index.childrenOf.get(id) || []).filter((c) => index.visible.has(String(c.id)));
  const itemCount = index.subtreeIds(id).reduce((sum, x) => sum + (index.visible.has(x) ? counts.get(x) || 0 : 0), 0);

  return {
    id,
    name: row.name,
    slug: row.slug,
    level: row.level,
    parentId: row.parent_id ? String(row.parent_id) : null,
    icon: imageOut(row.icon_url),
    image: imageOut(row.image_url || row.banner_desktop_url || row.icon_url),
    bannerDesktop: imageOut(row.banner_desktop_url),
    bannerMobile: imageOut(row.banner_mobile_url),
    description: row.description || "",
    seoTitle: row.meta_title || "",
    seoDescription: row.meta_description || "",
    showInMenu: row.show_in_menu,
    showOnHome: row.show_on_home,
    itemCount,
    subCategories: visibleChildren.map((child) => {
      const c = toCategory(child, index, counts);
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        image: c.image,
        showInMenu: c.showInMenu,
        itemCount: c.itemCount,
        items: c.subCategories.map((g) => g.name), // level-3 names (mega menu)
        children: c.subCategories.map(({ id: gid, name, slug, itemCount: n }) => ({ id: gid, name, slug, itemCount: n })),
      };
    }),
  };
}

/** Visible Level-1 categories with their visible subcategories (menus, home page). */
export async function categoryTree() {
  const index = await getCategoryIndex();
  const counts = await visibleCountsByCategory(index);
  return (index.childrenOf.get("root") || [])
    .filter((row) => index.visible.has(String(row.id)))
    .map((row) => toCategory(row, index, counts));
}

/** Any visible category (level 1–3) by slug, with breadcrumbs. */
export async function categoryBySlug(slug) {
  const index = await getCategoryIndex();
  const row = index.rows.find((r) => r.slug === slug);
  if (!row || !index.visible.has(String(row.id))) throw ApiError.notFound("Category not found");
  const counts = await visibleCountsByCategory(index);
  return {
    ...toCategory(row, index, counts),
    breadcrumbs: index.ancestry(row.id).map((c) => ({ id: String(c.id), name: c.name, slug: c.slug })),
  };
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

function toBrand(row, productCount, featuredCategories = []) {
  const logo = imageOut(row.logo_url);
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    logo,
    logoUrl: logo,
    bannerImage: imageOut(row.banner_desktop_url),
    bannerMobile: imageOut(row.banner_mobile_url),
    description: row.description || "",
    originCountry: row.origin_country || "",
    authorizedDistributor: row.authorized_distributor,
    isFeatured: row.is_featured,
    seoTitle: row.meta_title || "",
    seoDescription: row.meta_description || "",
    productCount,
    featuredCategories,
  };
}

/** productCount + the brand's top 3 categories (by visible products). */
async function brandStats(index, brandIds) {
  if (!brandIds.length) return new Map();
  const groups = await prisma.product.groupBy({
    by: ["brand_id", "category_id"],
    where: { ...visibleProductWhere(index), brand_id: { in: brandIds } },
    _count: { _all: true },
  });
  const stats = new Map();
  for (const g of groups) {
    const key = String(g.brand_id);
    if (!stats.has(key)) stats.set(key, { count: 0, byTop: new Map() });
    const s = stats.get(key);
    s.count += g._count._all;
    const top = index.ancestry(g.category_id)[0];
    if (top) s.byTop.set(top.name, (s.byTop.get(top.name) || 0) + g._count._all);
  }
  return new Map(
    [...stats].map(([k, s]) => [
      k,
      { count: s.count, top: [...s.byTop].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name) },
    ])
  );
}

export async function brands({ featured } = {}) {
  const [index, rows] = await Promise.all([
    getCategoryIndex(),
    prisma.brand.findMany({
      where: { deleted_at: null, status: "active", ...(featured && { is_featured: true }) },
      orderBy: { name: "asc" },
    }),
  ]);
  const stats = await brandStats(index, rows.map((r) => r.id));
  return rows.map((r) => {
    const s = stats.get(String(r.id));
    return toBrand(r, s?.count || 0, s?.top || []);
  });
}

export async function brandBySlug(slug) {
  const row = await prisma.brand.findFirst({ where: { slug, deleted_at: null, status: "active" } });
  if (!row) throw ApiError.notFound("Brand not found");
  const index = await getCategoryIndex();
  const s = (await brandStats(index, [row.id])).get(String(row.id));
  return toBrand(row, s?.count || 0, s?.top || []);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Listing / search / home rows. */
export async function products(q) {
  const index = await getCategoryIndex();

  // Which categories? (always limited to visible ones)
  let categoryIds = index.allVisibleIds();
  let scope = q.categoryId ? index.byId.get(q.categoryId) : null;
  if (q.category) scope = index.rows.find((r) => r.slug === q.category);
  if (q.category || q.categoryId) {
    if (!scope || !index.visible.has(String(scope.id))) throw ApiError.notFound("Category not found");
    categoryIds = index.visibleSubtree(scope.id);
  }
  if (q.sub) {
    const sub = index.rows.find((r) => r.slug === q.sub);
    // the subcategory must be visible and (when a category is given) inside it
    if (!sub || !index.visible.has(String(sub.id)) || (scope && !index.subtreeIds(scope.id).includes(String(sub.id)))) {
      categoryIds = [];
    } else {
      categoryIds = index.visibleSubtree(sub.id);
    }
  }

  // Which brands? (ids and/or slugs)
  let brandIds = q.brandIds || [];
  if (q.brand?.length) {
    const rows = await prisma.brand.findMany({ where: { slug: { in: q.brand }, deleted_at: null }, select: { id: true } });
    brandIds = [...brandIds, ...rows.map((r) => r.id)];
    if (!brandIds.length) return { rows: [], meta: { page: q.page, limit: q.limit, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: q.page > 1 } };
  }

  const { ids, meta } = await searchProductIds(
    {
      storefront: true,
      categoryIds,
      brandIds,
      q: q.q,
      inStock: q.inStock,
      rent: q.rent,
      emi: q.emi,
      featured: q.featured,
      bestSeller: q.bestSeller,
      newArrival: q.newArrival,
      deal: q.deal,
      minPricePaise: q.minPrice,
      maxPricePaise: q.maxPrice,
      minDiscount: q.minDiscount,
    },
    { page: q.page, limit: q.limit, sort: q.sort }
  );
  return { rows: await productsFromIds(ids, index), meta };
}

/** Product page. 404 for drafts, inactive, deleted, or products under a hidden brand / category. */
export async function productBySlug(slug) {
  const index = await getCategoryIndex();
  const product = await prisma.product.findFirst({
    where: { slug, ...visibleProductWhere(index) },
    include: productInclude(),
  });
  if (!product) throw ApiError.notFound("Product not found");
  return toStorefrontProduct(product, categoryInfo(index, product.category_id), { detail: true });
}

/** Same subcategory first, then the rest of the top-level category, best sellers first. */
export async function related(productId, limit) {
  const index = await getCategoryIndex();
  const product = await prisma.product.findFirst({
    where: { id: productId, ...visibleProductWhere(index) },
    select: { id: true, category_id: true },
  });
  if (!product) throw ApiError.notFound("Product not found");

  const chain = index.ancestry(product.category_id);
  const near = index.visibleSubtree(chain[chain.length - 1].id);
  const wide = index.visibleSubtree(chain[0].id);

  const first = await searchProductIds(
    { storefront: true, categoryIds: near, excludeIds: [product.id] },
    { page: 1, limit, sort: "popularity" }
  );
  let ids = first.ids;
  if (ids.length < limit && wide.length > near.length) {
    const more = await searchProductIds(
      { storefront: true, categoryIds: wide, excludeIds: [product.id, ...ids] },
      { page: 1, limit: limit - ids.length, sort: "popularity" }
    );
    ids = [...ids, ...more.ids];
  }
  return productsFromIds(ids, index);
}

/** Header autocomplete: a few products, categories and brands. */
export async function suggestions(q) {
  const index = await getCategoryIndex();
  const needle = q.toLowerCase();
  const [{ ids }, brandRows] = await Promise.all([
    searchProductIds({ storefront: true, categoryIds: index.allVisibleIds(), q }, { page: 1, limit: 6, sort: "popularity" }),
    prisma.brand.findMany({
      where: { deleted_at: null, status: "active", name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 4,
    }),
  ]);
  const productRows = await productsFromIds(ids, index);
  return {
    products: productRows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      thumbnail: p.thumbnail,
      brandName: p.brandName,
      rentEnabled: Boolean(p.rentEnabled),
      rentPricePerMonth: p.rentPricePerMonth || null,
    })),
    categories: index.rows
      .filter((r) => index.visible.has(String(r.id)) && r.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((r) => ({ id: String(r.id), name: r.name, slug: r.slug, path: index.pathLabel(r.id) })),
    brands: brandRows.map((b) => ({ id: String(b.id), name: b.name, slug: b.slug })),
  };
}
