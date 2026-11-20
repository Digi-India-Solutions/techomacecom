import { z } from "zod";

export const rentalUnitQuerySchema = z.object({
  search: z.string().optional(),
  productId: z.string().optional(),
  status: z.string().optional(),
  condition: z.string().optional(),
  serviceDueOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true"),
});

export const createRentalUnitSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  serialNumber: z.string().min(1, "Serial number is required").max(80),
  purchaseDate: z.string().optional(),
  condition: z
    .enum(["new", "good", "needs_service", "damaged", "retired"])
    .optional()
    .default("new"),
  notes: z.string().max(500).optional().default(""),
});

export const bulkCreateRentalUnitsSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  serialNumbers: z.array(z.string()).min(1, "At least one serial number is required"),
  purchaseDate: z.string().optional(),
  condition: z
    .enum(["new", "good", "needs_service", "damaged", "retired"])
    .optional()
    .default("new"),
});

export const updateRentalUnitSchema = z.object({
  condition: z.enum(["new", "good", "needs_service", "damaged", "retired"]).optional(),
  status: z
    .enum([
      "available",
      "reserved",
      "with_customer",
      "in_transit",
      "under_service",
      "retired",
    ])
    .optional(),
  notes: z.string().max(500).optional(),
  nextServiceDue: z.string().optional(),
});

export const createServiceLogSchema = z.object({
  date: z.string().optional(),
  issue: z.string().min(1, "Issue or maintenance reason is required"),
  actionTaken: z.string().min(1, "Action taken is required"),
  technician: z.string().optional().default("Staff Technician"),
  cost: z.number().min(0).optional().default(0),
  nextDueDate: z.string().optional(),
});

export const createSanitisationLogSchema = z.object({
  date: z.string().optional(),
  method: z.string().min(1, "Sanitisation method is required"),
  chemicalUsed: z.string().min(1, "Chemical used is required"),
  verifiedBy: z.string().optional().default("Staff Inspector"),
  passed: z.boolean().optional().default(true),
});

