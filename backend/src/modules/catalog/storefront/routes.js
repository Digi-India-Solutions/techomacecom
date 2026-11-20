import { Router } from "express";
import { validate } from "../../../middlewares/validate.js";
import { catalogSearchLimiter } from "../../../middlewares/rate-limit.js";
import { idParamSchema } from "../shared.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Public storefront catalog — mounted at /api/v1 (no login needed).
 *
 *   GET /categories                    visible category tree (menu, home tiles)
 *   GET /categories/:slug              one category (any level) + breadcrumbs
 *   GET /brands?featured=true          active brands with product counts
 *   GET /brands/:slug                  one brand
 *   GET /products?category=&sub=&brand=&q=&minPrice=&maxPrice=&inStock=&rent=&emi=
 *                &featured=&bestSeller=&newArrival=&deal=&sort=&page=&limit=
 *   GET /products/:slug                product page
 *   GET /products/:id/related          related products
 *   GET /search/suggestions?q=         header autocomplete (rate limited)
 */
const router = Router();
const bySlug = validate({ params: v.slugParam });

router.get("/categories", c.categories);
router.get("/categories/:slug", bySlug, c.category);
router.get("/brands", validate({ query: v.brandListQuery }), c.brands);
router.get("/brands/:slug", bySlug, c.brand);
// No per-IP limit on listings: Next.js server-side rendering calls these from ONE server IP
router.get("/products", validate({ query: v.productListQuery }), c.products);
router.get("/products/:id/related", validate({ params: idParamSchema, query: v.relatedQuery }), c.related);
router.get("/products/:slug", bySlug, c.product);
router.get("/search/suggestions", catalogSearchLimiter, validate({ query: v.suggestQuery }), c.suggestions);

export default router;
