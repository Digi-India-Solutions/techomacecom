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
  // seller registrations are stored as type "contact"; this narrows the contact tab
  kind: z.enum(["contact_us", "seller_registration"]).optional(),
  // a customer's enquiries: linked account, or the same mobile / email
  customerId: z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id").optional(),
});

// ---------------------------------------------------------------------------
// Contact Us + Bulk / institutional enquiry (public forms)
// ---------------------------------------------------------------------------

const requiredEmail = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(200)
  .pipe(z.email("Enter a valid email address"));

/** POST /enquiries/contact — Contact Us page. Sending the form is the request to be contacted. */
export const contactEnquirySchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2, "Name is required").max(120),
  mobile: mobileField(),
  email: requiredEmail,
  subject: z.string({ error: "Subject is required" }).trim().min(2, "Subject is required").max(150),
  message: z.string({ error: "Message is required" }).trim().min(5, "Please write a short message").max(2000),
  honeypot: z.string().max(200).optional().default(""),
  sourcePage: optionalText(200),
});

/** POST /enquiries/bulk — hospital / clinic bulk-order enquiry. */
export const bulkEnquirySchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2, "Name is required").max(120),
  organizationName: z.string({ error: "Organisation is required" }).trim().min(2, "Organisation is required").max(200),
  email: requiredEmail,
  mobile: mobileField(),
  city: z.string({ error: "City is required" }).trim().min(2, "City is required").max(80),
  state: optionalText(80),
  pincode: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || /^[1-9][0-9]{5}$/.test(v), "Enter a valid 6-digit PIN code")
    .transform((v) => v || null),
  equipmentRequired: z.array(z.string().trim().min(1).max(120)).max(30).optional().default([]),
  estimatedBudget: optionalText(80),
  timeline: optionalText(80),
  message: optionalText(2000),
  honeypot: z.string().max(200).optional().default(""),
  sourcePage: optionalText(200),
});

// ---------------------------------------------------------------------------
// Admin follow-up
// ---------------------------------------------------------------------------

const idString = z.string().regex(/^[1-9][0-9]{0,18}$/, "Invalid id");

/** PATCH /admin/enquiries/:id — any subset of status / assigned staff / next follow-up date. */
export const adminUpdateSchema = z
  .object({
    status: z.enum(ENQUIRY_STATUSES).optional(),
    assignedTo: z.union([idString, z.null()]).optional(), // null = unassign
    nextFollowUpDate: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"), z.literal(""), z.null()])
      .optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to update" });

/** POST /admin/enquiries/:id/notes */
export const adminNoteSchema = z.object({
  note: z.string({ error: "Write a note" }).trim().min(1, "Write a note").max(2000),
});
