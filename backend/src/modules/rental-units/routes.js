import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requirePermission } from "../../middlewares/auth.js";
import * as c from "./controller.js";
import * as v from "./validator.js";

const router = Router();

router.get(
  "/",
  requirePermission("rental_units.view"),
  validate({ query: v.rentalUnitQuerySchema }),
  c.listRentalUnits
);

router.get("/:id", requirePermission("rental_units.view"), c.getRentalUnit);

router.post(
  "/",
  requirePermission("rental_units.create"),
  validate({ body: v.createRentalUnitSchema }),
  c.createRentalUnit
);

router.post(
  "/bulk",
  requirePermission("rental_units.create"),
  validate({ body: v.bulkCreateRentalUnitsSchema }),
  c.bulkCreateRentalUnits
);

router.patch(
  "/:id",
  requirePermission("rental_units.edit"),
  validate({ body: v.updateRentalUnitSchema }),
  c.updateRentalUnit
);

router.post(
  "/:id/service-logs",
  requirePermission("rental_units.edit"),
  validate({ body: v.createServiceLogSchema }),
  c.addServiceLog
);

router.post(
  "/:id/sanitisation-logs",
  requirePermission("rental_units.edit"),
  validate({ body: v.createSanitisationLogSchema }),
  c.addSanitisationLog
);

export default router;

