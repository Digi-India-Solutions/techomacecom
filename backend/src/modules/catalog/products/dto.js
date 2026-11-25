import { discountPercent, paiseToRupees } from "../../../lib/money.js";
import { imageOut } from "../shared.js";

/**
 * Product DB rows → API shapes.
 *   toAdminProduct      admin/types Product (the product editor + list)
 *   toStorefrontProduct frontend/types Product (cards + product page)
 *
 * Variant kinds:
 *   option_type "default"         the hidden variant of a product that has no variants
 *                                 (price + stock still live on a variant — document §11.3)
 *   option_type size/pack/model   variants the admin manages in the Variants tab
 *   sku contains "~deleted-"      retired variant (removed in the editor but kept because
 *                                 orders / stock history reference it) — never shown
 */

export const RETIRED_MARK = "~deleted-";
export const isRetired = (v) => v.sku.includes(RETIRED_MARK);

/** Prisma include used everywhere a full product is needed. */
export function productInclude(now = new Date()) {
  return {
    brand: true,
    variants: {
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
      include: {
        inventory: true,
        deals: {
          where: {
            ends_at: { gt: now },
          },
          orderBy: { ends_at: "asc" },
        },
      },
    },
    images: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
    specs: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
    rental_plans: { orderBy: { id: "asc" } },
  };
}

const OPTION_OUT = { size: "Size", pack: "Pack", model: "Model" };
const PERIOD_ORDER = { daily: 0, weekly: 1, monthly: 2 };

/** quantity / reserved / available across all warehouses for one variant. */
export function variantStock(variant) {
  const qty = variant.inventory.reduce((s, i) => s + i.quantity, 0);
  const reserved = variant.inventory.reduce((s, i) => s + i.reserved, 0);
  const threshold = variant.inventory.length ? Math.min(...variant.inventory.map((i) => i.low_stock_threshold)) : 5;
  return { qty, reserved, available: Math.max(0, qty - reserved), threshold };
}

/** Splits a product's variants into what each view needs. */
export function variantParts(product) {
  const live = product.variants.filter((v) => !isRetired(v));
  const managed = live.filter((v) => v.option_type !== "default");
  const hidden = live.filter((v) => v.option_type === "default");
  const defaultVariant = live.find((v) => v.is_default) || managed[0] || hidden[0] || null;
  return { live, managed, hidden, defaultVariant };
}

const activeDealOf = (variants) =>
  variants
    .flatMap((v) => v.deals.map((d) => ({ ...d, variant: v })))
    .sort((a, b) => a.ends_at - b.ends_at)[0] || null;

