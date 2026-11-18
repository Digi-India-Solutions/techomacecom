import { z } from "zod";
import { PASSWORD_RULE } from "../../lib/password.js";
import { mobileField } from "../../lib/mobile.js";
import { listQuery, queryId } from "../../lib/list.js";

const email = z.email("Enter a valid email address").trim().toLowerCase().max(200);
export const newPassword = z.string().regex(PASSWORD_RULE.regex, PASSWORD_RULE.message);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "This link is invalid. Request a new one."),
  password: newPassword,
});

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name is too long").optional(),
    mobile: mobileField({ allowEmpty: true }).optional(), // "" clears it
    department: z.string().trim().max(80, "Department is too long").optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to update" });

export const sessionIdParams = z.object({ id: queryId });

export const myActivityQuery = listQuery({});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword,
});
