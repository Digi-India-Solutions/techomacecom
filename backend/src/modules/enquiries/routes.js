import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.js";
import { optionalCustomer, requirePermission } from "../../middlewares/auth.js";
import { enquiryLimiter } from "../../middlewares/rate-limit.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

/**
 * Enquiries
 *   publicEnquiryRoutes  → /api/v1/enquiries          (no login; linked to the customer when signed in)
 *     POST /              sleep-test callback form (+ optional STOP-BANG quiz answers)
 *   adminEnquiryRoutes   → /api/v1/admin/enquiries     (staff, enquiries.view)
 *     GET  /              ?type=&status=&risk=&q=&page=&limit=&sort=
 *     GET  /:id
 */
export const publicEnquiryRoutes = Router();
publicEnquiryRoutes.post("/", enquiryLimiter, optionalCustomer, validate({ body: v.sleepTestEnquirySchema }), c.createSleepTest);
publicEnquiryRoutes.post("/seller", enquiryLimiter, optionalCustomer, validate({ body: v.sellerRegistrationSchema }), c.createSeller);

export const adminEnquiryRoutes = Router();
const byId = validate({ params: z.object({ id: z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id") }) });
adminEnquiryRoutes.get("/", requirePermission("enquiries.view"), validate({ query: v.adminListQuery }), c.list);
adminEnquiryRoutes.get("/:id", requirePermission("enquiries.view"), byId, c.getOne);
