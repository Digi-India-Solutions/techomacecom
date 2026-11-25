import { z } from "zod";
import { gstRateField, rupeesField } from "../../../lib/money.js";
import { listQuerySchema, queryBool, queryId } from "../../../lib/list.js";
import { idString, imageField, optionalText, slugField } from "../shared.js";
import { SORT_KEYS } from "./query.js";

/**
 * Validation for the admin product editor (admin/types ProductFormPayload).
 * Money arrives in rupees from the form and leaves this schema as paise BigInt.
 */

const SKU_RE = /^[A-Z0-9][A-Z0-9._\-/]*$/;
const sku = (label) =>
  z
    .string()
    .trim()
    .toUpperCase()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(SKU_RE, `${label}: use letters, numbers and - _ . / only`);

const price = rupeesField({ min: 0.01 });
const amountOrZero = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => (v === undefined || v === "" ? 0 : v))
  .pipe(rupeesField({ min: 0 }));
const stockQty = z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(10_000_000);
const cm = z.coerce.number().min(0).max(99_999).optional().default(0);

/** Drops rows the admin added but left completely empty. */
const withoutBlankRows = (keys) => (rows) =>
  Array.isArray(rows) ? rows.filter((r) => r && keys.some((k) => String(r[k] ?? "").trim() !== "")) : rows;

const variantSchema = z.object({
  id: z.string().max(40).optional(), // a DB id for existing variants, a temp id ("var-…") for new ones
  optionType: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(["size", "pack", "model"], { error: "Option type must be Size, Pack or Model" })),
  name: z.string().trim().min(1, "Variant name is required").max(150),
  sku: sku("Variant SKU"),
  price,
  mrp: price,
  stock: stockQty,
  imageUrl: imageField,
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional().default(0),
});

const imageSchema = z
  .object({
    id: z.string().max(40).optional(),
    url: z.string().optional().default(""),
    path: z.string().optional(),
    type: z.enum(["main", "angle", "detail", "in_use", "box_contents", "infographic"]).optional().default("main"),
    altText: optionalText(200),
    sortOrder: z.coerce.number().int().min(0).optional().default(0),
    uploading: z.boolean().optional(),
  })
  .transform((img, ctx) => {
    if (img.uploading) {
      ctx.addIssue({ code: "custom", message: "Wait for the image upload to finish before saving" });
      return z.NEVER;
    }
    // Prefer the server path from the upload API; fall back to the URL
    const parsed = imageField.safeParse(img.path || img.url);
    if (!parsed.success || !parsed.data) {
      ctx.addIssue({ code: "custom", message: parsed.success ? "Image is missing" : parsed.error.issues[0].message });
      return z.NEVER;
    }
    return { url: parsed.data, type: img.type, altText: img.altText, sortOrder: img.sortOrder };
  });

