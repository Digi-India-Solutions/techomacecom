import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z.string({ error: "Choose a reason" }).trim().min(3, "Choose a reason").max(200, "At most 200 characters"),
  note: z
    .string()
    .trim()
    .max(500, "At most 500 characters")
    .nullish()
    .transform((v) => v || ""),
});
