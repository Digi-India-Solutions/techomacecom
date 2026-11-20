import { z } from "zod";
import { mobileField } from "../../lib/mobile.js";
import { queryId } from "../../lib/list.js";
import { PASSWORD_RULE } from "../../lib/password.js";

const mobile = mobileField();

const otp = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP");

export const CUSTOMER_TYPES = ["doctor", "clinic_admin", "procurement", "individual"];

export const sendOtpSchema = z.object({ mobile });

export const verifyOtpSchema = z.object({
  mobile,
  otp,
  // Used only when this OTP creates a new account (sign-up)
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  name: z.string().trim().min(2).max(120).optional(),
});

export const googleSchema = z.object({
  credential: z.string().min(20, "Missing Google credential"),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
});

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)); // "" clears

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name is too long").optional(),
    email: z.union([z.email("Enter a valid email address").trim().toLowerCase().max(200), z.literal("")]).optional(),
    customerType: z.enum(CUSTOMER_TYPES, { error: "Choose who you are buying for" }).optional(),
    qualification: optionalText(120, "Qualification"),
    registrationNumber: z
      .string()
      .trim()
      .toUpperCase()
      .max(40, "Registration number must be at most 40 characters")
      .regex(/^$|^[A-Z0-9][A-Z0-9/.\- ]{1,39}$/, "Use letters, numbers, / . or - only")
      .optional()
      .transform((v) => (v === undefined ? undefined : v || null)),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to update" });

export const sessionIdParams = z.object({ id: queryId });

export const addMobileSchema = z.object({ mobile });
export const verifyMobileSchema = z.object({ mobile, otp });

// ---------------------------------------------------------------------------
// Email + password sign-up / sign-in
// ---------------------------------------------------------------------------

// Trim + lowercase first, then check the format (so " Ankit@Mail.com " is accepted and stored once)
const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(200, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const emailOtpSendSchema = z.object({ email });

export const emailOtpVerifySchema = z.object({ email, otp });

export const signupSchema = z
  .object({
    name: z.string({ error: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(120),
    email,
    // Returned by POST /auth/signup/email/verify-otp — proves the email was verified
    emailVerificationToken: z
      .string({ error: "Please verify your email first" })
      .min(20, "Please verify your email first")
      .max(200),
    mobile,
    password: z
      .string({ error: "Password is required" })
      .regex(PASSWORD_RULE.regex, PASSWORD_RULE.message),
    confirmPassword: z.string({ error: "Please confirm your password" }),
    customerType: z.enum(CUSTOMER_TYPES).optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email,
  // No strength rule here: just check it against the stored hash
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(128),
});

// ---------------------------------------------------------------------------
// Forgot / reset password (emailed link)
// ---------------------------------------------------------------------------

// randomToken(32) → 64 hex characters; anything outside this shape cannot be one of ours
const resetToken = z
  .string({ error: "Reset link is missing its token" })
  .trim()
  .regex(/^[A-Za-z0-9_-]{32,128}$/, "This reset link is not valid");

export const forgotPasswordSchema = z.object({ email });

export const resetTokenQuerySchema = z.object({ token: resetToken });

export const resetPasswordSchema = z
  .object({
    token: resetToken,
    password: z
      .string({ error: "Password is required" })
      .regex(PASSWORD_RULE.regex, PASSWORD_RULE.message),
    confirmPassword: z.string({ error: "Please confirm your password" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
