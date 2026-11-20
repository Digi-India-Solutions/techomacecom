import { Router } from "express";
import categoryRoutes from "./categories/routes.js";
import brandRoutes from "./brands/routes.js";
import productRoutes from "./products/routes.js";
import storefrontRoutes from "./storefront/routes.js";

/**
 * Catalog module (document §11.3): categories → brands → products.
 *
 *   adminCatalogRoutes       /api/v1/admin/{categories,brands,products}   staff only
 *   storefrontCatalogRoutes  /api/v1/{categories,brands,products,search}  public, read-only
 *
 * Folder layout (each: routes → controller → service → validator):
 *   categories/  brands/  products/  storefront/
 *   shared.js           slugs, image fields, HTML sanitising, ids
 *   category-index.js   cached category tree + visibility rules
 *   products/query.js   the one SQL search used by admin + storefront lists
 *   products/dto.js     DB rows → admin / storefront JSON
 */
export const adminCatalogRoutes = Router();
adminCatalogRoutes.use("/categories", categoryRoutes);
adminCatalogRoutes.use("/brands", brandRoutes);
adminCatalogRoutes.use("/products", productRoutes);

export { storefrontRoutes as storefrontCatalogRoutes };
