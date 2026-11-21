import { z } from "zod";

export const dealSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  dealPrice: z.number().positive("Deal price must be greater than 0"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateDealSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  dealPrice: z.number().positive().optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

