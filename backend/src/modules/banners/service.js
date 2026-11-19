import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function formatDate(date) {
  if (!date) return "";
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function formatHeroBanner(b) {
  return {
    id: b.id.toString(),
    title: b.title || "",
    desktopImageUrl: b.image_desktop_url,
    mobileImageUrl: b.image_mobile_url || b.image_desktop_url,
    linkUrl: b.link_url || "",
    altText: b.alt_text || "",
    startDate: formatDate(b.starts_at),
    endDate: formatDate(b.ends_at),
    active: Boolean(b.is_active),
    sortOrder: b.sort_order || 1,
  };
}

export async function seedInitialHeroBannersIfEmpty() {
  const count = await prisma.banner.count({
    where: { placement: "hero", deleted_at: null },
  });
  if (count > 0) return;

  console.log("Seeding initial hero banners into database...");

  const initialBanners = [
    {
      placement: "hero",
      title: "Home ICU & Respiratory Care — Rent or Buy",
      image_desktop_url: "/src/assets/images/product_oxygen_concentrator_1794913183075.jpg",
      image_mobile_url: "/src/assets/images/product_oxygen_concentrator_1794913183075.jpg",
      link_url: "/category/respiratory-care",
      alt_text: "MedixPulse 5L Oxygen Concentrators starting ₹4,500/month on rent",
      starts_at: new Date("2026-11-01"),
      ends_at: new Date("2026-12-31"),
      is_active: true,
      sort_order: 1,
    },
    {
      placement: "hero",
      title: "Turnkey Dental Clinic Chairs — 0% EMI Available",
      image_desktop_url: "/src/assets/images/product_dental_chair_1794913183436.jpg",
      image_mobile_url: "/src/assets/images/product_dental_chair_1794913183436.jpg",
      link_url: "/category/dental-equipment",
      alt_text: "DentaLux 5000 Dental Chair with free pan-India installation",
      starts_at: new Date("2026-11-10"),
      ends_at: new Date("2026-12-15"),
      is_active: true,
      sort_order: 2,
    },
  ];

  for (const b of initialBanners) {
    await prisma.banner.create({ data: b });
  }

  console.log(`✔ Seeded ${initialBanners.length} hero banners.`);
}

export async function listHeroBanners() {
  await seedInitialHeroBannersIfEmpty();

  const banners = await prisma.banner.findMany({
    where: {
      placement: "hero",
      deleted_at: null,
    },
    orderBy: { sort_order: "asc" },
  });

  return banners.map(formatHeroBanner);
}

export async function getHeroBannerById(id) {
  let bId;
  try {
    bId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid banner id");
  }

  const banner = await prisma.banner.findFirst({
    where: {
      id: bId,
      placement: "hero",
      deleted_at: null,
    },
  });

  if (!banner) return null;
  return formatHeroBanner(banner);
}

export async function createHeroBanner(payload, adminUser) {
  const last = await prisma.banner.findFirst({
    where: { placement: "hero", deleted_at: null },
    orderBy: { sort_order: "desc" },
  });
  const sortOrder = payload.sortOrder || (last ? last.sort_order + 1 : 1);

  await prisma.banner.create({
    data: {
      placement: "hero",
      title: payload.title || "",
      image_desktop_url: payload.desktopImageUrl,
      image_mobile_url: payload.mobileImageUrl || payload.desktopImageUrl,
      link_url: payload.linkUrl || "",
      alt_text: payload.altText || "",
      starts_at: payload.startDate ? new Date(payload.startDate) : null,
      ends_at: payload.endDate ? new Date(payload.endDate) : null,
      is_active: payload.active !== false,
      sort_order: sortOrder,
    },
  });

  return await listHeroBanners();
}

export async function updateHeroBanner(id, payload, adminUser) {
  let bId;
  try {
    bId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid banner id");
  }

  const existing = await prisma.banner.findFirst({
    where: { id: bId, placement: "hero", deleted_at: null },
  });
  if (!existing) throw ApiError.notFound("Hero banner not found");

  const data = {};
  if (payload.title !== undefined) data.title = payload.title;
  if (payload.desktopImageUrl !== undefined) data.image_desktop_url = payload.desktopImageUrl;
  if (payload.mobileImageUrl !== undefined) {
    data.image_mobile_url = payload.mobileImageUrl || payload.desktopImageUrl;
  }
  if (payload.linkUrl !== undefined) data.link_url = payload.linkUrl;
  if (payload.altText !== undefined) data.alt_text = payload.altText;
  if (payload.startDate !== undefined) {
    data.starts_at = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.endDate !== undefined) {
    data.ends_at = payload.endDate ? new Date(payload.endDate) : null;
  }
  if (payload.active !== undefined) data.is_active = payload.active;
  if (payload.sortOrder !== undefined) data.sort_order = payload.sortOrder;

  await prisma.banner.update({
    where: { id: bId },
    data,
  });

  return await listHeroBanners();
}

export async function reorderHeroBanners(ordered, adminUser) {
  if (!Array.isArray(ordered)) {
    throw ApiError.badRequest("Ordered array is required");
  }

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ordered.length; i++) {
      const item = ordered[i];
      let bId;
      try {
        bId = BigInt(item.id);
      } catch {
        continue;
      }
      await tx.banner.update({
        where: { id: bId },
        data: { sort_order: i + 1 },
      });
    }
  });

  return await listHeroBanners();
}

