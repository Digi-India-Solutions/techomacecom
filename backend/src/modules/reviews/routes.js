import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requireCustomer, requirePermission, requireAnyPermission } from "../../middlewares/auth.js";
import { reviewLimiter } from "../../middlewares/rate-limit.js";
import { imageUpload } from "../../middlewares/upload.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Reviews
 *   publicReviewRoutes → /api/v1/reviews
 *     GET  /product/:productId   approved reviews + summary   ?page=&limit=&sort=newest|oldest|highest|lowest&rating=&withImages=
 *     GET  /featured             home-page testimonials       ?limit=
 *     GET  /mine?productId=      own review (signed in)
 *     POST /                     create / edit own review → pending (signed in)
 *     POST /images               upload one review photo (signed in, field "file")
 *
 *   adminReviewRoutes → /api/v1/admin/reviews
 *     GET    /                   ?status=&rating=&productId=&verified=&featured=&withImages=&from=&to=&q=&page=&limit=&sort=
 *     GET    /summary            tab counts + per-product ratings
 *     GET    /:id
 *     PATCH  /:id/status         approve / reject (+reason) / back to pending   (reviews.edit)
 *     PUT    /:id                edit title / comment                          (reviews.edit)
 *     PATCH  /:id/reply          store reply (empty = remove)                  (reviews.edit)
 *     PATCH  /:id/feature        home-page testimonial on/off                  (reviews.edit)
 *     PATCH  /:id/verified       verified-buyer badge on/off                   (reviews.edit)
 *     DELETE /:id                                                             (reviews.delete)
 *     POST   /bulk               approve / reject / delete many                (reviews.edit; delete also reviews.delete)
 */
export const publicReviewRoutes = Router();
publicReviewRoutes.get(
  "/product/:productId",
  validate({ params: v.productParams, query: v.productReviewsQuery }),
  c.listForProduct
);
publicReviewRoutes.get("/featured", validate({ query: v.featuredQuery }), c.featured);
publicReviewRoutes.get("/mine", requireCustomer, validate({ query: v.mineQuery }), c.mine);
publicReviewRoutes.post("/", reviewLimiter, requireCustomer, validate({ body: v.submitReviewSchema }), c.submit);
publicReviewRoutes.post("/images", reviewLimiter, requireCustomer, imageUpload({ single: true }), c.uploadImage);

export const adminReviewRoutes = Router();
const byId = validate({ params: v.idParams });
const canView = requireAnyPermission("reviews.view", "reviews.edit");
const canEdit = requirePermission("reviews.edit");

adminReviewRoutes.get("/", canView, validate({ query: v.adminListQuery }), c.adminList);
adminReviewRoutes.get("/summary", canView, c.adminSummary);
adminReviewRoutes.post("/bulk", canEdit, validate({ body: v.bulkSchema }), c.bulk);
adminReviewRoutes.get("/:id", canView, byId, c.adminGet);
adminReviewRoutes.patch("/:id/status", canEdit, byId, validate({ body: v.statusSchema }), c.setStatus);
adminReviewRoutes.put("/:id", canEdit, byId, validate({ body: v.editSchema }), c.editText);
adminReviewRoutes.patch("/:id/reply", canEdit, byId, validate({ body: v.replySchema }), c.setReply);
adminReviewRoutes.patch("/:id/feature", canEdit, byId, validate({ body: v.featureSchema }), c.setFeatured);
adminReviewRoutes.patch("/:id/verified", canEdit, byId, validate({ body: v.verifiedSchema }), c.setVerified);
adminReviewRoutes.delete("/:id", requirePermission("reviews.delete"), byId, c.remove);
