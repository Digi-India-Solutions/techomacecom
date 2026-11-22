import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";
import { buildOrderBy, paginate, searchWhere } from "../../lib/list.js";
import { deleteImage, parseStoredPath, publicUrl } from "../../lib/storage.js";
import { MAX_REVIEW_IMAGES } from "./validator.js";

/**
 * Product reviews (document §11: reviews, review_images).
 *
 *   Customer (signed in) ──POST /reviews──▶ status "pending"   (one review per product; editing → pending again)
 *   Staff ──approve / reject (+reason) / edit text / reply / feature / verified / delete──▶
 *   Only "approved" reviews are public, and only they count in products.rating_avg / rating_count.
 */

export const REVIEW_IMAGE_FOLDER = "reviews";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const maskMobile = (m) => (m && m.length >= 4 ? `${"X".repeat(Math.max(0, m.length - 4))}${m.slice(-4)}` : "");

/** Accepts our own stored review-photo paths only (never arbitrary URLs). */
function cleanImagePaths(images = []) {
  const paths = [];
  for (const value of images) {
    const stored = parseStoredPath(value);
    if (!stored || stored.folder !== REVIEW_IMAGE_FOLDER) {
      throw ApiError.badRequest("One of the photos is invalid. Please upload it again.", "INVALID_REVIEW_IMAGE", {
        images: "Invalid photo",
      });
    }
    if (!paths.includes(stored.path)) paths.push(stored.path);
  }
  return paths.slice(0, MAX_REVIEW_IMAGES);
}

async function removeFiles(paths) {
  for (const p of paths) {
    const stored = parseStoredPath(p);
    if (stored) await deleteImage(stored).catch(() => 0);
  }
}

/**
 * Recomputes products.rating_avg / rating_count from approved reviews.
 * Called after every change that can move a review in or out of "approved".
 */
