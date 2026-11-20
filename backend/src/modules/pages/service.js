import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

export const SLUG_ALIASES = {
  shipping: "shipping-policy",
  "shipping-policy": "shipping-policy",
  returns: "returns-refunds",
  "returns-refunds": "returns-refunds",
  privacy: "privacy-policy",
  "privacy-policy": "privacy-policy",
  terms: "terms-of-use",
  "terms-of-use": "terms-of-use",
  about: "about",
  contact: "contact",
  "rental-terms": "rental-terms",
  "pg-about": "about",
  "pg-contact": "contact",
  "pg-shipping": "shipping-policy",
  "pg-returns": "returns-refunds",
  "pg-rental-terms": "rental-terms",
  "pg-privacy": "privacy-policy",
  "pg-terms": "terms-of-use",
};

export const DEFAULT_PAGES = [
  {
    slug: "about",
    title: "About Buy Denmed",
    content:
      "<h3>India’s Trusted Medical &amp; Dental Equipment Partner</h3><p>Buy Denmed connects clinics, hospitals, and homecare families with ISO-certified diagnostic, respiratory, and dental equipment — available for both outright purchase and flexible monthly rentals.</p><p>Founded to bridge the trust and accessibility gap for healthcare practitioners across Indian cities, Buy Denmed delivers authorized equipment with verified GST invoices, calibrated warranties, and doorstep biomedical engineer support.</p>",
    meta_title: "About Buy Denmed | Medical & Dental Equipment Store",
    meta_description:
      "Learn about Buy Denmed’s biomedical engineering support, pan-India installation, and home ICU rental fleet.",
    is_published: true,
  },
  {
    slug: "contact",
    title: "Contact Us",
    content:
      "<p>Reach our Biomedical Sales &amp; Rental Support desk Monday–Saturday, 9 AM to 8 PM IST at <strong>+91 11 4089 2210</strong> or <strong>care@buydenmed.in</strong>.</p><p>Need assistance with order tracking, warranty claims, equipment rentals, or hospital tenders? Our dedicated biomedical engineers and customer desk are here to help.</p>",
    meta_title: "Contact Buy Denmed Support",
    meta_description:
      "Phone, WhatsApp, and Okhla Fulfillment Hub contact details for Buy Denmed.",
    is_published: true,
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    content:
      "<p>Standard clinical devices ship within 24 hours via BlueDart Air and Delhivery. Heavy equipment like Dental Chairs and ICU Beds ship with insured freight and technician assembly.</p><p>Orders with an invoice value exceeding ₹1,999 qualify for 100% Free Doorstep Delivery anywhere in India. Delhi NCR deliveries dispatch within 24 hours.</p>",
    meta_title: "Shipping & Delivery Policy | Buy Denmed",
    meta_description:
      "Pan-India delivery timelines and insured biomedical freight information.",
    is_published: true,
  },
  {
    slug: "returns-refunds",
    title: "Returns & Refunds",
    content:
      "<p>Eligible unopened equipment may be returned within 7 days of delivery. Transit-damaged devices qualify for instant replacement or full refund.</p><p>Refunds are credited directly to the original payment source within 3-5 business days following our warehouse quality inspection.</p>",
    meta_title: "Returns & Refunds Policy | Buy Denmed",
    meta_description:
      "Return window, reverse pickup, and Razorpay/bank refund timelines.",
    is_published: true,
  },
  {
    slug: "rental-terms",
    title: "Rental Terms",
    content:
      "<p>All medical rentals require valid Aadhaar KYC and a refundable security deposit. Deposits are refunded within 48 hours of return inspection.</p><p>Renters bear zero repair or routine service expenses. If an oxygen concentrator or CPAP machine displays a fault, our technician provides an immediate replacement unit.</p>",
    meta_title: "Medical Equipment Rental Terms | Buy Denmed",
    meta_description:
      "Security deposit, KYC verification, extension, and sanitisation guarantees.",
    is_published: true,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content:
      "<p>Customer KYC documents and doctor prescriptions are encrypted and used strictly for clinical compliance and rental verification.</p><p>We collect practitioner details solely for order processing, logistics dispatch, and B2B tax invoice generation. Buy Denmed never sells clinical data to third parties.</p>",
    meta_title: "Privacy Policy | Buy Denmed",
    meta_description: "How Buy Denmed protects customer and clinical data.",
    is_published: true,
  },
  {
    slug: "terms-of-use",
    title: "Terms & Conditions",
    content:
      "<p>Purchases and rentals on Buy Denmed are governed by Indian commercial and medical device distribution regulations.</p><p>All listed prices are in Indian Rupees (INR) and inclusive of GST unless specified. Valid GST invoices with appropriate HSN codes are provided for every purchase.</p>",
    meta_title: "Terms & Conditions | Buy Denmed",
    meta_description: "Terms of sale, warranty, and equipment usage.",
    is_published: true,
  },
];

export function formatPage(p) {
  if (!p) return null;
  return {
    id: p.id.toString(),
    slug: p.slug,
    title: p.title,
    contentHtml: p.content || "",
    seoTitle: p.meta_title || "",
    seoDescription: p.meta_description || "",
    isPublished: Boolean(p.is_published),
    createdAt: p.created_at ? p.created_at.toISOString() : null,
    updatedAt: p.updated_at ? p.updated_at.toISOString() : null,
  };
}

let seeded = false;

