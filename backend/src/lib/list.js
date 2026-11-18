import { z } from "zod";
import prisma from "../../db/db.js";
import { ApiError } from "./http.js";

/**
 * Shared list handling — document §12: "Lists take ?page=&limit=&sort=&q= plus filters"
 * and respond with meta { page, limit, total }.
 *
 * Typical use:
 *
 *   // routes.js
 *   router.get("/brands", requirePermission("brands.view"),
 *     validate({ query: listQuery({ status: z.enum(["active", "inactive"]).optional() }) }),
 *     c.list);
 *
 *   // service.js
 *   const { page, limit, sort, q, status } = query;
 *   return paginate(prisma.brand, {
 *     where: { deleted_at: null, ...(status && { status }), ...searchWhere(q, ["name", "slug"]) },
 *     orderBy: buildOrderBy(sort, { name: "name", createdAt: "created_at" }, "-createdAt"),
 *     page, limit,
 *   });
 *
 *   // controller.js
 *   const { rows, meta } = await service.list(req.validatedQuery);
 *   return ok(res, rows.map(toDto), { meta });
 */

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** "true"/"false"/"1"/"0" query strings → boolean */
export const queryBool = z
  .enum(["true", "false", "1", "0"], { error: "Use true or false" })
  .transform((v) => v === "true" || v === "1");

/** "12" → 12n (ids in query strings) */
export const queryId = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/, "Invalid id")
  .transform((v) => BigInt(v));

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  // "-createdAt" = newest first; several keys: "status,-createdAt"
  sort: z.string().trim().max(120).optional(),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
});

/** listQuerySchema plus module-specific filters. */
export function listQuery(filters = {}) {
  return listQuerySchema.extend(filters);
}

/** "brand.name" + "asc" → { brand: { name: "asc" } } */
function nested(path, value) {
  return path
    .split(".")
    .reverse()
    .reduce((acc, key) => ({ [key]: acc }), value);
}

/**
 * Turns ?sort= into a Prisma orderBy, allowing only whitelisted keys.
 * @param sortable  { apiKey: "prisma.field.path" } e.g. { name: "name", brand: "brand.name" }
 * @param fallback  used when ?sort= is empty, e.g. "-createdAt"
 * Always appends id as a tie-breaker so pages never repeat or skip rows.
 */
export function buildOrderBy(sort, sortable, fallback) {
  const raw = (sort || fallback || "").split(",").map((s) => s.trim()).filter(Boolean);
  const orderBy = [];
  for (const token of raw.slice(0, 3)) {
    const desc = token.startsWith("-");
    const key = token.replace(/^[-+]/, "");
    const field = sortable[key];
    if (!field) {
      throw ApiError.badRequest(`Cannot sort by "${key}". Allowed: ${Object.keys(sortable).join(", ")}`, "INVALID_SORT", {
        sort: `Allowed: ${Object.keys(sortable).join(", ")}`,
      });
    }
    orderBy.push(nested(field, desc ? "desc" : "asc"));
  }
  if (!orderBy.some((o) => "id" in o)) orderBy.push({ id: "desc" });
  return orderBy;
}

/**
 * Case-insensitive "contains" across fields (supports relations: "brand.name").
 * Product name / SKU have trigram GIN indexes, so this stays fast on large tables.
 */
export function searchWhere(q, fields) {
  if (!q) return {};
  return { OR: fields.map((f) => nested(f, { contains: q, mode: "insensitive" })) };
}

export function listMeta(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
}

/**
 * Runs findMany + count in one transaction (consistent snapshot).
 * @param delegate a Prisma model, e.g. prisma.product
 */
export async function paginate(delegate, { where = {}, orderBy, select, include, page = 1, limit = DEFAULT_LIMIT }) {
  const [rows, total] = await prisma.$transaction([
    delegate.findMany({
      where,
      orderBy,
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
      skip: (page - 1) * limit,
      take: limit,
    }),
    delegate.count({ where }),
  ]);
  return { rows, meta: listMeta(page, limit, total) };
}
