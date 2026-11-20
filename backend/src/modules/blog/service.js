import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

export function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DEFAULT_BLOGS = [
  {
    slug: "dental-clinic-setup-checklist-india",
    title: "Complete 2026 Dental Clinic Setup Checklist: Equipment, Compliance & Budgeting",
    cover_image_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
    excerpt: "Step-by-step equipment guide for dentists setting up their first clinic in India: from dental chairs to autoclaves and AERB radiation permissions.",
    content: `<p>Setting up a modern dental operatory requires balancing clinical ergonomics, infection control regulations, and capital expenditure.</p>
<h3>1. Operatory Dental Chair Unit</h3>
<p>Choose an electromechanical or hydraulic chair with multi-articulating headrest, programmable operator presets, and seamless medical-grade polyurethane upholstery for rapid disinfection between patients.</p>
<h3>2. Oil-Free Medical Compressor & Suction</h3>
<p>Moisture and oil mist damage internal dental handpiece turbines. Install a dry air compressor with dual desiccant dryers and continuous high-vacuum motorized evacuation.</p>
<h3>3. Class B Vacuum Autoclaves</h3>
<p>European Standard EN 13060 mandates Class B triple-pulse vacuum sterilization for hollow handpieces, surgical burs, and pouched implant cassettes.</p>
<h3>4. Digital Radiography (RVG & AERB Compliance)</h3>
<p>Pair high-frequency 70kV DC X-ray tubes with CMOS intraoral RVG sensors. Ensure your lead-lined operatory and installation report comply with Atomic Energy Regulatory Board (AERB) guidelines.</p>`,
    category: "Dental Clinic Management",
    tags: ["Dental Clinic", "Equipment Setup", "Autoclave", "AERB"],
    status: "published",
    published_at: new Date("2026-10-18T10:00:00Z"),
    meta_title: "Dental Clinic Setup Checklist 2026 | Buy Denmed Guide",
    meta_description: "Complete equipment and compliance guide for dentists starting private practice in India.",
  },
  {
    slug: "5l-vs-10l-oxygen-concentrator-home-care-guide",
    title: "5L vs 10L Oxygen Concentrator: How to Choose for Home Care",
    cover_image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    excerpt: "Understand flow rate requirements, oxygen purity percentages, and noise levels before buying or renting.",
    content: `<p>Choosing between a 5 LPM and 10 LPM stationary oxygen concentrator depends strictly on the patient’s prescribed LPM flow rate and whether bleed-in to a BiPAP ventilator is needed.</p>
<h3>1. Flow Rate Prescription (LPM)</h3>
<p>A 5-litre machine is designed for patients prescribed 1 to 4 LPM. If your doctor prescribes 5 LPM continuous flow, running a 5L machine at its maximum capacity will strain the compressor and sieve beds, resulting in lower oxygen purity (often dropping below 90%). For patients requiring 5 LPM or more, a 10L unit is strictly recommended.</p>
<h3>2. Ventilator & BiPAP Bleed-In</h3>
<p>When bleeding oxygen into non-invasive ventilation (NIV) or BiPAP circuits, high flow resistance requires a high-output 10 LPM oxygen concentrator capable of delivering at least 20 PSI pressure.</p>
<h3>3. Continuous Duty Cycle (24x7 Usage)</h3>
<p>Home ICU patients needing continuous 24-hour oxygen benefit immensely from dual-bottle 10L units with robust Thomas compressors and heavy-duty cooling fans.</p>`,
    category: "Respiratory Care",
    tags: ["Oxygen Concentrator", "Home ICU", "Buyer Guide"],
    status: "published",
    published_at: new Date("2026-11-08T10:00:00Z"),
    meta_title: "5L vs 10L Oxygen Concentrator Guide | Buy Denmed",
    meta_description: "Clinical comparison of 5L and 10L oxygen concentrators for Indian homecare.",
  },
  {
    slug: "class-b-vs-class-n-autoclaves-dental-clinic",
    title: "Class B vs Class N Autoclaves: Dental Clinic Compliance Checklist",
    cover_image_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
    excerpt: "Why pre-vacuum Class B sterilization is mandatory for hollow handpieces and pouched surgical kits.",
    content: `<p>Modern dental practices require triple pre-vacuum steam penetration to sterilize wrapped instruments and turbine handpieces reliably.</p>
<h3>Understanding European Standard EN 13060</h3>
<p>Autoclaves are categorized into Class N, Class S, and Class B. While Class N is suitable only for solid, unwrapped instruments, dental contra-angles and high-speed handpieces contain narrow internal lumens (hollow items) where air pockets prevent steam contact without a vacuum pump.</p>
<h3>Triple Fractional Vacuum Pulse</h3>
<p>Class B autoclaves run 3 distinct pre-vacuum cycles to extract 99% of air before injecting saturated steam at 134°C (2.1 bar pressure), ensuring complete pathogen destruction even inside miniature turbine bearings.</p>`,
    category: "Sterilization & Safety",
    tags: ["Autoclave", "Dental Clinic", "Infection Control"],
    status: "published",
    published_at: new Date("2026-11-16T15:20:00Z"),
    meta_title: "Class B vs Class N Autoclave Guide | Buy Denmed",
    meta_description: "Dental sterilization standards and Class B vacuum autoclave selection guide.",
  },
];

