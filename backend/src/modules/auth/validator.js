import { z } from "zod";
import { mobileField } from "../../lib/mobile.js";
import { queryId } from "../../lib/list.js";

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
