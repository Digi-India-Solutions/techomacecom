import prisma from "../../../../db/db.js";
import { ApiError } from "../../../lib/http.js";
import { imageOut, slugify, tombstone, uniqueSlug } from "../shared.js";

/**
 * Brands (document §11.3). Every product belongs to exactly one brand.
 * Deleting is soft and blocked while products are linked to the brand.
 */

const SLUG_MAX = 140;
const NAME_MAX = 120;

/** Matches admin/types Brand. */
export function toDto(row, productCount = 0) {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    logoUrl: imageOut(row.logo_url),
    desktopBannerUrl: imageOut(row.banner_desktop_url),
    mobileBannerUrl: imageOut(row.banner_mobile_url),
    description: row.description || "",
    originCountry: row.origin_country || "",
    authorizedDistributor: row.authorized_distributor,
    featuredOnHomepage: row.is_featured,
    status: row.status,
    seoTitle: row.meta_title || "",
    seoDescription: row.meta_description || "",
    productCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function productCounts(brandIds) {
  if (!brandIds.length) return new Map();
  const groups = await prisma.product.groupBy({
    by: ["brand_id"],
    where: { brand_id: { in: brandIds }, deleted_at: null },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [String(g.brand_id), g._count._all]));
}

/**
 * All brands (the list is bounded — a few hundred at most — and both the Brands
 * page and the product editor's brand picker need the full list).
 */
export async function list({ q, status } = {}) {
  const rows = await prisma.brand.findMany({
    where: {
      deleted_at: null,
      ...(status && { status }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ name: "asc" }],
  });
  const counts = await productCounts(rows.map((r) => r.id));
  return rows.map((r) => toDto(r, counts.get(String(r.id)) || 0));
}

async function findActive(id) {
  const row = await prisma.brand.findFirst({ where: { id, deleted_at: null } });
  if (!row) throw ApiError.notFound("Brand not found");
  return row;
}

export async function getById(id) {
  const row = await findActive(id);
  const counts = await productCounts([row.id]);
  return toDto(row, counts.get(String(row.id)) || 0);
}

/** Brand names are unique ignoring case ("Omron" and "OMRON" are the same brand). */
async function assertNameFree(name, exceptId) {
  const clash = await prisma.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, deleted_at: null, ...(exceptId && { NOT: { id: exceptId } }) },
    select: { id: true },
  });
  if (clash) throw ApiError.conflict(`A brand named "${name}" already exists`, "NAME_TAKEN", { name: "Already exists" });
}

async function slugTaken(slug, exceptId) {
  const row = await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(row && row.id !== exceptId);
}

async function resolveSlug(data, exceptId) {
  if (data.slug) {
    if (await slugTaken(data.slug, exceptId)) {
      throw ApiError.conflict(`The URL slug "${data.slug}" is already used by another brand`, "SLUG_TAKEN", {
        slug: "Already in use",
      });
    }
    return data.slug;
  }
  return uniqueSlug(slugify(data.name), (s) => slugTaken(s, exceptId), SLUG_MAX);
}

function columns(data) {
  return {
    name: data.name,
    logo_url: data.logoUrl,
    banner_desktop_url: data.desktopBannerUrl,
    banner_mobile_url: data.mobileBannerUrl,
    description: data.description,
    origin_country: data.originCountry,
    authorized_distributor: data.authorizedDistributor,
    is_featured: data.featuredOnHomepage,
    status: data.status,
    meta_title: data.seoTitle,
    meta_description: data.seoDescription,
  };
}

export async function create(data) {
  await assertNameFree(data.name);
  const slug = await resolveSlug(data);
  const row = await prisma.brand.create({ data: { ...columns(data), slug } });
  return toDto(row, 0);
}

export async function update(id, data) {
  const current = await findActive(id);
  await assertNameFree(data.name, current.id);
  const slug = await resolveSlug(data, current.id);
  const row = await prisma.brand.update({ where: { id: current.id }, data: { ...columns(data), slug } });
  const counts = await productCounts([row.id]);
  return { before: current, brand: toDto(row, counts.get(String(row.id)) || 0) };
}

export async function remove(id) {
  const row = await findActive(id);
  const linked = await prisma.product.count({ where: { brand_id: row.id, deleted_at: null } });
  if (linked > 0) {
    throw ApiError.conflict(
      `Cannot delete "${row.name}" while ${linked} product${linked === 1 ? " is" : "s are"} linked to it. Reassign those products first.`,
      "BRAND_IN_USE"
    );
  }
  await prisma.brand.update({
    where: { id: row.id },
    data: {
      deleted_at: new Date(),
      status: "inactive",
      // free the unique name + slug so they can be reused
      name: tombstone(row.name, row.id, NAME_MAX),
      slug: tombstone(row.slug, row.id, SLUG_MAX),
    },
  });
  return row;
}
