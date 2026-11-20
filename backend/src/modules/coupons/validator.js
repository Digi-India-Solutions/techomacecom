import { z } from "zod";

export const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .max(30)
    .transform((s) => s.trim().toUpperCase()),
  type: z
    .enum(["percentage", "percent", "flat"])
    .transform((t) => (t === "percentage" ? "percent" : t)),
  value: z.number().positive("Discount value must be positive"),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  minOrderValue: z.number().nonnegative().optional().default(0),
  applicableTo: z.enum(["all", "categories", "products", "brands"]).optional().default("all"),
  applicableTargetIds: z.array(z.union([z.string(), z.number()])).optional().default([]),
  usageLimitTotal: z.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.number().int().positive().optional().nullable(),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  firstOrderOnly: z.boolean().optional().default(false),
});

export const updateCouponSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(30)
    .transform((s) => s.trim().toUpperCase())
    .optional(),
  type: z
    .enum(["percentage", "percent", "flat"])
    .transform((t) => (t === "percentage" ? "percent" : t))
    .optional(),
  value: z.number().positive().optional(),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  minOrderValue: z.number().nonnegative().optional(),
  applicableTo: z.enum(["all", "categories", "products", "brands"]).optional(),
  applicableTargetIds: z.array(z.union([z.string(), z.number()])).optional(),
  usageLimitTotal: z.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.number().int().positive().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().optional(),
  firstOrderOnly: z.boolean().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").transform((s) => s.trim().toUpperCase()),
  orderTotalPaise: z.number().nonnegative(),
  customerId: z.union([z.string(), z.number()]).optional(),
});