export async function deleteHeroBanner(id, adminUser) {
  let bId;
  try {
    bId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid banner id");
  }

  const existing = await prisma.banner.findFirst({
    where: { id: bId, placement: "hero", deleted_at: null },
  });
  if (!existing) throw ApiError.notFound("Hero banner not found");

  await prisma.banner.update({
    where: { id: bId },
    data: {
      deleted_at: new Date(),
      is_active: false,
    },
  });

  return await listHeroBanners();
}

export async function listPublicHeroBanners() {
  await seedInitialHeroBannersIfEmpty();

  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      placement: "hero",
      is_active: true,
      deleted_at: null,
      OR: [{ starts_at: null }, { starts_at: { lte: now } }],
      AND: [{ OR: [{ ends_at: null }, { ends_at: { gte: now } }] }],
    },
    orderBy: { sort_order: "asc" },
  });

  return banners.map(formatHeroBanner);
}


// =============================================================================
// Page Banners (Category, Brand, Best Sellers, Offers, Deals, etc.)
// =============================================================================

export const PAGE_TYPE_TO_PLACEMENT = {
  "Category": "category",
  "Brand": "brand",
  "Best Sellers": "best_sellers",
  "New Arrivals": "new_arrivals",
  "Offers": "offers",
  "Hot Selling": "hot_selling",
  "Deal of the Day": "deal_of_day",
  "Brands": "brands_page",
};

export const PLACEMENT_TO_PAGE_TYPE = {
  "category": "Category",
  "brand": "Brand",
  "best_sellers": "Best Sellers",
  "new_arrivals": "New Arrivals",
  "offers": "Offers",
  "hot_selling": "Hot Selling",
  "deal_of_day": "Deal of the Day",
  "brands_page": "Brands",
};

export function formatPageBanner(b) {
  let targetId = "";
  let targetLabel = "";

  if (b.alt_text && b.alt_text.includes(":::")) {
    const parts = b.alt_text.split(":::");
    targetId = b.target_id ? b.target_id.toString() : (parts[0] || "");
    targetLabel = parts.slice(1).join(":::") || "";
  } else {
    targetId = b.target_id ? b.target_id.toString() : "";
    targetLabel = b.alt_text || "";
  }

  return {
    id: b.id.toString(),
    pageType: PLACEMENT_TO_PAGE_TYPE[b.placement] || b.placement,
    targetId,
    targetLabel,
    title: b.title || "",
    desktopImageUrl: b.image_desktop_url,
    mobileImageUrl: b.image_mobile_url || b.image_desktop_url,
    linkUrl: b.link_url || "",
    startDate: formatDate(b.starts_at),
    endDate: formatDate(b.ends_at),
    active: Boolean(b.is_active),
    sortOrder: b.sort_order || 1,
  };
}

export async function seedInitialPageBannersIfEmpty() {
  const count = await prisma.banner.count({
    where: {
      placement: { not: "hero" },
      deleted_at: null,
    },
  });
  if (count > 0) return;

  console.log("Seeding initial page banners into database...");

  const initialBanners = [
    {
      placement: "category",
      title: "Certified 5L & 10L Oxygen Concentrators",
      image_desktop_url: "/src/assets/images/product_oxygen_concentrator_1794913183075.jpg",
      image_mobile_url: "/src/assets/images/product_oxygen_concentrator_1794913183075.jpg",
      link_url: "/category/respiratory-care",
      alt_text: "cat-respiratory:::Respiratory Care",
      starts_at: new Date("2026-11-01"),
      ends_at: new Date("2026-12-31"),
      is_active: true,
      sort_order: 1,
    },
    {
      placement: "deal_of_day",
      title: "24-Hour Clinic Sterilization & Operatory Deals",
      image_desktop_url: "/src/assets/images/product_autoclave_1794913184649.jpg",
      image_mobile_url: "/src/assets/images/product_autoclave_1794913184649.jpg",
      link_url: "/deals",
      alt_text: "",
      starts_at: new Date("2026-11-15"),
      ends_at: new Date("2026-11-30"),
      is_active: true,
      sort_order: 2,
    },
  ];

  for (const b of initialBanners) {
    await prisma.banner.create({ data: b });
  }

  console.log(`✔ Seeded ${initialBanners.length} page banners.`);
}

