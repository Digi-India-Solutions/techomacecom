import { z } from "zod";
import { mobileField } from "../../lib/mobile.js";
import { listQuery } from "../../lib/list.js";

/** Test types offered on the sleep-test page (stored in details.testType). */
export const TEST_TYPES = ["Not sure", "Level 2", "Level 3"];
export const ENQUIRY_STATUSES = ["new", "contacted", "follow_up", "converted", "closed"]; // enquiries_status_chk

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .default("")
    .transform((v) => v || null);

/** The 7 yes/no STOP-BANG answers + height / weight (BMI is computed on the server). */
const quizSchema = z.object({
  answers: z.object({
    snoring: z.boolean(),
    tired: z.boolean(),
    observed: z.boolean(),
    pressure: z.boolean(),
    age: z.boolean(),
    neck: z.boolean(),
    male: z.boolean(),
  }),
  heightCm: z.number().min(90, "Height looks too low").max(250, "Height looks too high"),
  weightKg: z.number().min(20, "Weight looks too low").max(350, "Weight looks too high"),
  unit: z.enum(["imperial", "metric"]).optional().default("metric"),
});

/** POST /enquiries — sleep-test callback form (header form or quiz result). */
export const sleepTestEnquirySchema = z.object({
  type: z.literal("sleep_test").optional().default("sleep_test"),
  name: z.string({ error: "Full name is required" }).trim().min(2, "Full name is required").max(120),
  mobile: mobileField(),
  email: z
    .union([z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email address")), z.literal("")])
    .optional()
    .transform((v) => v || null),
  city: z.string({ error: "City is required" }).trim().min(2, "City / Town is required").max(80),
  preferredDate: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date")
    .transform((v) => v || null),
  testType: z.enum(TEST_TYPES).optional().default("Not sure"),
  message: optionalText(1000),
  consent: z.literal(true, { error: "Please authorise us to contact you" }),
  // Spam trap: real users never see this field
  honeypot: z.string().max(200).optional().default(""),
  sourcePage: optionalText(200),
  quiz: quizSchema.optional(),
});

/** POST /enquiries/seller — vendor onboarding registration. */
export const sellerRegistrationSchema = z.object({
  type: z.literal("seller").optional().default("seller"),
  companyName: z.string({ error: "Company name is required" }).trim().min(2, "Company name is required").max(150),
  registeredAs: z.string({ error: "Company registration type is required" }).trim().min(2).max(80),
  email: z.string({ error: "Company email is required" }).trim().toLowerCase().max(200).pipe(z.email("Enter a valid company email address")),
  mobile: mobileField(),
  originCountry: z.string().trim().min(2).max(80).optional().default("India"),
  vendorType: z.string({ error: "Vendor type is required" }).trim().min(2).max(80),
  gstNumber: z.string({ error: "GST Number is required" }).trim().max(30).optional().default(""),
  brands: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Brand name is required"),
        country: z.string().trim().optional().default("India"),
      })
    )
    .optional()
    .default([]),
  contactPerson: optionalText(100),
  city: optionalText(80),
  categories: z.array(z.string()).optional().default([]),
  message: optionalText(1000),
  consent: z.literal(true, { error: "Please accept the vendor declaration to proceed" }),
  honeypot: z.string().max(200).optional().default(""),
  sourcePage: optionalText(200),
});

/** GET /admin/enquiries */
export const adminListQuery = listQuery({
  type: z.enum(["sleep_test", "bulk", "contact"]).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  risk: z.enum(["low", "moderate", "high"]).optional(),
});
