import { z } from "zod";

export const adjustStockSchema = z.object({
  delta: z.number().int().optional().default(0),
  availableStock: z.number().int().min(0).optional(),
  reservedStock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reason: z
    .enum([
      "purchase",
      "sale",
      "return",
      "damage",
      "correction",
      "reserve",
      "release",
      "audit",
    ])
    .optional()
    .default("correction"),
  note: z.string().max(500).optional().default(""),
});

export const stockQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["all", "in_stock", "low_stock", "out_of_stock", "low_or_out"])
    .optional()
    .default("all"),
  warehouseId: z.string().optional().default("all"),
});