export async function listPageBanners(filters = {}) {
  await seedInitialPageBannersIfEmpty();

  const where = {
    placement: { not: "hero" },
    deleted_at: null,
  };

  if (filters.pageType && filters.pageType !== "all") {
    const mapped = PAGE_TYPE_TO_PLACEMENT[filters.pageType] || filters.pageType;
    where.placement = mapped;
  }

  const banners = await prisma.banner.findMany({
    where,
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });

  return banners.map(formatPageBanner);
}

export async function getPageBannerById(id) {
  let bId;
  try {
    bId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid banner id");
  }

  const banner = await prisma.banner.findFirst({
    where: {
      id: bId,
      placement: { not: "hero" },
      deleted_at: null,
    },
  });

  if (!banner) return null;
  return formatPageBanner(banner);
}

export async function createPageBanner(payload, adminUser) {
  const placement = PAGE_TYPE_TO_PLACEMENT[payload.pageType] || payload.pageType?.toLowerCase()?.replace(/\s+/g, '_') || "category";

  let targetId = null;
  let altText = payload.targetLabel || "";

  if (payload.targetId) {
    try {
      targetId = BigInt(payload.targetId);
      altText = payload.targetLabel || "";
    } catch {
      targetId = null;
      altText = `${payload.targetId}:::${payload.targetLabel || ""}`;
    }
  }

  const last = await prisma.banner.findFirst({
    where: { placement, deleted_at: null },
    orderBy: { sort_order: "desc" },
  });
  const sortOrder = payload.sortOrder || (last ? last.sort_order + 1 : 1);

  await prisma.banner.create({
    data: {
      placement,
      target_id: targetId,
      title: payload.title || "",
      image_desktop_url: payload.desktopImageUrl,
      image_mobile_url: payload.mobileImageUrl || payload.desktopImageUrl,
      link_url: payload.linkUrl || "",
      alt_text: altText,
      starts_at: payload.startDate ? new Date(payload.startDate) : null,
      ends_at: payload.endDate ? new Date(payload.endDate) : null,
      is_active: payload.active !== false,
      sort_order: sortOrder,
    },
  });

  return await listPageBanners();
}

export async function updatePageBanner(id, payload, adminUser) {
  let bId;
  try {
    bId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid banner id");
  }

  const existing = await prisma.banner.findFirst({
    where: { id: bId, placement: { not: "hero" }, deleted_at: null },
  });
  if (!existing) throw ApiError.notFound("Page banner not found");

  const data = {};
  if (payload.pageType !== undefined) {
    data.placement = PAGE_TYPE_TO_PLACEMENT[payload.pageType] || payload.pageType.toLowerCase().replace(/\s+/g, '_');
  }

  if (payload.targetId !== undefined || payload.targetLabel !== undefined) {
    const rawTargetId = payload.targetId !== undefined ? payload.targetId : (existing.target_id ? existing.target_id.toString() : "");
    const rawTargetLabel = payload.targetLabel !== undefined ? payload.targetLabel : "";

    if (rawTargetId) {
      try {
        data.target_id = BigInt(rawTargetId);
        data.alt_text = rawTargetLabel || "";
      } catch {
        data.target_id = null;
        data.alt_text = `${rawTargetId}:::${rawTargetLabel}`;
      }
    } else {
      data.target_id = null;
      data.alt_text = rawTargetLabel || "";
    }
  }

  if (payload.title !== undefined) data.title = payload.title;
  if (payload.desktopImageUrl !== undefined) data.image_desktop_url = payload.desktopImageUrl;
  if (payload.mobileImageUrl !== undefined) {
    data.image_mobile_url = payload.mobileImageUrl || payload.desktopImageUrl;
  }
  if (payload.linkUrl !== undefined) data.link_url = payload.linkUrl;
  if (payload.startDate !== undefined) {
    data.starts_at = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.endDate !== undefined) {
    data.ends_at = payload.endDate ? new Date(payload.endDate) : null;
  }
  if (payload.active !== undefined) data.is_active = payload.active;
  if (payload.sortOrder !== undefined) data.sort_order = payload.sortOrder;

  await prisma.banner.update({
    where: { id: bId },
    data,
  });

  return await listPageBanners();
}

