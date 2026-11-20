import { z } from "zod";
import { imageField, optionalText, slugField } from "../shared.js";

/** Body of POST /admin/brands and PUT /admin/brands/:id (admin BrandPayload). */
export const brandSchema = z.object({
  name: z.string().trim().min(2, "Brand name must be at least 2 characters").max(120),
  slug: slugField(140),
  logoUrl: imageField, // empty → storefront shows the name as a text wordmark
  desktopBannerUrl: imageField,
  mobileBannerUrl: imageField,
  description: optionalText(2000),
  originCountry: optionalText(80),
  authorizedDistributor: z.boolean().optional().default(false),
  featuredOnHomepage: z.boolean().optional().default(false),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  seoTitle: optionalText(200),
  seoDescription: optionalText(320),
});

export const brandListQuery = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
  status: z.enum(["active", "inactive"]).optional(),
});
