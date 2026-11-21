import { Prisma } from "@prisma/client";
import prisma from "../../../../db/db.js";
import { listMeta } from "../../../lib/list.js";

/**
 * Product search used by BOTH the admin list and the storefront listings.
 *
 * Why raw SQL: price lives on the default variant and stock on inventory rows,
 * so filters like "in stock", "₹5k–₹20k", "low stock" and sorts like
 * "price low → high" / "biggest discount" need joins Prisma's query API cannot
 * express. This builds ONE parameterised query (every value is a bind
 * parameter via Prisma.sql — never string-concatenated, so no SQL injection)
 * that returns the matching product ids for one page + the total count.
 * The caller then loads those products with Prisma includes.
 *
 * Name / SKU "contains" search uses the pg_trgm GIN indexes from the init migration.
 */

/** Escapes % and _ so user input is matched literally inside ILIKE. */
const likePattern = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const AVAILABLE = Prisma.sql`(s.qty - s.reserved)`;
const DISCOUNT = Prisma.sql`CASE WHEN dv.mrp_paise > 0 THEN ((dv.mrp_paise - dv.price_paise) * 100 / dv.mrp_paise) ELSE 0 END`;
const ACTIVE_DEAL = Prisma.sql`EXISTS (
  SELECT 1 FROM deals d JOIN product_variants dpv ON dpv.id = d.variant_id
  WHERE dpv.product_id = p.id AND dpv.is_active AND d.is_active AND (d.starts_at IS NULL OR d.starts_at <= (now() + interval '1 day')) AND (d.ends_at IS NULL OR d.ends_at > (now() - interval '1 day'))
)`;

/** Whitelisted ORDER BY clauses (the client only ever picks a key). */
const SORTS = {
  // storefront
  popularity: Prisma.sql`p.sold_count DESC, p.rating_count DESC, p.id DESC`,
  "price-asc": Prisma.sql`dv.price_paise ASC, p.id DESC`,
  "price-desc": Prisma.sql`dv.price_paise DESC, p.id DESC`,
  newest: Prisma.sql`COALESCE(p.published_at, p.created_at) DESC, p.id DESC`,
  discount: Prisma.sql`${DISCOUNT} DESC, p.id DESC`,
  rating: Prisma.sql`p.rating_avg DESC, p.rating_count DESC, p.id DESC`,
  // admin
  name: Prisma.sql`p.name ASC, p.id DESC`,
  "-name": Prisma.sql`p.name DESC, p.id DESC`,
  stock: Prisma.sql`${AVAILABLE} ASC, p.id DESC`,
  "-stock": Prisma.sql`${AVAILABLE} DESC, p.id DESC`,
  createdAt: Prisma.sql`p.created_at ASC, p.id ASC`,
  "-createdAt": Prisma.sql`p.created_at DESC, p.id DESC`,
  "-updatedAt": Prisma.sql`p.updated_at DESC, p.id DESC`,
};
export const SORT_KEYS = Object.keys(SORTS);

/**
 * @param f filters
 *   storefront: true → only products a shopper may see (active product + active brand + visible category)
 *   categoryIds: BigInt[] | undefined   (undefined = any category; [] = nothing matches)
 *   brandIds: BigInt[], status, q, stockLevel ("in_stock" | "low_stock" | "out_of_stock"),
 *   inStock, emi, cod, rent, featured, bestSeller, newArrival, deal,
 *   minPricePaise, maxPricePaise, minDiscount, excludeIds: BigInt[]
 * @param sort a SORT_KEYS key
 */
