import { z } from "zod";
import { idString, imageField, optionalText, slugField } from "../shared.js";

/** Body of POST /admin/categories and PUT /admin/categories/:id (admin CategoryPayload). */
export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(120),
  slug: slugField(140),
  // null / "" / missing → top-level (Level 1) category
  parentId: z
    .union([idString, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? BigInt(v) : null)),
  iconUrl: imageField,
  imageUrl: imageField, // card / tile image on the storefront
  desktopBannerUrl: imageField,
  mobileBannerUrl: imageField,
  description: optionalText(2000),
  seoTitle: optionalText(200),
  seoDescription: optionalText(320),
  showInMenu: z.boolean().optional().default(true),
  showOnHomepage: z.boolean().optional().default(false),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

/**
 * PUT /admin/categories/tree — the whole tree after a drag-and-drop:
 *   { tree: [{ id: "1", children: [{ id: "4", children: [] }] }, …] }
 * Order in each array = sort order. Depth is limited to 3 here and re-checked in the service.
 */
const level3 = z.object({ id: idString, children: z.array(z.any()).max(0, "Categories support at most 3 levels").optional() });
const level2 = z.object({ id: idString, children: z.array(level3).max(1000).optional().default([]) });
const level1 = z.object({ id: idString, children: z.array(level2).max(1000).optional().default([]) });

export const treeSchema = z.object({ tree: z.array(level1).max(1000) });
