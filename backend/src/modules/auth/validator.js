import { z } from "zod";
import { normalizeMobile } from "../../lib/mobile.js";

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
