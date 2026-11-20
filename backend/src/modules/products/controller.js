import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listProducts(req, res) {
  const products = await service.listProducts(req.query);
  return ok(res, products);
}

export async function getProduct(req, res) {
  const product = await service.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Product not found" },
    });
  }
  return ok(res, product);
}

export async function createProduct(req, res) {
  const product = await service.createProduct(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "products",
      action: "create",
      entityType: "product",
      entityId: BigInt(product.id),
      entityLabel: product.name,
      summary: `Created product "${product.name}" (SKU: ${product.sku}) with ${product.variants?.length || 1} variant(s)`,
    });
  } catch (err) {
    console.warn("Could not log product creation activity:", err);
  }

  return ok(res, product, { status: 201 });
}

export async function updateProduct(req, res) {
  const product = await service.updateProduct(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "products",
      action: "update",
      entityType: "product",
      entityId: BigInt(product.id),
      entityLabel: product.name,
      summary: `Updated product "${product.name}" (${product.sku})`,
    });
  } catch (err) {
    console.warn("Could not log product update activity:", err);
  }

  return ok(res, product);
}

export async function deleteProduct(req, res) {
  await service.deleteProduct(req.params.id, req.admin);

  try {
    await logActivity(req, {
      module: "products",
      action: "delete",
      entityType: "product",
      entityId: null,
      entityLabel: req.params.id,
      summary: `Deleted product ID: ${req.params.id}`,
    });
  } catch (err) {
    console.warn("Could not log product delete activity:", err);
  }

  return ok(res, { success: true });
}
