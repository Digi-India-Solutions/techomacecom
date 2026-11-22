import { ok, ApiError } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import { saveImage } from "../uploads/service.js";
import * as service from "./service.js";

const id = (req) => BigInt(req.validatedParams.id);
const label = (r) => `${r.productName} · ${r.reviewerName} (${r.rating}★)`;

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

/** GET /reviews/product/:productId — approved reviews + star summary. */
export async function listForProduct(req, res) {
  const { reviews, summary, meta } = await service.listForProduct(BigInt(req.validatedParams.productId), req.validatedQuery);
  return ok(res, { reviews, summary }, { meta });
}

/** GET /reviews/featured — home-page testimonials. */
export async function featured(req, res) {
  return ok(res, await service.listFeatured(req.validatedQuery.limit));
}

/** GET /reviews/mine?productId= — the signed-in customer's own review (to prefill the form). */
export async function mine(req, res) {
  return ok(res, await service.getMine(req.customer.id, req.validatedQuery.productId));
}

/** POST /reviews — create or edit; always goes to moderation. */
export async function submit(req, res) {
  const { review, updated } = await service.submit(req.customer, req.body);
  return ok(
    res,
    {
      review,
      message: updated
        ? "Your review was updated and will be visible again after moderation."
        : "Thank you! Your review will be visible after moderation (usually within 24 hours).",
    },
    { status: updated ? 200 : 201 }
  );
}

/** POST /reviews/images — one photo (field "file"), stored as WebP under /uploads/reviews. */
export async function uploadImage(req, res) {
  if (!req.file) throw ApiError.badRequest('Attach a photo in the "file" field', "NO_FILE");
  const image = await saveImage(req.file, service.REVIEW_IMAGE_FOLDER, { maxDimension: 1600 });
  return ok(res, { path: image.path, url: image.url, width: image.width, height: image.height }, { status: 201 });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function adminList(req, res) {
  const { rows, meta } = await service.adminList(req.validatedQuery);
  return ok(res, rows, { meta });
}

export async function adminSummary(req, res) {
  return ok(res, await service.adminSummary());
}

export async function adminGet(req, res) {
  return ok(res, await service.adminGet(id(req)));
}

export async function setStatus(req, res) {
  const { before, review } = await service.setStatus(id(req), req.body, req.admin);
  const action = { approved: "approve", rejected: "reject", pending: "update" }[review.status];
  await logActivity(req, {
    module: "reviews",
    action,
    entityType: "review",
    entityId: BigInt(review.id),
    entityLabel: label(review),
    summary:
      `Status: ${before.status} → ${review.status}` + (review.status === "rejected" ? ` · Reason: ${req.body.reason}` : ""),
  });
  return ok(res, review);
}

export async function editText(req, res) {
  const review = await service.editText(id(req), req.body, req.admin);
  await logActivity(req, {
    module: "reviews",
    action: "update",
    entityType: "review",
    entityId: BigInt(review.id),
    entityLabel: label(review),
    summary: "Edited review text",
  });
  return ok(res, review);
}

export async function setReply(req, res) {
  const review = await service.setReply(id(req), req.body.reply);
  await logActivity(req, {
    module: "reviews",
    action: "update",
    entityType: "review",
    entityId: BigInt(review.id),
    entityLabel: label(review),
    summary: req.body.reply ? "Replied to review" : "Removed reply",
  });
  return ok(res, review);
}

export async function setFeatured(req, res) {
  const review = await service.setFeatured(id(req), req.body.featured);
  await logActivity(req, {
    module: "reviews",
    action: "update",
    entityType: "review",
    entityId: BigInt(review.id),
    entityLabel: label(review),
    summary: review.featured ? "Featured on home page" : "Removed from home page",
  });
  return ok(res, review);
}

export async function setVerified(req, res) {
  const review = await service.setVerified(id(req), req.body.verified);
  await logActivity(req, {
    module: "reviews",
    action: "update",
    entityType: "review",
    entityId: BigInt(review.id),
    entityLabel: label(review),
    summary: review.verifiedBuyer ? "Marked as verified buyer" : "Removed verified buyer badge",
  });
  return ok(res, review);
}

export async function remove(req, res) {
  const [row] = await service.removeMany([id(req)]);
  await logActivity(req, {
    module: "reviews",
    action: "delete",
    entityType: "review",
    entityId: row.id,
    entityLabel: `${row.product?.name} · ${row.name} (${row.rating}★)`,
    summary: "Deleted review",
  });
  return ok(res, { message: "Review deleted" });
}

/** POST /admin/reviews/bulk { ids, action: approve | reject | delete, reason } */
export async function bulk(req, res) {
  const { action, reason } = req.body;
  const ids = req.body.ids.map((v) => BigInt(v));
  if (action === "delete" && !req.permissions.has("reviews.delete")) {
    throw ApiError.forbidden("Your role is missing the reviews.delete permission", "PERMISSION_DENIED");
  }
  let count;
  if (action === "delete") count = (await service.removeMany(ids)).length;
  else count = await service.bulkStatus(ids, action === "approve" ? "approved" : "rejected", reason, req.admin);

  await logActivity(req, {
    module: "reviews",
    action: action === "delete" ? "delete" : action,
    entityType: "review",
    entityLabel: `${count} review${count === 1 ? "" : "s"}`,
    summary: `Bulk ${action}: ${count} review${count === 1 ? "" : "s"}` + (action === "reject" ? ` · Reason: ${reason}` : ""),
  });
  return ok(res, { count, message: `${count} review${count === 1 ? "" : "s"} ${action === "delete" ? "deleted" : action + "d"}` });
}