export async function recomputeProductRating(productIds, tx = prisma) {
  const ids = [...new Set([].concat(productIds).map(String))].map((v) => BigInt(v));
  for (const productId of ids) {
    const agg = await tx.review.aggregate({
      where: { product_id: productId, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avg = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;
    await tx.product.update({
      where: { id: productId },
      data: { rating_avg: avg, rating_count: agg._count._all },
    });
  }
}

/** True when the customer has a delivered order containing the product. */
export async function hasPurchased(customerId, productId) {
  if (!customerId) return false;
  const found = await prisma.orderItem.findFirst({
    where: { product_id: productId, order: { customer_id: customerId, status: "delivered" } },
    select: { id: true },
  });
  return Boolean(found);
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/** What the storefront sees — never the mobile, email or moderation details. */
export function toPublicDto(r) {
  return {
    id: String(r.id),
    productId: String(r.product_id),
    name: r.name,
    authorName: r.name,
    rating: r.rating,
    title: r.title || "",
    comment: r.comment,
    images: (r.images || []).map((i) => publicUrl(i.url)),
    isVerifiedBuyer: r.is_verified_buyer,
    verifiedBuyer: r.is_verified_buyer,
    status: r.status,
    adminReply: r.admin_reply || null,
    adminReplyAt: r.admin_reply_at || null,
    createdAt: r.created_at,
    date: r.created_at,
    ...(r.product
      ? {
          productName: r.product.name,
          productSlug: r.product.slug,
          productImage: publicUrl(r.product.images?.[0]?.url) || "",
        }
      : {}),
  };
}

/** The customer's own review (adds status + reject reason so they know what happened). */
export function toOwnDto(r) {
  return {
    ...toPublicDto(r),
    imagePaths: (r.images || []).map((i) => i.url),
    rejectionReason: r.status === "rejected" ? r.reject_reason || null : null,
    updatedAt: r.updated_at,
  };
}

export function toAdminDto(r) {
  return {
    id: String(r.id),
    productId: String(r.product_id),
    productName: r.product?.name || "",
    productSlug: r.product?.slug || "",
    productImage: publicUrl(r.product?.images?.[0]?.url) || "",
    customerId: r.customer_id ? String(r.customer_id) : null,
    reviewerName: r.name,
    reviewerEmail: r.customer?.email || "",
    reviewerMobileMasked: maskMobile(r.mobile || r.customer?.mobile),
    rating: r.rating,
    title: r.title || "",
    comment: r.comment,
    images: (r.images || []).map((i) => publicUrl(i.url)),
    verifiedBuyer: r.is_verified_buyer,
    featured: r.is_featured,
    status: r.status,
    rejectionReason: r.reject_reason || undefined,
    adminReply: r.admin_reply || "",
    adminReplyAt: r.admin_reply_at || null,
    moderatedBy: r.moderator?.name || null,
    moderatedAt: r.moderated_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const productSelect = {
  select: { id: true, name: true, slug: true, images: { orderBy: { sort_order: "asc" }, take: 1, select: { url: true } } },
};
const imagesInclude = { orderBy: { id: "asc" }, select: { id: true, url: true } };
const adminInclude = {
  product: productSelect,
  customer: { select: { email: true, mobile: true } },
  moderator: { select: { name: true } },
  images: imagesInclude,
};

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

async function findPublicProduct(productId) {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: "active", deleted_at: null },
    select: { id: true, name: true },
  });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

const PUBLIC_SORT = {
  newest: [{ created_at: "desc" }, { id: "desc" }],
  oldest: [{ created_at: "asc" }, { id: "asc" }],
  highest: [{ rating: "desc" }, { created_at: "desc" }, { id: "desc" }],
  lowest: [{ rating: "asc" }, { created_at: "desc" }, { id: "desc" }],
};

/** Approved reviews of a product + the star summary (average, count, 5→1 breakdown). */
export async function listForProduct(productId, { page, limit, sort, rating, withImages }) {
  await findPublicProduct(productId);
  const base = { product_id: productId, status: "approved" };
  const where = { ...base, ...(rating && { rating }), ...(withImages && { images: { some: {} } }) };

  const [{ rows, meta }, groups, withPhotos] = await Promise.all([
    paginate(prisma.review, { where, orderBy: PUBLIC_SORT[sort], include: { images: imagesInclude }, page, limit }),
    prisma.review.groupBy({ by: ["rating"], where: base, _count: { _all: true } }),
    prisma.review.count({ where: { ...base, images: { some: {} } } }),
  ]);

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const g of groups) breakdown[g.rating] = g._count._all;
  const count = Object.values(breakdown).reduce((s, n) => s + n, 0);
  const total = Object.entries(breakdown).reduce((s, [star, n]) => s + Number(star) * n, 0);
  const average = count ? Math.round((total / count) * 10) / 10 : 0;

  return {
    reviews: rows.map(toPublicDto),
    summary: { average, count, breakdown, withPhotos },
    meta,
  };
}

/** Home-page testimonials: approved reviews the staff marked as featured (newest first). */
export async function listFeatured(limit) {
  const rows = await prisma.review.findMany({
    where: { status: "approved", is_featured: true, product: { status: "active", deleted_at: null } },
    orderBy: [{ updated_at: "desc" }, { id: "desc" }],
    take: limit,
    include: { images: imagesInclude, product: productSelect },
  });
  return rows.map(toPublicDto);
}

/** The signed-in customer's review of a product (null when not written yet) + whether they bought it. */
export async function getMine(customerId, productId) {
  const [review, purchased] = await Promise.all([
    prisma.review.findUnique({
      where: { product_id_customer_id: { product_id: productId, customer_id: customerId } },
      include: { images: imagesInclude },
    }),
    hasPurchased(customerId, productId),
  ]);
  return { review: review ? toOwnDto(review) : null, verifiedBuyer: purchased };
}

/**
 * Create or edit the customer's review. Every submit goes (back) to "pending" and
 * leaves the public rating until a staff member approves it again.
 */
export async function submit(customer, data) {
  const productId = BigInt(data.productId);
  await findPublicProduct(productId);
  const images = cleanImagePaths(data.images);
  const verified = await hasPurchased(customer.id, productId);

  const existing = await prisma.review.findUnique({
    where: { product_id_customer_id: { product_id: productId, customer_id: customer.id } },
    include: { images: true },
  });

  const fields = {
    name: data.name,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    mobile: customer.mobile || null,
    status: "pending",
    reject_reason: null,
    is_featured: false,
    moderated_by: null,
    moderated_at: null,
  };

  let review;
  if (existing) {
    const oldPaths = existing.images.map((i) => i.url);
    review = await prisma.$transaction(async (tx) => {
      await tx.reviewImage.deleteMany({ where: { review_id: existing.id } });
      const updated = await tx.review.update({
        where: { id: existing.id },
        // a staff member may have marked the buyer as verified manually — keep that on edit
        data: {
          ...fields,
          is_verified_buyer: existing.is_verified_buyer || verified,
          images: { create: images.map((url) => ({ url })) },
        },
        include: { images: imagesInclude },
      });
      if (existing.status === "approved") await recomputeProductRating(productId, tx);
      return updated;
    });
    await removeFiles(oldPaths.filter((p) => !images.includes(p)));
  } else {
    try {
      review = await prisma.review.create({
        data: {
          ...fields,
          product_id: productId,
          customer_id: customer.id,
          is_verified_buyer: verified,
          images: { create: images.map((url) => ({ url })) },
        },
        include: { images: imagesInclude },
      });
    } catch (err) {
      // Two submits at the same moment: the unique (product, customer) index wins
      if (err?.code === "P2002") throw ApiError.conflict("You have already reviewed this product", "REVIEW_EXISTS");
      throw err;
    }
  }
  return { review: toOwnDto(review), updated: Boolean(existing) };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function adminList({ page, limit, sort, q, status, rating, productId, customerId, verified, featured, withImages, from, to }) {
  const created = {
    ...(from && { gte: new Date(`${from}T00:00:00.000+05:30`) }),
    ...(to && { lte: new Date(`${to}T23:59:59.999+05:30`) }),
  };
  const where = {
    ...(status && { status }),
    ...(rating && { rating }),
    ...(productId && { product_id: productId }),
    ...(customerId && { customer_id: customerId }),
    ...(verified !== undefined && { is_verified_buyer: verified }),
    ...(featured !== undefined && { is_featured: featured }),
    ...(withImages && { images: { some: {} } }),
    ...(Object.keys(created).length && { created_at: created }),
    ...searchWhere(q, ["name", "title", "comment", "product.name"]),
  };
  const { rows, meta } = await paginate(prisma.review, {
    where,
    include: adminInclude,
    orderBy: buildOrderBy(sort, { createdAt: "created_at", rating: "rating", status: "status", product: "product.name" }, "-createdAt"),
    page,
    limit,
  });
  return { rows: rows.map(toAdminDto), meta };
}

/** Tab counts + per-product rating table for the admin header cards. */
export async function adminSummary() {
  const [byStatus, byProduct, featured] = await Promise.all([
    prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.review.groupBy({
      by: ["product_id"],
      where: { status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
      orderBy: { _count: { product_id: "desc" } },
      take: 10,
    }),
    prisma.review.count({ where: { status: "approved", is_featured: true } }),
  ]);
  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const g of byStatus) counts[g.status] = g._count._all;

  const products = await prisma.product.findMany({
    where: { id: { in: byProduct.map((g) => g.product_id) } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(products.map((p) => [String(p.id), p.name]));
  return {
    counts: { ...counts, total: counts.pending + counts.approved + counts.rejected, featured },
    products: byProduct.map((g) => ({
      productId: String(g.product_id),
      productName: nameOf.get(String(g.product_id)) || "—",
      avgRating: Math.round((g._avg.rating || 0) * 10) / 10,
      count: g._count._all,
    })),
  };
}

async function findForAdmin(id) {
  const row = await prisma.review.findUnique({ where: { id }, include: adminInclude });
  if (!row) throw ApiError.notFound("Review not found");
  return row;
}

export async function adminGet(id) {
  return toAdminDto(await findForAdmin(id));
}

export async function setStatus(id, { status, reason }, actor) {
  const before = await findForAdmin(id);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id },
      data: {
        status,
        reject_reason: status === "rejected" ? reason : null,
        ...(status !== "approved" && { is_featured: false }), // only approved reviews can be featured
        moderated_by: actor?.id ?? null,
        moderated_at: new Date(),
      },
      include: adminInclude,
    });
    if ((before.status === "approved") !== (status === "approved")) await recomputeProductRating(before.product_id, tx);
    return updated;
  });
  return { before: toAdminDto(before), review: toAdminDto(row) };
}

export async function editText(id, { title, comment }, actor) {
  await findForAdmin(id);
  const row = await prisma.review.update({
    where: { id },
    data: { title, comment, moderated_by: actor?.id ?? null, moderated_at: new Date() },
    include: adminInclude,
  });
  return toAdminDto(row);
}

export async function setReply(id, reply) {
  await findForAdmin(id);
  const row = await prisma.review.update({
    where: { id },
    data: { admin_reply: reply || null, admin_reply_at: reply ? new Date() : null },
    include: adminInclude,
  });
  return toAdminDto(row);
}

export async function setFeatured(id, featured) {
  const before = await findForAdmin(id);
  if (featured && before.status !== "approved") {
    throw ApiError.badRequest("Approve the review before featuring it on the home page", "REVIEW_NOT_APPROVED");
  }
  const row = await prisma.review.update({ where: { id }, data: { is_featured: featured }, include: adminInclude });
  return toAdminDto(row);
}

export async function setVerified(id, verified) {
  await findForAdmin(id);
  const row = await prisma.review.update({ where: { id }, data: { is_verified_buyer: verified }, include: adminInclude });
  return toAdminDto(row);
}

/** Deletes reviews + their photo files and refreshes the affected products' ratings. */
export async function removeMany(ids) {
  const rows = await prisma.review.findMany({
    where: { id: { in: ids } },
    include: { images: true, product: { select: { name: true } } },
  });
  if (!rows.length) throw ApiError.notFound("Review not found");
  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } }); // review_images cascade
    const approvedProducts = rows.filter((r) => r.status === "approved").map((r) => r.product_id);
    if (approvedProducts.length) await recomputeProductRating(approvedProducts, tx);
  });
  await removeFiles(rows.flatMap((r) => r.images.map((i) => i.url)));
  return rows;
}

/** Approve / reject many at once (one transaction; ratings refreshed once per product). */
export async function bulkStatus(ids, status, reason, actor) {
  const rows = await prisma.review.findMany({
    where: { id: { in: ids } },
    select: { id: true, product_id: true, status: true },
  });
  if (!rows.length) throw ApiError.notFound("Review not found");
  await prisma.$transaction(async (tx) => {
    await tx.review.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: {
        status,
        reject_reason: status === "rejected" ? reason : null,
        ...(status !== "approved" && { is_featured: false }),
        moderated_by: actor?.id ?? null,
        moderated_at: new Date(),
      },
    });
    const touched = rows.filter((r) => (r.status === "approved") !== (status === "approved")).map((r) => r.product_id);
    if (touched.length) await recomputeProductRating(touched, tx);
  });
  return rows.length;
}
