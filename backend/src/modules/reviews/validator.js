import { z } from "zod";
import { listQuery, queryBool, queryId } from "../../lib/list.js";

export const REVIEW_STATUSES = ["pending", "approved", "rejected"];
export const MAX_REVIEW_IMAGES = 3;

const id = z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id");
export const idParams = z.object({ id });
export const productParams = z.object({ productId: id });

/** "/uploads/reviews/2026/11/<20 hex>.webp" or the same as an absolute URL (checked again in the service). */
const imagePath = z.string().trim().max(500);

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

/** GET /reviews/product/:productId */
export const productReviewsQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  withImages: queryBool.optional(),
});

/** GET /reviews/featured */
export const featuredQuery = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(8),
});

/** GET /reviews/mine?productId= */
export const mineQuery = z.object({ productId: queryId });

/**
 * POST /reviews — create or edit the signed-in customer's review of a product.
 * Editing sends it back to "pending" for moderation.
 */
export const submitReviewSchema = z.object({
  productId: id,
  rating: z.coerce.number({ error: "Choose a star rating" }).int().min(1, "Choose a star rating").max(5),
  name: z.string({ error: "Name is required" }).trim().min(2, "Name is required").max(80),
  title: z
    .string()
    .trim()
    .max(150, "Title must be at most 150 characters")
    .optional()
    .default("")
    .transform((v) => v || null),
  comment: z
    .string({ error: "Write your review" })
    .trim()
    .min(20, "Review must be at least 20 characters")
    .max(600, "Review must be at most 600 characters"),
  images: z.array(imagePath).max(MAX_REVIEW_IMAGES, `Up to ${MAX_REVIEW_IMAGES} photos`).optional().default([]),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional();

/** GET /admin/reviews */
export const adminListQuery = listQuery({
  status: z.enum(REVIEW_STATUSES).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  productId: queryId.optional(),
  customerId: queryId.optional(),
  verified: queryBool.optional(),
  featured: queryBool.optional(),
  withImages: queryBool.optional(),
  from: dateOnly,
  to: dateOnly,
});

/** PATCH /admin/reviews/:id/status */
export const statusSchema = z
  .object({
    status: z.enum(REVIEW_STATUSES),
    reason: z.string().trim().max(500).optional().default(""),
  })
  .refine((v) => v.status !== "rejected" || v.reason.length >= 3, {
    message: "Give a reason for rejecting",
    path: ["reason"],
  });

/** PUT /admin/reviews/:id — fix typos / remove personal info (rating stays the customer's). */
export const editSchema = z.object({
  title: z
    .string()
    .trim()
    .max(150)
    .optional()
    .default("")
    .transform((v) => v || null),
  comment: z.string({ error: "Comment is required" }).trim().min(5, "Comment is too short").max(600),
});

/** PATCH /admin/reviews/:id/reply — empty string removes the reply. */
export const replySchema = z.object({ reply: z.string().trim().max(1000) });

export const featureSchema = z.object({ featured: z.boolean() });
export const verifiedSchema = z.object({ verified: z.boolean() });

/** POST /admin/reviews/bulk */
export const bulkSchema = z
  .object({
    ids: z.array(id).min(1, "Select at least one review").max(100),
    action: z.enum(["approve", "reject", "delete"]),
    reason: z.string().trim().max(500).optional().default(""),
  })
  .refine((v) => v.action !== "reject" || v.reason.length >= 3, { message: "Give a reason for rejecting", path: ["reason"] });