export async function searchProductIds(f, { page = 1, limit = 20, sort = "-updatedAt" } = {}) {
  if (f.categoryIds && f.categoryIds.length === 0) return { ids: [], meta: listMeta(page, limit, 0) };

  const where = [Prisma.sql`p.deleted_at IS NULL`];

  if (f.storefront) {
    where.push(Prisma.sql`p.status = 'active'`);
    where.push(Prisma.sql`b.status = 'active' AND b.deleted_at IS NULL`);
    where.push(Prisma.sql`dv.is_active`);
  }
  if (f.categoryIds) where.push(Prisma.sql`p.category_id IN (${Prisma.join(f.categoryIds)})`);
  if (f.brandIds?.length) where.push(Prisma.sql`p.brand_id IN (${Prisma.join(f.brandIds)})`);
  if (f.excludeIds?.length) where.push(Prisma.sql`p.id NOT IN (${Prisma.join(f.excludeIds)})`);
  if (f.status) where.push(Prisma.sql`p.status = ${f.status}`);
  if (f.q) {
    const pattern = likePattern(f.q);
    where.push(Prisma.sql`(p.name ILIKE ${pattern} OR p.sku ILIKE ${pattern} OR b.name ILIKE ${pattern}
      OR EXISTS (SELECT 1 FROM product_variants sv WHERE sv.product_id = p.id AND sv.sku ILIKE ${pattern}))`);
  }
  if (f.emi) where.push(Prisma.sql`p.emi_enabled`);
  if (f.cod) where.push(Prisma.sql`p.cod_enabled`);
  if (f.rent) where.push(Prisma.sql`p.rent_enabled`);
  if (f.featured) where.push(Prisma.sql`p.is_featured`);
  if (f.bestSeller) where.push(Prisma.sql`p.is_best_seller`);
  if (f.newArrival) where.push(Prisma.sql`p.is_new_arrival`);
  if (f.deal) where.push(ACTIVE_DEAL);
  if (f.inStock) where.push(Prisma.sql`${AVAILABLE} > 0`);
  if (f.stockLevel === "out_of_stock") where.push(Prisma.sql`${AVAILABLE} <= 0`);
  if (f.stockLevel === "low_stock") where.push(Prisma.sql`${AVAILABLE} > 0 AND ${AVAILABLE} <= s.threshold`);
  if (f.stockLevel === "in_stock") where.push(Prisma.sql`${AVAILABLE} > s.threshold`);
  if (f.minPricePaise !== undefined) where.push(Prisma.sql`dv.price_paise >= ${f.minPricePaise}`);
  if (f.maxPricePaise !== undefined) where.push(Prisma.sql`dv.price_paise <= ${f.maxPricePaise}`);
  if (f.minDiscount) where.push(Prisma.sql`${DISCOUNT} >= ${f.minDiscount}`);

  const orderBy = SORTS[sort] || SORTS["-updatedAt"];
  const offset = (page - 1) * limit;

  const rows = await prisma.$queryRaw`
    SELECT p.id, COUNT(*) OVER() AS total
    FROM products p
    JOIN brands b ON b.id = p.brand_id
    LEFT JOIN product_variants dv ON dv.product_id = p.id AND dv.is_default
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(i.quantity), 0)::int AS qty,
             COALESCE(SUM(i.reserved), 0)::int AS reserved,
             COALESCE(MIN(i.low_stock_threshold), 5)::int AS threshold
      FROM inventory i
      JOIN product_variants iv ON iv.id = i.variant_id
      WHERE iv.product_id = p.id AND iv.is_active
    ) s ON TRUE
    WHERE ${Prisma.join(where, " AND ")}
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}`;

  let total = rows.length ? Number(rows[0].total) : 0;
  if (!rows.length && page > 1) {
    // Past the last page: COUNT(*) OVER() has no row to ride on — count separately
    const [{ count }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM products p
      JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_variants dv ON dv.product_id = p.id AND dv.is_default
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(i.quantity), 0)::int AS qty, COALESCE(SUM(i.reserved), 0)::int AS reserved,
               COALESCE(MIN(i.low_stock_threshold), 5)::int AS threshold
        FROM inventory i JOIN product_variants iv ON iv.id = i.variant_id
        WHERE iv.product_id = p.id AND iv.is_active
      ) s ON TRUE
      WHERE ${Prisma.join(where, " AND ")}`;
    total = count;
  }

  return { ids: rows.map((r) => r.id), meta: listMeta(page, limit, total) };
}

/** Loads products by id with `include`, keeping the order of `ids`. */
export async function loadInOrder(ids, include) {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include });
  const byId = new Map(rows.map((r) => [String(r.id), r]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}