export async function deletePageBanner(id, adminUser) {
  let bId;
  try {
    bId = BigInt(id);
  } catch {
    throw ApiError.badRequest("Invalid banner id");
  }

  const existing = await prisma.banner.findFirst({
    where: { id: bId, placement: { not: "hero" }, deleted_at: null },
  });
  if (!existing) throw ApiError.notFound("Page banner not found");

  await prisma.banner.update({
    where: { id: bId },
    data: {
      deleted_at: new Date(),
      is_active: false,
    },
  });

  return await listPageBanners();
}

export async function listPublicPageBanners(pageType, targetId) {
  await seedInitialPageBannersIfEmpty();

  const now = new Date();
  const placement = pageType ? (PAGE_TYPE_TO_PLACEMENT[pageType] || pageType) : undefined;

  const where = {
    placement: placement || { not: "hero" },
    is_active: true,
    deleted_at: null,
    OR: [{ starts_at: null }, { starts_at: { lte: now } }],
    AND: [{ OR: [{ ends_at: null }, { ends_at: { gte: now } }] }],
  };

  if (targetId) {
    try {
      where.target_id = BigInt(targetId);
    } catch {
      where.alt_text = { startsWith: `${targetId}:::` };
    }
  }

  const banners = await prisma.banner.findMany({
    where,
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });

  return banners.map(formatPageBanner);
}

// =============================================================================
// Homepage Sections & Announcement Strip (backed by homepage_sections & settings)
// =============================================================================

export const DEFAULT_HOMEPAGE_SECTIONS = [
  { key: 'hero', defaultName: 'Hero', title: 'Featured Clinical Solutions', visible: true, sortOrder: 1, configurableType: 'none', selectedIds: [] },
  { key: 'trust_strip', defaultName: 'Trust Strip', title: 'Why Clinics & Families Trust Buy Denmed', visible: true, sortOrder: 2, configurableType: 'none', selectedIds: [] },
  { key: 'top_categories', defaultName: 'Top Categories', title: 'Shop by Medical Department', visible: true, sortOrder: 3, configurableType: 'categories', selectedIds: ['cat-respiratory', 'cat-dental', 'cat-patient-monitoring', 'cat-hospital-mobility'] },
  { key: 'featured_categories', defaultName: 'Featured Categories', title: 'Clinical & Homecare Essentials', visible: true, sortOrder: 4, configurableType: 'categories', selectedIds: ['cat-oxygen-therapy', 'cat-operatory'] },
  { key: 'deal_of_the_day', defaultName: 'Deal of the Day', title: 'Deal of the Day', visible: true, sortOrder: 5, configurableType: 'products', selectedIds: ['prod-dental-chair'] },
  { key: 'hot_selling', defaultName: 'Hot Selling', title: 'Hot Selling Medical Devices', visible: true, sortOrder: 6, configurableType: 'products', selectedIds: ['prod-oxy-5l', 'prod-patient-monitor', 'prod-wheelchair'] },
  { key: 'rental_section', defaultName: 'Rental Section', title: 'Medical Equipment on Rent', visible: true, sortOrder: 7, configurableType: 'products', selectedIds: ['prod-oxy-5l', 'prod-icu-bed', 'prod-patient-monitor'] },
  { key: 'shop_by_brand', defaultName: 'Shop by Brand', title: 'Authorized Global Brands', visible: true, sortOrder: 8, configurableType: 'none', selectedIds: [] },
  { key: 'shop_by_need', defaultName: 'Shop by Care Setting', visible: true, sortOrder: 9, configurableType: 'none', selectedIds: [] },
  { key: 'sleep_test_banner', defaultName: 'Sleep Test Banner', title: 'Book a Home Sleep Apnea Study', visible: true, sortOrder: 10, configurableType: 'none', selectedIds: [] },
  { key: 'new_arrivals', defaultName: 'New Arrivals', title: 'New Arrivals', visible: true, sortOrder: 11, configurableType: 'products', selectedIds: ['prod-patient-monitor', 'prod-autoclave'] },
  { key: 'why_buy_denmed', defaultName: 'Why Buy Denmed', title: 'Biomedical Service & Warranty Guarantee', visible: true, sortOrder: 12, configurableType: 'none', selectedIds: [] },
  { key: 'testimonials', defaultName: 'Testimonials', title: 'Trusted by 4,200+ Doctors & Caregivers', visible: true, sortOrder: 13, configurableType: 'none', selectedIds: [] },
  { key: 'blog', defaultName: 'Blog', title: 'Clinical Buyer Guides', visible: true, sortOrder: 14, configurableType: 'none', selectedIds: [] },
];

