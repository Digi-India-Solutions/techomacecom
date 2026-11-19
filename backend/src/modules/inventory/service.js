import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function computeStockStatus(available, threshold) {
  if (available <= 0) return "out_of_stock";
  if (available <= threshold) return "low_stock";
  return "in_stock";
}

function formatStockItem(inv) {
  const availableStock = Math.max(0, inv.quantity - inv.reserved);
  const status = computeStockStatus(availableStock, inv.low_stock_threshold);

  const imageUrl =
    inv.variant.image_url ||
    (inv.variant.product.images && inv.variant.product.images.length > 0
      ? inv.variant.product.images[0].url
      : "");

  return {
    id: inv.id.toString(),
    productId: inv.variant.product.id.toString(),
    productName: inv.variant.product.name,
    variantId: inv.variant.id.toString(),
    variantName: inv.variant.name,
    sku: inv.variant.sku,
    imageUrl,
    brandName: inv.variant.product.brand?.name || "",
    categoryName: inv.variant.product.category?.name || "",
    warehouseId: inv.warehouse.id.toString(),
    warehouseName: inv.warehouse.name,
    availableStock,
    reservedStock: inv.reserved,
    lowStockThreshold: inv.low_stock_threshold,
    status,
    updatedAt: inv.updated_at.toISOString(),
  };
}

export async function listWarehouses() {
  const list = await prisma.warehouse.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });

  return list.map((w) => ({
    id: w.id.toString(),
    name: w.name,
    code: w.code,
    city: w.city || "",
    state: w.state || "",
  }));
}

export async function listStockItems({ search, status, warehouseId }) {
  const where = {};

  if (warehouseId && warehouseId !== "all") {
    try {
      where.warehouse_id = BigInt(warehouseId);
    } catch {
      // invalid id, no results
      return [];
    }
  }

  const items = await prisma.inventory.findMany({
    where,
    include: {
      warehouse: true,
      variant: {
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              images: {
                orderBy: { sort_order: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: [
      { variant: { product: { name: "asc" } } },
      { variant: { name: "asc" } },
    ],
  });

  let formatted = items.map(formatStockItem);

  if (search && search.trim()) {
    const tokens = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    formatted = formatted.filter((item) => {
      const normalizedSku = item.sku.toLowerCase().replace(/[-_]/g, " ");
      const combined = [
        item.productName,
        item.variantName || "",
        item.sku,
        normalizedSku,
        item.brandName || "",
        item.categoryName || "",
        item.warehouseName || "",
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => combined.includes(token));
    });
  }

  if (status && status !== "all") {
    if (status === "low_or_out") {
      formatted = formatted.filter(
        (item) => item.status === "low_stock" || item.status === "out_of_stock"
      );
    } else {
      formatted = formatted.filter((item) => item.status === status);
    }
  }

  return formatted;
}

export async function adjustStockItem(
  id,
  { delta, availableStock, reservedStock, lowStockThreshold, reason, note },
  adminUser
) {
  let invId;
  try {
    invId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid inventory id");
  }

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.inventory.findUnique({
      where: { id: invId },
      include: {
        warehouse: true,
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                images: {
                  orderBy: { sort_order: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound("Stock item not found");
    }

    const previousAvailable = Math.max(0, existing.quantity - existing.reserved);
    const previousReserved = existing.reserved;
    const previousThreshold = existing.low_stock_threshold;

    // Calculate new reserved
    const nextReserved =
      reservedStock !== undefined && Number.isFinite(reservedStock)
        ? Math.max(0, Math.floor(reservedStock))
        : previousReserved;

    // Calculate new threshold
    const nextThreshold =
      lowStockThreshold !== undefined && Number.isFinite(lowStockThreshold)
        ? Math.max(0, Math.floor(lowStockThreshold))
        : previousThreshold;

    // Calculate new available and quantity
    let nextAvailable;
    let actualDelta = 0;

    if (availableStock !== undefined && Number.isFinite(availableStock)) {
      nextAvailable = Math.max(0, Math.floor(availableStock));
      actualDelta = nextAvailable - previousAvailable;
    } else {
      actualDelta = delta || 0;
      nextAvailable = Math.max(0, previousAvailable + actualDelta);
    }

    const nextQuantity = nextAvailable + nextReserved;

    const updated = await tx.inventory.update({
      where: { id: invId },
      data: {
        quantity: nextQuantity,
        reserved: nextReserved,
        low_stock_threshold: nextThreshold,
      },
      include: {
        warehouse: true,
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                images: {
                  orderBy: { sort_order: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const movementReason = reason || (actualDelta >= 0 ? "purchase" : "correction");
    const movementNote =
      note ||
      `Stock adjusted: Available ${previousAvailable} → ${nextAvailable}, Reserved ${previousReserved} → ${nextReserved}, Low Threshold ${previousThreshold} → ${nextThreshold} (${movementReason})`;

    const movement = await tx.stockMovement.create({
      data: {
        variant_id: existing.variant_id,
        warehouse_id: existing.warehouse_id,
        change_qty: actualDelta,
        reason: movementReason,
        balance_after: nextAvailable,
        admin_user_id: adminUser?.id ? BigInt(adminUser.id) : null,
        note: movementNote,
      },
    });

    return {
      stockItem: formatStockItem(updated),
      movement: {
        id: movement.id.toString(),
        stockItemId: updated.id.toString(),
        sku: updated.variant.sku,
        delta: movement.change_qty,
        previousStock: previousAvailable,
        newStock: nextAvailable,
        reason: movement.reason,
        note: movement.note || "",
        performedBy: adminUser?.name || "Admin",
        createdAt: movement.created_at.toISOString(),
      },
    };
  });
}

export async function getStockMovements(id) {
  let invId;
  try {
    invId = BigInt(id);
  } catch {
    return [];
  }

  const inv = await prisma.inventory.findUnique({
    where: { id: invId },
    include: {
      variant: true,
    },
  });

  if (!inv) return [];

  const list = await prisma.stockMovement.findMany({
    where: {
      variant_id: inv.variant_id,
      warehouse_id: inv.warehouse_id,
    },
    include: {
      admin_user: true,
    },
    orderBy: { created_at: "desc" },
  });

  return list.map((m) => ({
    id: m.id.toString(),
    stockItemId: inv.id.toString(),
    sku: inv.variant.sku,
    delta: m.change_qty,
    previousStock: m.balance_after - m.change_qty,
    newStock: m.balance_after,
    reason: m.reason,
    note: m.note || "",
    performedBy: m.admin_user?.name || "Staff",
    createdAt: m.created_at.toISOString(),
  }));
}
