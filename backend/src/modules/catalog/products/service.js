import prisma from "../../../../db/db.js";
import { ApiError } from "../../../lib/http.js";
import { isDbId, sanitizeRichText, slugify, tombstone, uniqueSlug } from "../shared.js";
import { getCategoryIndex } from "../category-index.js";
import { productInclude, toAdminProduct, isRetired, RETIRED_MARK } from "./dto.js";
import { searchProductIds, loadInOrder } from "./query.js";

/**
 * Admin product service (document §11.3 + §11.4).
 *
 * One product save touches several tables, always in ONE transaction:
 *   products            the listing itself
 *   product_variants    price / MRP / SKU (a product without variants gets a hidden "default" one)
 *   inventory           stock per variant in the Main Warehouse
 *   stock_movements     an append-only audit row for every stock change
 *   product_images, product_specs   replaced as a whole
 *   rental_plans        one row per period (daily / weekly / monthly)
 *   deals               "Deal of the Day" toggle
 */

const SLUG_MAX = 270;
const SKU_MAX = 60;
const MAIN_WAREHOUSE = "MAIN";
const TX_OPTIONS = { timeout: 20_000, maxWait: 10_000 };

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function list(query) {
  const { page, limit, sort, q, categoryId, brandId, status, stockLevel, emi, rent, cod } = query;
  let categoryIds;
  if (categoryId) {
    const index = await getCategoryIndex();
    categoryIds = index.subtreeIds(categoryId).map((x) => BigInt(x)); // a parent also lists its subcategories' products
  }
  const { ids, meta } = await searchProductIds(
    { categoryIds, brandIds: brandId ? [brandId] : undefined, status, stockLevel, emi, rent, cod, q },
    { page, limit, sort }
  );
  const [rows, index] = await Promise.all([loadInOrder(ids, productInclude()), getCategoryIndex()]);
  return { rows: rows.map((p) => toAdminProduct(p, index.pathLabel(p.category_id))), meta };
}