export async function ensureDefaultPages() {
  if (seeded) return;
  try {
    for (const def of DEFAULT_PAGES) {
      const existing = await prisma.page.findUnique({
        where: { slug: def.slug },
      });
      if (!existing) {
        await prisma.page.create({
          data: {
            slug: def.slug,
            title: def.title,
            content: def.content,
            meta_title: def.meta_title,
            meta_description: def.meta_description,
            is_published: def.is_published ?? true,
          },
        });
      }
    }
    seeded = true;
  } catch (err) {
    console.error("[pages] ensureDefaultPages error:", err.message);
  }
}

export async function listAdminPages() {
  await ensureDefaultPages();
  const rows = await prisma.page.findMany({
    orderBy: { id: "asc" },
  });
  return rows.map(formatPage);
}

export async function getPageByIdOrSlug(idOrSlug) {
  await ensureDefaultPages();
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
  let page = null;

  if (isNumeric) {
    page = await prisma.page.findUnique({
      where: { id: BigInt(idOrSlug) },
    });
  }

  if (!page) {
    const rawSlug = String(idOrSlug).trim().toLowerCase().replace(/^\/+/, "");
    const cleaned = rawSlug.replace(/^pg-/, "");
    const resolvedSlug = SLUG_ALIASES[rawSlug] || SLUG_ALIASES[cleaned] || cleaned;
    page = await prisma.page.findUnique({
      where: { slug: resolvedSlug },
    });
  }

  return formatPage(page);
}

export async function updatePage(idOrSlug, data = {}) {
  await ensureDefaultPages();
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
  let target = null;

  if (isNumeric) {
    target = await prisma.page.findUnique({ where: { id: BigInt(idOrSlug) } });
  }

  if (!target) {
    const rawSlug = String(idOrSlug).trim().toLowerCase().replace(/^\/+/, "");
    const cleaned = rawSlug.replace(/^pg-/, "");
    const resolvedSlug = SLUG_ALIASES[rawSlug] || SLUG_ALIASES[cleaned] || cleaned;
    target = await prisma.page.findUnique({ where: { slug: resolvedSlug } });
  }

  if (!target && data.slug) {
    const dataSlug = String(data.slug).trim().toLowerCase().replace(/^\/+/, "");
    const dataCleaned = dataSlug.replace(/^pg-/, "");
    const resolvedDataSlug = SLUG_ALIASES[dataSlug] || SLUG_ALIASES[dataCleaned] || dataCleaned;
    target = await prisma.page.findUnique({ where: { slug: resolvedDataSlug } });
  }

  if (!target) {
    throw ApiError.notFound("Page not found");
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = String(data.title).trim();
  if (data.contentHtml !== undefined) updateData.content = data.contentHtml;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.seoTitle !== undefined) updateData.meta_title = data.seoTitle;
  if (data.meta_title !== undefined) updateData.meta_title = data.meta_title;
  if (data.seoDescription !== undefined) updateData.meta_description = data.seoDescription;
  if (data.meta_description !== undefined) updateData.meta_description = data.meta_description;
  if (data.isPublished !== undefined) updateData.is_published = Boolean(data.isPublished);
  if (data.is_published !== undefined) updateData.is_published = Boolean(data.is_published);
  if (data.slug !== undefined && data.slug.trim()) {
    updateData.slug = String(data.slug).trim().toLowerCase().replace(/^\/+/, "");
  }

  const updated = await prisma.page.update({
    where: { id: target.id },
    data: updateData,
  });

  return formatPage(updated);
}

export async function createPage(data) {
  if (!data.slug || !data.title) {
    throw ApiError.badRequest("Slug and title are required");
  }

  const slug = String(data.slug).trim().toLowerCase().replace(/^\/+/, "");
  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) {
    throw ApiError.conflict(`Page with slug "${slug}" already exists`);
  }

  const created = await prisma.page.create({
    data: {
      slug,
      title: String(data.title).trim(),
      content: data.contentHtml ?? data.content ?? "",
      meta_title: data.seoTitle ?? data.meta_title ?? null,
      meta_description: data.seoDescription ?? data.meta_description ?? null,
      is_published: data.isPublished ?? data.is_published ?? true,
    },
  });

  return formatPage(created);
}

export async function deletePage(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
  let target = null;

  if (isNumeric) {
    target = await prisma.page.findUnique({ where: { id: BigInt(idOrSlug) } });
  }

  if (!target) {
    const rawSlug = String(idOrSlug).trim().toLowerCase().replace(/^\/+/, "");
    target = await prisma.page.findUnique({ where: { slug: rawSlug } });
  }

  if (!target) {
    throw ApiError.notFound("Page not found");
  }

  await prisma.page.delete({ where: { id: target.id } });
  return { success: true, id: target.id.toString(), slug: target.slug };
}

export async function listPublicPages() {
  await ensureDefaultPages();
  const rows = await prisma.page.findMany({
    where: { is_published: true },
    orderBy: { id: "asc" },
  });
  return rows.map(formatPage);
}

export async function getPublicPage(rawSlug) {
  await ensureDefaultPages();
  const slug = String(rawSlug).trim().toLowerCase().replace(/^\/+/, "");
  const resolvedSlug = SLUG_ALIASES[slug] || slug;

  let page = await prisma.page.findFirst({
    where: {
      slug: resolvedSlug,
      is_published: true,
    },
  });

  if (!page && resolvedSlug !== slug) {
    page = await prisma.page.findFirst({
      where: {
        slug: slug,
        is_published: true,
      },
    });
  }

  if (!page) {
    throw ApiError.notFound(`Page "${rawSlug}" not found`);
  }

  return formatPage(page);
}

