import { z } from "zod";
import { normalizeMobile } from "../../lib/mobile.js";
import { PASSWORD_RULE } from "../../lib/password.js";

const mobile = z
  .string({ error: "Mobile number is required" })
  .transform((v, ctx) => {
    const m = normalizeMobile(v);
    if (!m) {
      ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit Indian mobile number" });
      return z.NEVER;
    }
    return m;
  });

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

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
    email: z.union([z.email("Enter a valid email address").max(200), z.literal("")]).optional(),
    customerType: z.enum(CUSTOMER_TYPES).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

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
