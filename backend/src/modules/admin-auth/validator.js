import { z } from "zod";
import { PASSWORD_RULE } from "../../lib/password.js";

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

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  mobile: z.string().trim().max(15).optional(),
  department: z.string().trim().max(80).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword,
});
