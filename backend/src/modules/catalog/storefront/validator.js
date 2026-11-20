import { z } from "zod";
import { queryBool } from "../../../lib/list.js";
import { toPaise } from "../../../lib/money.js";

/** Query strings for the public catalog endpoints (all optional, all whitelisted). */

const slug = z.string().trim().toLowerCase().max(140).regex(/^[a-z0-9-]+$/, "Invalid slug");
const csvIds = z
  .string()
  .trim()
  .max(1000)
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id")).max(50))
  .transform((ids) => ids.map((x) => BigInt(x)));
const csvSlugs = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))
  .pipe(z.array(z.string().regex(/^[a-z0-9-]+$/)).max(50));
const rupees = z.coerce
  .number()
  .min(0)
  .max(10_00_00_000)
  .transform((v) => toPaise(v));

export const slugParam = z.object({ slug });

export const productListQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sort: z.enum(["popularity", "price-asc", "price-desc", "newest", "discount", "rating"]).default("popularity"),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
  category: slug.optional(), // category slug (includes its subcategories)
  categoryId: z.string().regex(/^[1-9][0-9]{0,18}$/).optional(),
  sub: slug.optional(), // subcategory slug inside `category`
  brand: csvSlugs.optional(), // brand slugs, comma separated
  brandIds: csvIds.optional(),
  minPrice: rupees.optional(),
  maxPrice: rupees.optional(),
  minDiscount: z.coerce.number().int().min(1).max(99).optional(),
  inStock: queryBool.optional(),
  rent: queryBool.optional(),
  emi: queryBool.optional(),
  featured: queryBool.optional(),
  bestSeller: queryBool.optional(),
  newArrival: queryBool.optional(),
  deal: queryBool.optional(),
});

export const brandListQuery = z.object({ featured: queryBool.optional() });

export const relatedQuery = z.object({ limit: z.coerce.number().int().min(1).max(24).default(8) });

export const suggestQuery = z.object({ q: z.string().trim().min(1).max(100) });
