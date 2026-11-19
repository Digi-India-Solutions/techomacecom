import { z } from "zod";

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "Variant SKU is required"),
  price: z.number().min(0, "Price must be >= 0"),
  mrp: z.number().min(0, "MRP must be >= 0"),
  stock: z.number().int().min(0).optional().default(0),
  optionType: z.string().optional().default("model"),
  imageUrl: z.string().optional().default(""),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, "Image URL is required"),
  altText: z.string().optional().default(""),
  type: z.string().optional().default("main"),
  sortOrder: z.number().int().optional().default(0),
});

const specSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, "Specification key is required"),
  value: z.string().min(1, "Specification value is required"),
  sortOrder: z.number().int().optional().default(0),
});

const rentalPlanSchema = z.object({
  id: z.string().optional(),
  durationType: z.enum(["daily", "weekly", "monthly"]),
  price: z.number().min(0),
  minDuration: z.number().int().min(1).optional().default(1),
  maxDuration: z.number().int().min(1).optional().default(12),
});

const rentalConfigSchema = z
  .object({
    enabled: z.boolean().optional().default(false),
    plans: z.array(rentalPlanSchema).optional().default([]),
    securityDeposit: z.number().min(0).optional().default(0),
    deliveryPickupCharge: z.number().min(0).optional().default(0),
    kycRequired: z.boolean().optional().default(true),
    prescriptionRequired: z.boolean().optional().default(false),
  })
  .optional();

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(250),
  slug: z.string().max(270).optional(),
  sku: z.string().min(1, "Primary SKU is required").max(60),
  brandId: z.union([z.string(), z.number()]).optional().default(""),
  categoryId: z.union([z.string(), z.number()]).optional().default(""),
  shortDescription: z.string().max(400).optional().default(""),
  fullDescription: z.string().optional().default(""),
  status: z
    .enum(["draft", "active", "inactive", "out_of_stock"])
    .optional()
    .default("draft"),
  price: z.number().min(0).optional().default(0),
  mrp: z.number().min(0).optional().default(0),
  gstPercent: z.number().optional().default(18),
  hsnCode: z.string().max(10).optional().default(""),
  stock: z.number().int().min(0).optional().default(0),
  reservedStock: z.number().int().min(0).optional().default(0),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  emiEnabled: z.boolean().optional().default(false),
  codEnabled: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  newArrival: z.boolean().optional().default(false),
  showAvailableOnRent: z.boolean().optional().default(false),
  variants: z.array(variantSchema).optional().default([]),
  images: z.array(imageSchema).optional().default([]),
  specifications: z.array(specSchema).optional().default([]),
  weightKg: z.number().min(0).optional().default(1),
  lengthCm: z.number().min(0).optional().default(0),
  widthCm: z.number().min(0).optional().default(0),
  heightCm: z.number().min(0).optional().default(0),
  rental: rentalConfigSchema,
  seoTitle: z.string().max(200).optional().default(""),
  seoDescription: z.string().max(320).optional().default(""),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.string().optional(),
  stockLevel: z.string().optional(),
});