export function formatAdminBlogPost(p) {
  if (!p) return null;
  return {
    id: p.id.toString(),
    title: p.title,
    slug: p.slug,
    coverImageUrl: p.cover_image_url || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
    excerpt: p.excerpt || "",
    contentHtml: p.content || "",
    category: p.category || "General",
    tags: Array.isArray(p.tags) ? p.tags : [],
    status: p.status || "draft",
    publishDate: p.published_at
      ? p.published_at.toISOString().slice(0, 10)
      : p.created_at
      ? p.created_at.toISOString().slice(0, 10)
      : "2026-11-20",
    seoTitle: p.meta_title || p.title || "",
    seoDescription: p.meta_description || p.excerpt || "",
    author: p.author?.name || "Clinical Team",
    updatedAt: p.updated_at ? p.updated_at.toISOString() : null,
  };
}

export function formatStorefrontBlogPost(p) {
  if (!p) return null;
  const wordCount = (p.content || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const readTime = `${Math.max(2, Math.ceil(wordCount / 180))} min read`;
  const dateStr = p.published_at
    ? new Date(p.published_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "Nov 2026";

  return {
    id: p.id.toString(),
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || "",
    content: p.content || "",
    contentHtml: p.content || "",
    author: p.author?.name || "Dr. Rohan Verma",
    authorRole: "MDS Oral & Maxillofacial Surgery, Clinical Advisor",
    publishedAt: dateStr,
    readTime,
    category: p.category || "Clinical Guide",
    coverImage: p.cover_image_url || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
    coverImageUrl: p.cover_image_url || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
    tags: Array.isArray(p.tags) ? p.tags : [],
    seoTitle: p.meta_title || p.title,
    seoDescription: p.meta_description || p.excerpt,
  };
}

let blogsSeeded = false;

export async function ensureDefaultBlogs() {
  if (blogsSeeded) return;
  try {
    const count = await prisma.blogPost.count();
    if (count === 0) {
      for (const def of DEFAULT_BLOGS) {
        await prisma.blogPost.create({
          data: {
            slug: def.slug,
            title: def.title,
            cover_image_url: def.cover_image_url,
            excerpt: def.excerpt,
            content: def.content,
            category: def.category,
            tags: def.tags,
            status: def.status,
            published_at: def.published_at,
            meta_title: def.meta_title,
            meta_description: def.meta_description,
          },
        });
      }
    }
    blogsSeeded = true;
  } catch (err) {
    console.error("[blog] ensureDefaultBlogs error:", err.message);
  }
}

export async function listAdminBlogPosts() {
  await ensureDefaultBlogs();
  const rows = await prisma.blogPost.findMany({
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { created_at: "desc" },
  });
  return rows.map(formatAdminBlogPost);
}

export async function getAdminBlogPost(idOrSlug) {
  await ensureDefaultBlogs();
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
  let post = null;

  if (isNumeric) {
    post = await prisma.blogPost.findUnique({
      where: { id: BigInt(idOrSlug) },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  if (!post) {
    const slug = String(idOrSlug).trim().toLowerCase().replace(/^\/+/, "");
    post = await prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  return formatAdminBlogPost(post);
}

export async function createBlogPost(data, adminUser) {
  if (!data.title) {
    throw ApiError.badRequest("Title is required");
  }

  const rawSlug = data.slug ? slugify(data.slug) : slugify(data.title);
  let slug = rawSlug;
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    slug = `${rawSlug}-${Date.now().toString().slice(-4)}`;
  }

  const status = data.status || "draft";
  let publishedAt = null;
  if (status === "published") {
    publishedAt = data.publishDate ? new Date(data.publishDate) : new Date();
  }

  const created = await prisma.blogPost.create({
    data: {
      slug,
      title: String(data.title).trim(),
      cover_image_url: data.coverImageUrl || data.coverImage || null,
      excerpt: data.excerpt || null,
      content: data.contentHtml || data.content || null,
      category: data.category || "General",
      tags: Array.isArray(data.tags) ? data.tags : [],
      status,
      published_at: publishedAt,
      meta_title: data.seoTitle || data.meta_title || null,
      meta_description: data.seoDescription || data.meta_description || null,
      author_id: adminUser?.id ? BigInt(adminUser.id) : null,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return formatAdminBlogPost(created);
}

export async function updateBlogPost(idOrSlug, data, adminUser) {
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
  let target = null;

  if (isNumeric) {
    target = await prisma.blogPost.findUnique({ where: { id: BigInt(idOrSlug) } });
  }

  if (!target) {
    const slug = String(idOrSlug).trim().toLowerCase().replace(/^\/+/, "").replace(/^blog-/, "");
    target = await prisma.blogPost.findUnique({ where: { slug } });
  }

  if (!target && data.slug) {
    const dataSlug = slugify(data.slug);
    target = await prisma.blogPost.findUnique({ where: { slug: dataSlug } });
  }

  if (!target) {
    throw ApiError.notFound("Blog post not found");
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = String(data.title).trim();
  if (data.slug !== undefined && data.slug.trim()) updateData.slug = slugify(data.slug);
  if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl;
  if (data.coverImage !== undefined) updateData.cover_image_url = data.coverImage;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.contentHtml !== undefined) updateData.content = data.contentHtml;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : [];
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "published" && !target.published_at) {
      updateData.published_at = data.publishDate ? new Date(data.publishDate) : new Date();
    }
  }
  if (data.publishDate !== undefined && data.publishDate) {
    updateData.published_at = new Date(data.publishDate);
  }
  if (data.seoTitle !== undefined) updateData.meta_title = data.seoTitle;
  if (data.seoDescription !== undefined) updateData.meta_description = data.seoDescription;

  const updated = await prisma.blogPost.update({
    where: { id: target.id },
    data: updateData,
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return formatAdminBlogPost(updated);
}

export async function deleteBlogPost(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
  let target = null;

  if (isNumeric) {
    target = await prisma.blogPost.findUnique({ where: { id: BigInt(idOrSlug) } });
  }

  if (!target) {
    const slug = String(idOrSlug).trim().toLowerCase().replace(/^\/+/, "").replace(/^blog-/, "");
    target = await prisma.blogPost.findUnique({ where: { slug } });
  }

  if (!target) {
    throw ApiError.notFound("Blog post not found");
  }

  await prisma.blogPost.delete({ where: { id: target.id } });
  return { success: true, id: target.id.toString(), slug: target.slug };
}

export async function listPublicBlogPosts() {
  await ensureDefaultBlogs();
  const rows = await prisma.blogPost.findMany({
    where: { status: "published" },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { published_at: "desc" },
  });
  return rows.map(formatStorefrontBlogPost);
}

export async function getPublicBlogPost(slug) {
  await ensureDefaultBlogs();
  const cleanSlug = String(slug).trim().toLowerCase().replace(/^\/+/, "");
  const post = await prisma.blogPost.findFirst({
    where: {
      slug: cleanSlug,
      status: "published",
    },
    include: { author: { select: { id: true, name: true } } },
  });

  if (!post) {
    throw ApiError.notFound(`Blog post "${slug}" not found`);
  }

  return formatStorefrontBlogPost(post);
}

