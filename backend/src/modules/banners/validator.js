import { z } from "zod";

// Hero Banners
export const heroBannerSchema = z.object({
  title: z.string().max(150).optional().default(""),
  desktopImageUrl: z.string().min(1, "Desktop image is required"),
  mobileImageUrl: z.string().optional().default(""),
  linkUrl: z.string().max(255).optional().default(""),
  altText: z.string().max(200).optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

export const updateHeroBannerSchema = heroBannerSchema.partial();

const orderedItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    sortOrder: z.number().int().optional(),
  })
  .passthrough();

export const reorderHeroBannersSchema = z.union([
  z.object({
    ordered: z.array(orderedItemSchema),
  }),
  z.array(orderedItemSchema),
]);

// Page Banners
export const pageBannerSchema = z.object({
  pageType: z.string().min(1, "Page type is required"),
  targetId: z.string().optional().default(""),
  targetLabel: z.string().optional().default(""),
  title: z.string().max(150).optional().default(""),
  desktopImageUrl: z.string().min(1, "Desktop image is required"),
  mobileImageUrl: z.string().optional().default(""),
  linkUrl: z.string().max(255).optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

export const updatePageBannerSchema = pageBannerSchema.partial();

// Homepage Sections & Announcement Strip
export const homepageSectionItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  key: z.string().min(1),
  defaultName: z.string().optional().default(""),
  title: z.string().optional().default(""),
  visible: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(1),
  configurableType: z.enum(["none", "products", "categories"]).optional().default("none"),
  selectedIds: z.array(z.string()).optional().default([]),
});

export const saveHomepageConfigSchema = z.object({
  announcementStrip: z.string().optional().default(""),
  sections: z.array(homepageSectionItemSchema),
});