export const DEFAULT_ANNOUNCEMENT_STRIP =
  'Free Pan-India Technician Installation on Dental Chairs & ICU Beds · 100% GST Input Tax Credit · Same-Day Delhi NCR Rental Dispatch';

const DEFAULT_META_MAP = Object.fromEntries(
  DEFAULT_HOMEPAGE_SECTIONS.map((s) => [s.key, { defaultName: s.defaultName, configurableType: s.configurableType }])
);

export function formatHomepageSection(s) {
  const cfg = s.config || {};
  const meta = DEFAULT_META_MAP[s.key] || { defaultName: s.key, configurableType: 'none' };

  return {
    id: s.id.toString(),
    key: s.key,
    defaultName: cfg.defaultName || meta.defaultName || s.key,
    title: s.title || "",
    visible: Boolean(s.is_visible),
    sortOrder: s.sort_order || 1,
    configurableType: cfg.configurableType || meta.configurableType || "none",
    selectedIds: Array.isArray(cfg.selectedIds) ? cfg.selectedIds : [],
  };
}

export async function seedInitialHomepageSectionsIfEmpty() {
  const count = await prisma.homepageSection.count();
  if (count === 0) {
    console.log("Seeding initial 14 homepage sections into database...");
    for (const s of DEFAULT_HOMEPAGE_SECTIONS) {
      await prisma.homepageSection.create({
        data: {
          key: s.key,
          title: s.title,
          is_visible: s.visible,
          sort_order: s.sortOrder,
          config: {
            defaultName: s.defaultName,
            configurableType: s.configurableType,
            selectedIds: s.selectedIds,
          },
        },
      });
    }
    console.log(`✔ Seeded ${DEFAULT_HOMEPAGE_SECTIONS.length} homepage sections.`);
  }

  // Seed announcement strip setting if missing
  const existingSetting = await prisma.setting.findUnique({
    where: {
      group_key_key: {
        group_key: "store",
        key: "announcement_strip",
      },
    },
  });

  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        group_key: "store",
        key: "announcement_strip",
        value: DEFAULT_ANNOUNCEMENT_STRIP,
      },
    });
  }
}

export async function getHomepageConfig() {
  await seedInitialHomepageSectionsIfEmpty();

  const sectionsFromDb = await prisma.homepageSection.findMany({
    orderBy: { sort_order: "asc" },
  });

  const setting = await prisma.setting.findUnique({
    where: {
      group_key_key: {
        group_key: "store",
        key: "announcement_strip",
      },
    },
  });

  let announcement = DEFAULT_ANNOUNCEMENT_STRIP;
  if (setting && setting.value !== undefined && setting.value !== null) {
    if (typeof setting.value === "string") {
      announcement = setting.value;
    } else {
      announcement = String(setting.value).replace(/^"|"$/g, "");
    }
  }

  const sections = sectionsFromDb.map(formatHomepageSection);

  return {
    announcementStrip: announcement,
    sections,
  };
}

export async function saveHomepageConfig(payload, adminUser) {
  const { announcementStrip, sections } = payload;

  await prisma.$transaction(async (tx) => {
    // 1. Update or create announcement strip in settings table
    if (announcementStrip !== undefined) {
      await tx.setting.upsert({
        where: {
          group_key_key: {
            group_key: "store",
            key: "announcement_strip",
          },
        },
        create: {
          group_key: "store",
          key: "announcement_strip",
          value: announcementStrip,
        },
        update: {
          value: announcementStrip,
        },
      });
    }

    // 2. Update each section
    if (Array.isArray(sections)) {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const sortOrder = i + 1;
        const meta = DEFAULT_META_MAP[s.key] || { defaultName: s.key, configurableType: "none" };

        const config = {
          defaultName: s.defaultName || meta.defaultName || "",
          configurableType: s.configurableType || meta.configurableType || "none",
          selectedIds: Array.isArray(s.selectedIds) ? s.selectedIds : [],
        };

        await tx.homepageSection.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            title: s.title || "",
            is_visible: s.visible !== false,
            sort_order: sortOrder,
            config,
          },
          update: {
            title: s.title || "",
            is_visible: s.visible !== false,
            sort_order: sortOrder,
            config,
          },
        });
      }
    }
  });

  return await getHomepageConfig();
}