const specSchema = z.object({
  key: z.string().trim().min(1, "Specification name is required").max(100),
  value: z.string().trim().min(1, "Specification value is required").max(300),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

const rentalPlanSchema = z.object({
  id: z.string().max(40).optional(),
  durationType: z.enum(["daily", "weekly", "monthly"]),
  price,
  minDuration: z.coerce.number().int().min(1, "Minimum duration is at least 1").max(1000),
  maxDuration: z.coerce.number().int().min(1).max(1000),
});

const stringList = (maxItems, maxLen) =>
  z
    .array(z.string().trim().max(maxLen, `Each entry must be at most ${maxLen} characters`))
    .max(maxItems, `At most ${maxItems} entries`)
    .optional()
    .default([])
    .transform((list) => [...new Set(list.filter(Boolean))]);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Product name must be at least 2 characters").max(250),
    slug: slugField(270),
    sku: sku("SKU"),
    brandId: idString.transform((v) => BigInt(v)),
    categoryId: idString.transform((v) => BigInt(v)),
    shortDescription: optionalText(400),
    fullDescription: z.string().max(100_000, "Description is too long").optional().default(""),
    status: z.enum(["draft", "active", "inactive"]).optional().default("draft"),

    // Used when the product has no variants (otherwise each variant carries its own)
    price,
    mrp: price,
    stock: stockQty.optional().default(0),
    buyTwoPlusPrice: z
      .union([z.number(), z.string(), z.null()])
      .optional()
      .transform((v) => (v === null || v === undefined || v === "" || v === 0 ? null : v))
      .pipe(z.union([z.null(), rupeesField({ min: 0.01 })])),
    lowStockThreshold: z.coerce.number().int().min(0).max(100_000).optional().default(5),

    gstPercent: gstRateField,
    hsnCode: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((v) => v === "" || /^\d{4,8}$/.test(v), "HSN code must be 4–8 digits")
      .transform((v) => v || null),

    emiEnabled: z.boolean().optional().default(false),
    codEnabled: z.boolean().optional().default(true),
    featured: z.boolean().optional().default(false),
    bestSeller: z.boolean().optional().default(false),
    hotSelling: z.boolean().optional().default(false),
    dealOfTheDay: z.boolean().optional().default(false),
    newArrival: z.boolean().optional().default(false),
    showAvailableOnRent: z.boolean().optional().default(false),

    variants: z.array(variantSchema).max(100, "At most 100 variants").optional().default([]),
    images: z.array(imageSchema).max(30, "At most 30 images").optional().default([]),
    specifications: z
      .preprocess(withoutBlankRows(["key", "value"]), z.array(specSchema).max(100, "At most 100 specifications"))
      .optional()
      .default([]),
    features: stringList(30, 200),
    warranty: optionalText(200),
    certifications: stringList(20, 60),

    weightKg: z.coerce.number().min(0).max(10_000).optional().default(0),
    lengthCm: cm,
    widthCm: cm,
    heightCm: cm,

    rental: z
      .object({
        enabled: z.boolean().optional().default(false),
        plans: z.array(rentalPlanSchema).max(3).optional().default([]),
        securityDeposit: amountOrZero,
        deliveryPickupCharge: amountOrZero,
        prescriptionRequired: z.boolean().optional().default(false),
      })
      .optional()
      .default({ enabled: false, plans: [], securityDeposit: 0n, deliveryPickupCharge: 0n, prescriptionRequired: false }),

    seoTitle: optionalText(200),
    seoDescription: optionalText(320),
  })
  .superRefine((p, ctx) => {
    if (p.variants.length === 0 && p.mrp < p.price) {
      ctx.addIssue({ code: "custom", path: ["mrp"], message: "MRP must be greater than or equal to the selling price" });
    }
    if (p.buyTwoPlusPrice !== null && p.buyTwoPlusPrice >= (p.variants.find((v) => v.isDefault) || p.variants[0] || p).price) {
      ctx.addIssue({ code: "custom", path: ["buyTwoPlusPrice"], message: "Buy 2+ price must be lower than the selling price" });
    }

    const seen = new Map();
    p.variants.forEach((v, i) => {
      if (v.mrp < v.price) ctx.addIssue({ code: "custom", path: ["variants", i, "mrp"], message: "MRP must be ≥ price" });
      if (seen.has(v.sku)) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: `Duplicate SKU "${v.sku}" in this product` });
      }
      seen.set(v.sku, i);
    });
    if (p.variants.length && !p.variants.some((v) => v.isActive)) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "At least one variant must be active" });
    }

    // If no rental plans are configured, automatically disable rent instead of blocking the save
    if (p.rental.plans.length === 0) {
      p.rental.enabled = false;
      p.showAvailableOnRent = false;
    }
    const rentOn = (p.rental.enabled || p.showAvailableOnRent) && p.rental.plans.length > 0;
    const periods = new Set();
    p.rental.plans.forEach((plan, i) => {
      if (plan.minDuration > plan.maxDuration) {
        ctx.addIssue({ code: "custom", path: ["rental", "plans", i, "maxDuration"], message: "Max duration must be ≥ min duration" });
      }
      if (periods.has(plan.durationType)) {
        ctx.addIssue({
          code: "custom",
          path: ["rental", "plans", i, "durationType"],
          message: `Only one ${plan.durationType} plan is allowed`,
        });
      }
      periods.add(plan.durationType);
    });
  });

/** GET /admin/products */
export const adminListQuery = listQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(SORT_KEYS).optional().default("-updatedAt"),
  categoryId: queryId.optional(),
  brandId: queryId.optional(),
  status: z.enum(["draft", "active", "inactive"]).optional(),
  stockLevel: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
  emi: queryBool.optional(),
  rent: queryBool.optional(),
  cod: queryBool.optional(),
});

/** POST /admin/products/bulk */
export const bulkSchema = z
  .object({
    action: z.enum(["activate", "deactivate", "delete", "change_category"]),
    ids: z.array(idString).min(1, "Select at least one product").max(500, "At most 500 products at a time"),
    categoryId: idString.optional(),
  })
  .refine((b) => b.action !== "change_category" || b.categoryId, { path: ["categoryId"], message: "Choose a category" });

/** GET /admin/products/sku-check?sku=&excludeProductId= */
export const skuCheckQuery = z.object({
  sku: z.string().trim().toUpperCase().min(1).max(60),
  excludeProductId: queryId.optional(),
});