async function findProduct(id, client = prisma) {
  const product = await client.product.findFirst({ where: { id, deleted_at: null }, include: productInclude() });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function getById(id) {
  const [product, index] = await Promise.all([findProduct(id), getCategoryIndex()]);
  return toAdminProduct(product, index.pathLabel(product.category_id));
}

/** Is this SKU free for a product / variant? (the editor checks while typing) */
export async function skuAvailable(sku, excludeProductId) {
  const [product, variant] = await Promise.all([
    prisma.product.findFirst({ where: { sku, ...(excludeProductId && { NOT: { id: excludeProductId } }) }, select: { id: true } }),
    prisma.productVariant.findFirst({
      where: { sku, ...(excludeProductId && { NOT: { product_id: excludeProductId } }) },
      select: { id: true },
    }),
  ]);
  return { sku, available: !product && !variant };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let mainWarehouseId = null;
async function getMainWarehouseId(tx) {
  if (mainWarehouseId) return mainWarehouseId;
  const wh = await tx.warehouse.findUnique({ where: { code: MAIN_WAREHOUSE }, select: { id: true } });
  if (!wh) throw new ApiError(500, "NO_WAREHOUSE", 'The "Main Warehouse" is missing. Run: npm run db:seed');
  mainWarehouseId = wh.id;
  return mainWarehouseId;
}

async function assertLinks(data) {
  const [brand, category] = await Promise.all([
    prisma.brand.findFirst({ where: { id: data.brandId, deleted_at: null }, select: { id: true } }),
    prisma.category.findFirst({ where: { id: data.categoryId, deleted_at: null }, select: { id: true } }),
  ]);
  const fields = {};
  if (!brand) fields.brandId = "Choose a brand";
  if (!category) fields.categoryId = "Choose a category";
  if (Object.keys(fields).length) throw ApiError.badRequest(Object.values(fields).join(" · "), "INVALID_LINK", fields);
}

async function resolveSlug(data, exceptId) {
  const taken = async (slug) => {
    const row = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(row && row.id !== exceptId);
  };
  if (data.slug) {
    if (await taken(data.slug)) {
      throw ApiError.conflict(`The URL slug "${data.slug}" is already used by another product`, "SLUG_TAKEN", { slug: "Already in use" });
    }
    return data.slug;
  }
  return uniqueSlug(slugify(data.name), taken, SLUG_MAX);
}

/** Product + variant SKUs must not clash with any other product (friendly 409 with the field). */
async function assertSkusFree(data, variantsPlan, exceptProductId) {
  const productClash = await prisma.product.findFirst({
    where: { sku: data.sku, ...(exceptProductId && { NOT: { id: exceptProductId } }) },
    select: { name: true },
  });
  if (productClash) {
    throw ApiError.conflict(`SKU "${data.sku}" is already used by "${productClash.name}"`, "SKU_TAKEN", { sku: "Already in use" });
  }
  const skus = variantsPlan.map((v) => v.sku);
  const clashes = await prisma.productVariant.findMany({
    where: { sku: { in: skus }, ...(exceptProductId && { NOT: { product_id: exceptProductId } }) },
    select: { sku: true, product: { select: { name: true } } },
  });
  if (clashes.length) {
    const fields = {};
    for (const c of clashes) {
      const i = variantsPlan.findIndex((v) => v.sku === c.sku);
      fields[variantsPlan[i].implicit ? "sku" : `variants.${i}.sku`] = `Used by "${c.product.name}"`;
    }
    throw ApiError.conflict(`SKU "${clashes[0].sku}" is already used by "${clashes[0].product.name}"`, "SKU_TAKEN", fields);
  }
}

/**
 * What the variants should look like after the save.
 * No variants in the form → one hidden "default" variant carrying the product's price + stock.
 */
function planVariants(data) {
  if (data.variants.length === 0) {
    return [
      {
        implicit: true,
        option_type: "default",
        name: "Default",
        sku: data.sku,
        price_paise: data.price,
        mrp_paise: data.mrp,
        image_url: null,
        is_default: true,
        is_active: true,
        sort_order: 0,
        stock: data.stock,
      },
    ];
  }
  const defaultIndex = Math.max(
    0,
    data.variants.findIndex((v) => v.isDefault && v.isActive),
    data.variants.findIndex((v) => v.isDefault)
  );
  return data.variants.map((v, i) => ({
    clientId: v.id,
    option_type: v.optionType,
    name: v.name,
    sku: v.sku,
    price_paise: v.price,
    mrp_paise: v.mrp,
    image_url: v.imageUrl,
    is_default: i === defaultIndex,
    is_active: i === defaultIndex ? true : v.isActive, // the default variant must be buyable
    sort_order: i,
    stock: v.stock,
  }));
}

function productColumns(data, slug) {
  const rentOn = data.rental.enabled || data.showAvailableOnRent;
  return {
    name: data.name,
    slug,
    sku: data.sku,
    brand: { connect: { id: data.brandId } },
    category: { connect: { id: data.categoryId } },
    short_description: data.shortDescription,
    description: sanitizeRichText(data.fullDescription),
    features: data.features,
    warranty: data.warranty,
    certifications: data.certifications,
    hsn_code: data.hsnCode,
    gst_rate: data.gstPercent,
    weight_grams: data.weightKg ? Math.round(data.weightKg * 1000) : null,
    length_cm: data.lengthCm || null,
    width_cm: data.widthCm || null,
    height_cm: data.heightCm || null,
    emi_enabled: data.emiEnabled,
    cod_enabled: data.codEnabled,
    rent_enabled: rentOn,
    is_featured: data.featured,
    is_best_seller: data.bestSeller,
    is_new_arrival: data.newArrival,
    meta_title: data.seoTitle,
    meta_description: data.seoDescription,
    status: data.status,
  };
}

/** A variant that orders or stock history point at is retired instead of deleted. */
async function removeVariants(tx, variants) {
  for (const v of variants) {
    const [orders, movements] = await Promise.all([
      tx.orderItem.count({ where: { variant_id: v.id } }),
      tx.stockMovement.count({ where: { variant_id: v.id } }),
    ]);
    if (orders === 0 && movements === 0) {
      await tx.productVariant.delete({ where: { id: v.id } });
    } else {
      await tx.productVariant.update({
        where: { id: v.id },
        data: { is_active: false, is_default: false, sku: tombstone(v.sku, v.id, SKU_MAX) },
      });
    }
  }
}

/** Creates / updates / retires variants so the DB matches `plan`. Returns saved rows in plan order. */
async function syncVariants(tx, productId, existing, plan) {
  const live = existing.filter((v) => !isRetired(v));
  const byId = new Map(live.map((v) => [String(v.id), v]));

  // Match each planned variant to an existing row
  const matched = plan.map((p) => {
    if (p.implicit) return live.find((v) => v.option_type === "default") || null;
    const row = isDbId(p.clientId) ? byId.get(p.clientId) : null;
    return row && row.option_type !== "default" ? row : null;
  });
  const keepIds = new Set(matched.filter(Boolean).map((v) => String(v.id)));

  // 1. retire / delete variants that were removed in the editor (frees their SKUs)
  await removeVariants(tx, live.filter((v) => !keepIds.has(String(v.id))));

  // 2. clear the default flag first — a partial unique index allows one default per product
  if (keepIds.size) {
    await tx.productVariant.updateMany({ where: { product_id: productId, is_default: true }, data: { is_default: false } });
  }

  // 3. two-phase SKU update so variants can swap SKUs without hitting the unique index
  for (const [i, row] of matched.entries()) {
    if (row && row.sku !== plan[i].sku) {
      await tx.productVariant.update({ where: { id: row.id }, data: { sku: `~tmp-${row.id}` } });
    }
  }

  // 4. update kept rows, create new ones
  const saved = [];
  for (const [i, p] of plan.entries()) {
    const data = {
      option_type: p.option_type,
      name: p.name,
      sku: p.sku,
      price_paise: p.price_paise,
      mrp_paise: p.mrp_paise,
      image_url: p.image_url,
      is_default: p.is_default,
      is_active: p.is_active,
      sort_order: p.sort_order,
      bulk_price_paise: p.bulk_price_paise ?? null,
      bulk_min_qty: p.bulk_price_paise ? 2 : null,
    };
    saved.push(
      matched[i]
        ? await tx.productVariant.update({ where: { id: matched[i].id }, data })
        : await tx.productVariant.create({ data: { ...data, product_id: productId } })
    );
  }
  return saved;
}

/**
 * Sets each variant's stock (total across warehouses) by adjusting the Main
 * Warehouse row, and writes a stock_movements row for every change.
 */
async function syncStock(tx, productId, savedVariants, plan, threshold, actorId) {
  const warehouseId = await getMainWarehouseId(tx);
  for (const [i, variant] of savedVariants.entries()) {
    const desired = plan[i].stock;
    const rows = await tx.inventory.findMany({ where: { variant_id: variant.id } });
    const total = rows.reduce((s, r) => s + r.quantity, 0);
    const reserved = rows.reduce((s, r) => s + r.reserved, 0);
    const field = plan[i].implicit ? "stock" : `variants.${i}.stock`;

    if (desired < reserved) {
      throw ApiError.badRequest(
        `"${variant.name === "Default" ? "Stock" : variant.name}" cannot go below ${reserved} — that many units are reserved by open orders.`,
        "STOCK_BELOW_RESERVED",
        { [field]: `At least ${reserved}` }
      );
    }

    const main = rows.find((r) => r.warehouse_id === warehouseId);
    const delta = desired - total;
    const mainQty = (main?.quantity ?? 0) + delta;
    if (mainQty < 0) {
      throw ApiError.badRequest(
        "Stock is held in other warehouses — reduce it from the Inventory page instead.",
        "STOCK_IN_OTHER_WAREHOUSES",
        { [field]: "Use the Inventory page" }
      );
    }

    await tx.inventory.upsert({
      where: { variant_id_warehouse_id: { variant_id: variant.id, warehouse_id: warehouseId } },
      create: { variant_id: variant.id, warehouse_id: warehouseId, quantity: mainQty, low_stock_threshold: threshold },
      update: { quantity: mainQty, low_stock_threshold: threshold },
    });

    if (delta !== 0) {
      await tx.stockMovement.create({
        data: {
          variant_id: variant.id,
          warehouse_id: warehouseId,
          change_qty: delta,
          reason: "correction",
          reference_type: "product",
          reference_id: productId,
          balance_after: mainQty,
          admin_user_id: actorId ?? null,
          note: "Set from the product editor",
        },
      });
    }
  }
}

async function replaceImagesAndSpecs(tx, productId, data) {
  await tx.productImage.deleteMany({ where: { product_id: productId } });
  if (data.images.length) {
    await tx.productImage.createMany({
      data: data.images.map((img, i) => ({
        product_id: productId,
        url: img.url,
        alt_text: img.altText,
        type: i === 0 ? "main" : img.type,
        sort_order: i, // 0 = main image
      })),
    });
  }
  await tx.productSpec.deleteMany({ where: { product_id: productId } });
  if (data.specifications.length) {
    await tx.productSpec.createMany({
      data: data.specifications.map((s, i) => ({ product_id: productId, spec_key: s.key, spec_value: s.value, sort_order: i })),
    });
  }
}

/** One rental_plans row per period. Plans with rentals attached are deactivated, never deleted. */
async function syncRentalPlans(tx, productId, data) {
  const rentOn = data.rental.enabled || data.showAvailableOnRent;
  const existing = await tx.rentalPlan.findMany({ where: { product_id: productId } });
  const wanted = new Map(data.rental.plans.map((p) => [p.durationType, p]));
  const shared = {
    security_deposit_paise: data.rental.securityDeposit,
    delivery_pickup_paise: data.rental.deliveryPickupCharge,
    prescription_required: data.rental.prescriptionRequired,
    is_active: rentOn,
  };

  for (const plan of existing) {
    if (wanted.has(plan.period)) continue;
    const used = await tx.rental.count({ where: { rental_plan_id: plan.id } });
    if (used) await tx.rentalPlan.update({ where: { id: plan.id }, data: { is_active: false } });
    else await tx.rentalPlan.delete({ where: { id: plan.id } });
  }
  for (const [period, p] of wanted) {
    const values = { ...shared, price_paise: p.price, min_periods: p.minDuration, max_periods: p.maxDuration };
    await tx.rentalPlan.upsert({
      where: { product_id_period: { product_id: productId, period } },
      create: { ...values, product_id: productId, period },
      update: values,
    });
  }
}

/**
 * Deal of the Day toggle. Switching it on starts a 24-hour deal on the default
 * variant at its current price; Marketing → Deals can then set the deal price
 * and exact window. Switching it off ends the product's running deals.
 */
async function syncDeal(tx, productId, wanted, defaultVariant) {
  const now = new Date();
  const running = await tx.deal.findMany({
    where: { variant: { product_id: productId }, is_active: true, ends_at: { gt: now } },
    select: { id: true },
  });
  if (wanted && running.length === 0) {
    await tx.deal.create({
      data: {
        variant_id: defaultVariant.id,
        deal_price_paise: defaultVariant.price_paise,
        starts_at: now,
        ends_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
  } else if (!wanted && running.length) {
    await tx.deal.updateMany({ where: { id: { in: running.map((d) => d.id) } }, data: { is_active: false } });
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Create (id = null) or update a product from the editor payload. */
export async function save(id, data, actor) {
  const existing = id ? await findProduct(id) : null;
  await assertLinks(data);

  const plan = planVariants(data);
  // "Buy 2+ price" belongs to the default variant
  plan.find((p) => p.is_default).bulk_price_paise = data.buyTwoPlusPrice;
  await assertSkusFree(data, plan, existing?.id);
  const slug = await resolveSlug(data, existing?.id);

  const columns = productColumns(data, slug);
  if (data.status === "active" && !existing?.published_at) columns.published_at = new Date();

  const productId = await prisma.$transaction(async (tx) => {
    const product = existing
      ? await tx.product.update({ where: { id: existing.id }, data: columns })
      : await tx.product.create({ data: columns });

    const saved = await syncVariants(tx, product.id, existing?.variants || [], plan);
    await syncStock(tx, product.id, saved, plan, data.lowStockThreshold, actor?.id);
    await replaceImagesAndSpecs(tx, product.id, data);
    await syncRentalPlans(tx, product.id, data);
    await syncDeal(tx, product.id, data.dealOfTheDay, saved.find((v) => v.is_default));
    return product.id;
  }, TX_OPTIONS);

  return { before: existing, product: await getById(productId) };
}

/** Copies a product as a draft (stock 0, fresh slug + SKUs, no deal). */
export async function duplicate(id, actor) {
  const source = await findProduct(id);
  const original = toAdminProduct(source);

  const freeSku = async (base) => {
    for (let i = 1; i < 100; i++) {
      const candidate = `${base.slice(0, 50 - 8)}-COPY${i > 1 ? i : ""}`;
      if ((await skuAvailable(candidate)).available) return candidate;
    }
    throw ApiError.conflict("Could not generate a free SKU for the copy");
  };

  const payload = {
    ...original,
    name: `${original.name} (Copy)`.slice(0, 250),
    slug: "",
    sku: await freeSku(original.sku),
    status: "draft",
    brandId: source.brand_id,
    categoryId: source.category_id,
    price: source.variants.find((v) => v.is_default)?.price_paise ?? 1n,
    mrp: source.variants.find((v) => v.is_default)?.mrp_paise ?? 1n,
    buyTwoPlusPrice: source.variants.find((v) => v.is_default)?.bulk_price_paise ?? null,
    stock: 0,
    dealOfTheDay: false,
    shortDescription: source.short_description,
    fullDescription: source.description || "",
    warranty: source.warranty,
    hsnCode: source.hsn_code,
    seoTitle: source.meta_title,
    seoDescription: source.meta_description,
    variants: [],
    images: source.images.map((img) => ({ url: img.url, type: img.type, altText: img.alt_text, sortOrder: img.sort_order })),
    specifications: source.specs.map((s) => ({ key: s.spec_key, value: s.spec_value, sortOrder: s.sort_order })),
    rental: {
      ...original.rental,
      plans: source.rental_plans
        .filter((p) => p.is_active)
        .map((p) => ({ durationType: p.period, price: p.price_paise, minDuration: p.min_periods, maxDuration: p.max_periods })),
      securityDeposit: source.rental_plans[0]?.security_deposit_paise ?? 0n,
      deliveryPickupCharge: source.rental_plans[0]?.delivery_pickup_paise ?? 0n,
    },
  };
  payload.showAvailableOnRent = payload.rental.enabled = source.rent_enabled && payload.rental.plans.length > 0;

  for (const v of original.variants) {
    const row = source.variants.find((sv) => String(sv.id) === v.id);
    payload.variants.push({
      id: undefined,
      optionType: v.optionType.toLowerCase(),
      name: v.name,
      sku: await freeSku(v.sku),
      price: row.price_paise,
      mrp: row.mrp_paise,
      stock: 0,
      imageUrl: row.image_url,
      isDefault: v.isDefault,
      isActive: v.isActive,
    });
  }

  const { product } = await save(null, payload, actor);
  return { source: original, product };
}

/**
 * Soft delete: the row stays for order history, but it disappears from the
 * admin + storefront and frees its slug / SKUs for reuse.
 */
async function softDelete(tx, product) {
  await tx.productVariant.updateMany({ where: { product_id: product.id }, data: { is_active: false } });
  for (const v of product.variants.filter((v) => !isRetired(v))) {
    await tx.productVariant.update({ where: { id: v.id }, data: { sku: tombstone(v.sku, v.id, SKU_MAX) } });
  }
  await tx.deal.updateMany({ where: { variant: { product_id: product.id }, is_active: true }, data: { is_active: false } });
  await tx.product.update({
    where: { id: product.id },
    data: {
      deleted_at: new Date(),
      status: "inactive",
      slug: tombstone(product.slug, product.id, SLUG_MAX),
      sku: tombstone(product.sku, product.id, SKU_MAX),
    },
  });
}

export async function remove(id) {
  const product = await findProduct(id);
  await prisma.$transaction((tx) => softDelete(tx, product), TX_OPTIONS);
  return product;
}

export async function bulk({ action, ids, categoryId }) {
  const productIds = ids.map((x) => BigInt(x));
  const where = { id: { in: productIds }, deleted_at: null };

  if (action === "activate") {
    const [first, rest] = await prisma.$transaction([
      prisma.product.updateMany({ where: { ...where, published_at: null }, data: { status: "active", published_at: new Date() } }),
      prisma.product.updateMany({ where, data: { status: "active" } }),
    ]);
    return Math.max(first.count, rest.count);
  }
  if (action === "deactivate") {
    return (await prisma.product.updateMany({ where, data: { status: "inactive" } })).count;
  }
  if (action === "change_category") {
    const category = await prisma.category.findFirst({ where: { id: BigInt(categoryId), deleted_at: null } });
    if (!category) throw ApiError.badRequest("Category not found", "INVALID_LINK", { categoryId: "Not found" });
    return (await prisma.product.updateMany({ where, data: { category_id: category.id } })).count;
  }
  // delete
  const products = await prisma.product.findMany({ where, include: { variants: true } });
  await prisma.$transaction(async (tx) => {
    for (const product of products) await softDelete(tx, product);
  }, TX_OPTIONS);
  return products.length;
}

export { RETIRED_MARK };