/** Rental settings are stored on every plan row; the editor shows them once. */
function rentalSettings(product) {
  const plans = [...product.rental_plans].sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period]);
  const first = plans[0];
  return {
    plans,
    securityDepositPaise: first?.security_deposit_paise ?? 0n,
    deliveryPickupPaise: first?.delivery_pickup_paise ?? 0n,
    prescriptionRequired: first?.prescription_required ?? false,
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function toAdminProduct(product, categoryPath = "", merchMap = null) {
  const { live, managed, defaultVariant } = variantParts(product);
  const activeLive = live.filter((v) => v.is_active);
  const stock = activeLive.reduce((s, v) => s + variantStock(v).qty, 0);
  const reserved = activeLive.reduce((s, v) => s + variantStock(v).reserved, 0);
  const rental = rentalSettings(product);
  const pIdStr = String(product.id);

  const isDeal = merchMap?.dealOfTheDay ? merchMap.dealOfTheDay.has(pIdStr) : Boolean(activeDealOf(live));
  const isHot = merchMap?.hotSelling ? merchMap.hotSelling.has(pIdStr) : false;
  const isNew = merchMap?.newArrivals ? merchMap.newArrivals.has(pIdStr) : product.is_new_arrival;

  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brandId: String(product.brand_id),
    brandName: product.brand?.name || "",
    categoryId: String(product.category_id),
    categoryPath,
    shortDescription: product.short_description || "",
    fullDescription: product.description || "",
    status: product.status,
    price: defaultVariant ? paiseToRupees(defaultVariant.price_paise) : 0,
    mrp: defaultVariant ? paiseToRupees(defaultVariant.mrp_paise) : 0,
    gstPercent: Number(product.gst_rate),
    hsnCode: product.hsn_code || "",
    buyTwoPlusPrice: defaultVariant?.bulk_price_paise ? paiseToRupees(defaultVariant.bulk_price_paise) : null,
    stock,
    reservedStock: reserved,
    lowStockThreshold: defaultVariant ? variantStock(defaultVariant).threshold : 5,
    emiEnabled: product.emi_enabled,
    codEnabled: product.cod_enabled,
    featured: product.is_featured,
    bestSeller: product.is_best_seller,
    hotSelling: isHot,
    dealOfTheDay: isDeal,
    newArrival: isNew,
    showAvailableOnRent: product.rent_enabled,
    variants: managed.map((v) => ({
      id: String(v.id),
      optionType: OPTION_OUT[v.option_type] || "Model",
      name: v.name,
      sku: v.sku,
      price: paiseToRupees(v.price_paise),
      mrp: paiseToRupees(v.mrp_paise),
      stock: variantStock(v).qty,
      imageUrl: imageOut(v.image_url),
      isDefault: v.is_default,
      isActive: v.is_active,
      sortOrder: v.sort_order,
    })),
    images: product.images.map((img) => ({
      id: String(img.id),
      url: imageOut(img.url),
      path: img.url,
      type: img.type,
      altText: img.alt_text || "",
      sortOrder: img.sort_order,
    })),
    specifications: product.specs.map((s) => ({
      id: String(s.id),
      key: s.spec_key,
      value: s.spec_value,
      sortOrder: s.sort_order,
    })),
    features: product.features || [],
    warranty: product.warranty || "",
    certifications: product.certifications || [],
    weightKg: product.weight_grams ? product.weight_grams / 1000 : 0,
    lengthCm: product.length_cm ? Number(product.length_cm) : 0,
    widthCm: product.width_cm ? Number(product.width_cm) : 0,
    heightCm: product.height_cm ? Number(product.height_cm) : 0,
    rental: {
      enabled: product.rent_enabled,
      plans: rental.plans.map((p) => ({
        id: String(p.id),
        durationType: p.period,
        price: paiseToRupees(p.price_paise),
        minDuration: p.min_periods,
        maxDuration: p.max_periods,
      })),
      securityDeposit: paiseToRupees(rental.securityDepositPaise),
      deliveryPickupCharge: paiseToRupees(rental.deliveryPickupPaise),
      prescriptionRequired: rental.prescriptionRequired,
    },
    seoTitle: product.meta_title || "",
    seoDescription: product.meta_description || "",
    publishedAt: product.published_at,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

/**
 * @param category   { leaf, top, sub, path: [{id,name,slug}] } resolved from the category index
 * @param detail     true on the product page (adds description, specs, all images …)
 */
export function toStorefrontProduct(product, category, { detail = false } = {}) {
  const { live, defaultVariant } = variantParts(product);
  const sellable = live.filter((v) => v.is_active);
  const deal = activeDealOf(sellable);

  const regularPaise = defaultVariant?.price_paise ?? 0n;
  // An active Deal of the Day on the default variant overrides its selling price
  const dealOnDefault = deal && defaultVariant && deal.variant.id === defaultVariant.id ? deal : null;
  const pricePaise = dealOnDefault ? dealOnDefault.deal_price_paise : regularPaise;
  const mrpPaise = defaultVariant?.mrp_paise ?? 0n;

  const defaultStock = defaultVariant ? variantStock(defaultVariant) : { available: 0 };
  const anyInStock = sellable.some((v) => variantStock(v).available > 0);

  const images = product.images.map((img) => ({
    url: imageOut(img.url),
    alt: img.alt_text || product.name,
    type: img.type.replace(/_/g, "-"), // storefront uses "in-use", "box-contents"
  }));
  const thumbnail = images[0]?.url || "";

  const rental = rentalSettings(product);
  const activePlans = product.rent_enabled ? rental.plans.filter((p) => p.is_active) : [];
  const monthly = activePlans.find((p) => p.period === "monthly");

  const price = paiseToRupees(pricePaise);

  const base = {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    brandId: String(product.brand_id),
    brandName: product.brand?.name || "",
    brandSlug: product.brand?.slug || "",
    categoryId: category.top ? String(category.top.id) : String(product.category_id),
    categoryName: category.top?.name || "",
    categorySlug: category.top?.slug || "",
    subCategory: category.sub?.name || "",
    subCategorySlug: category.sub?.slug || "",
    leafCategoryId: String(product.category_id),
    categoryPath: category.path,
    price,
    mrp: paiseToRupees(mrpPaise),
    discountPercentage: discountPercent(mrpPaise, pricePaise),
    rating: Number(product.rating_avg),
    reviewsCount: product.rating_count,
    soldCount: product.sold_count,
    inStock: anyInStock,
    stockCount: defaultStock.available,
    isDealOfDay: Boolean(deal),
    dealExpiresAt: deal ? deal.ends_at.toISOString() : undefined,
    regularPrice: dealOnDefault ? paiseToRupees(regularPaise) : undefined,
    isFeatured: product.is_featured,
    isBestSeller: product.is_best_seller,
    isNewArrival: product.is_new_arrival,
    badgeText: product.badge_text || undefined,
    emiEnabled: product.emi_enabled,
    // "EMI from ₹x/month" teaser = price over the longest (12-month) no-cost tenure
    emiStartingFrom: product.emi_enabled ? Math.ceil(price / 12) : undefined,
    codEnabled: product.cod_enabled,
    saleEnabled: product.sale_enabled,
    rentEnabled: product.rent_enabled && activePlans.length > 0,
    rentPricePerMonth: monthly ? paiseToRupees(monthly.price_paise) : undefined,
    rentalPlans: activePlans.map((p) => ({
      type: p.period,
      price: paiseToRupees(p.price_paise),
      minDuration: p.min_periods,
      maxDuration: p.max_periods,
      securityDeposit: paiseToRupees(p.security_deposit_paise),
      installationFee: paiseToRupees(p.delivery_pickup_paise),
      ...(p.period === "monthly" && { pricePerMonth: paiseToRupees(p.price_paise) }),
    })),
    securityDeposit: activePlans.length ? paiseToRupees(rental.securityDepositPaise) : undefined,
    deliveryPickupCharge: activePlans.length ? paiseToRupees(rental.deliveryPickupPaise) : undefined,
    rentalPrescriptionRequired: activePlans.length ? rental.prescriptionRequired : undefined,
    images: detail ? images : images.slice(0, 2),
    thumbnail,
    image: thumbnail,
    shortDescription: product.short_description || "",
    gstRate: Number(product.gst_rate),
    warranty: product.warranty || "",
    variants: sellable
      .filter((v) => v.option_type !== "default")
      .map((v) => {
        const st = variantStock(v);
        const vDeal = v.deals[0];
        return {
          id: String(v.id),
          name: v.name,
          sku: v.sku,
          optionType: OPTION_OUT[v.option_type] || "Model",
          price: paiseToRupees(vDeal ? vDeal.deal_price_paise : v.price_paise),
          mrp: paiseToRupees(v.mrp_paise),
          inStock: st.available > 0,
          stockCount: st.available,
          image: imageOut(v.image_url),
          isDefault: v.is_default,
          bulkPrice: v.bulk_price_paise ? paiseToRupees(v.bulk_price_paise) : undefined,
          bulkMinQty: v.bulk_min_qty || undefined,
        };
      }),
    defaultVariantId: defaultVariant ? String(defaultVariant.id) : undefined,
    bulkPrice: defaultVariant?.bulk_price_paise ? paiseToRupees(defaultVariant.bulk_price_paise) : undefined,
    bulkMinQty: defaultVariant?.bulk_min_qty || undefined,
  };

  if (!detail) {
    return { ...base, description: "", specifications: {}, features: product.features || [], certifications: [] };
  }

  return {
    ...base,
    description: product.description || "",
    specifications: Object.fromEntries(product.specs.map((s) => [s.spec_key, s.spec_value])),
    features: product.features || [],
    certifications: product.certifications || [],
    hsnCode: product.hsn_code || "",
    weightKg: product.weight_grams ? product.weight_grams / 1000 : undefined,
    seoTitle: product.meta_title || "",
    seoDescription: product.meta_description || "",
  };
}
