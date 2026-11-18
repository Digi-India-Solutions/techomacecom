import { z } from "zod";
import { ACTIONS, MODULES } from "../../rbac/catalog.js";

const idParam = z.object({ id: z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id") });
export const idParamSchema = idParam;

// { products: { view: true, … }, … } — unknown modules / actions are rejected
const actionShape = Object.fromEntries(ACTIONS.map((a) => [a, z.boolean().optional()]));
const matrixShape = Object.fromEntries(MODULES.map((m) => [m.key, z.object(actionShape).strict().optional()]));
const matrix = z.object(matrixShape).strict();

export const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters").max(60),
  description: z.string().trim().max(300).optional().default(""),
  matrix,
});

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.email("Enter a valid work email").trim().toLowerCase().max(200),
  mobile: z.string().trim().max(15).optional().default(""),
  roleId: z.string().regex(/^[1-9][0-9]{0,18}$/, "Choose a role"),
  department: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const activityQuerySchema = z.object({
  staffId: z.string().optional(),
  module: z.string().max(40).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
