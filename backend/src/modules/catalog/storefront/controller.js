import { ok } from "../../../lib/http.js";
import * as service from "./service.js";

/**
 * Public catalog endpoints. Responses may be cached briefly by browsers / CDNs
 * (catalog data changes rarely; 30 s keeps admin edits visible quickly).
 */
const cache = (res) => res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

export async function categories(req, res) {
  cache(res);
  return ok(res, await service.categoryTree());
}

export async function category(req, res) {
  cache(res);
  return ok(res, await service.categoryBySlug(req.validatedParams.slug));
}

export async function brands(req, res) {
  cache(res);
  return ok(res, await service.brands(req.validatedQuery));
}

export async function brand(req, res) {
  cache(res);
  return ok(res, await service.brandBySlug(req.validatedParams.slug));
}

export async function products(req, res) {
  cache(res);
  const { rows, meta } = await service.products(req.validatedQuery);
  return ok(res, rows, { meta });
}

export async function product(req, res) {
  cache(res);
  return ok(res, await service.productBySlug(req.validatedParams.slug));
}

export async function related(req, res) {
  cache(res);
  return ok(res, await service.related(BigInt(req.validatedParams.id), req.validatedQuery.limit));
}

export async function suggestions(req, res) {
  cache(res);
  return ok(res, await service.suggestions(req.validatedQuery.q));
}
