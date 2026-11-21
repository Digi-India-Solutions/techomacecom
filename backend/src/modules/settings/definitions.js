import { z } from "zod";
import { checkGstin } from "../../lib/gstin.js";
import { GST_STATE_CODES, stateCode } from "../../lib/money.js";

/**
 * Settings → one row per (group_key, key) in the `settings` table, value as JSON.
 * Anything not saved yet falls back to DEFAULTS, which match what the storefront
 * showed before settings were configurable — so nothing changes until an admin edits it.
 *
 * Money is stored in paise (document §3) and exposed in rupees to the admin form and storefront.
 */

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULTS = {
  store: {
    storeName: "Buy Denmed Healthcare Pvt. Ltd.", // legal name — invoices, footer ©
    brandName: "Buy Denmed", // short name — page titles, WhatsApp greetings
    tagline: "Medical & Dental Direct",
    logoPath: "", // "" → storefront's bundled logo
    footerLogoPath: "", // "" → same as logo
    faviconPath: "",
    supportPhone: "+91 98112 34567",
    salesPhone: "+91 11 4982 7000",
    tollFreePhone: "1800-212-3366",
    supportEmail: "support@buydenmed.com",
    salesEmail: "orders@buydenmed.com",
    whatsappNumber: "9811234567",
    address: "Okhla Industrial Area Phase-III, New Delhi - 110020",
    mapUrl: "",
    gstin: "",
    supportOpenTime: "09:00",
    supportCloseTime: "19:30",
    openOnSunday: false,
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
  },
  shipping: {
    flatShippingChargePaise: 14_900, // ₹149
    freeShippingAbovePaise: 1_99_900, // ₹1,999
    codEnabled: true,
    codMaxOrderValuePaise: 50_000_00, // ₹50,000
    codChargePaise: 0,
    defaultDeliveryDays: "3-7",
    dispatchCutoffTime: "14:00", // orders before this ship the same day
  },
  tax: {
    gstEnabled: true,
    pricesIncludeGst: true, // product prices are GST-inclusive (MRP style)
    defaultGstRate: 18, // used only when a product has no rate
    dispatchStateCode: "07", // place of business → CGST+SGST vs IGST
    invoicePrefix: "BDM/26-27/",
    nextInvoiceNumber: 1,
    invoiceNumberDigits: 5, // BDM/26-27/00001
    footerTerms:
      "1. Subject to New Delhi jurisdiction.\n2. Manufacturer warranty applies per serial number.\n3. Input tax credit is available only for a valid GSTIN.",
    signatoryName: "Authorised Signatory",
    signatoryPath: "",
  },
  rental: {
    reminderDaysBeforeDue: 3,
    lateFeePerDayPaise: 25_000, // ₹250
    gracePeriodDays: 0,
    depositRefundDays: 2,
  },
};

export const SETTING_GROUPS = Object.keys(DEFAULTS); // store · shipping · tax · rental (payments: not yet)

// Image settings that are uploaded (not typed). key → how the image is processed.
export const IMAGE_SETTINGS = {
  logo: { group: "store", key: "logoPath", options: { maxDimension: 800, variantWidths: [] } },
  footerLogo: { group: "store", key: "footerLogoPath", options: { maxDimension: 800, variantWidths: [] } },
  favicon: { group: "store", key: "faviconPath", options: { maxDimension: 192, variantWidths: [], square: true } },
  signatory: { group: "tax", key: "signatoryPath", options: { maxDimension: 600, variantWidths: [] } },
};

// ---------------------------------------------------------------------------
// Validation of admin input (rupees in, paise stored)
// ---------------------------------------------------------------------------

const text = (max, label) => z.string({ error: `${label} is required` }).trim().max(max, `${label} must be at most ${max} characters`);
const required = (max, label) => text(max, label).min(1, `${label} is required`);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 09:30");
const rupees = (label, max = 10_00_000) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(max, `${label} is too large`)
    .transform((r) => Math.round(r * 100));
const url = z.union([z.literal(""), z.url("Enter a full URL starting with https://").max(300)]);
const phone = (label) =>
  z
    .string()
    .trim()
    .max(25)
    .refine((v) => v === "" || /^[+\d][\d\s\-()]{6,}$/.test(v), `${label}: use digits, spaces, + or -`);

export const SCHEMAS = {
  store: z.object({
    storeName: required(200, "Legal name"),
    brandName: required(80, "Brand name"),
    tagline: text(120, "Tagline"),
    supportPhone: phone("Support phone").refine((v) => v !== "", "Support phone is required"),
    salesPhone: phone("Sales phone"),
    tollFreePhone: phone("Toll-free number"),
    supportEmail: z.email("Enter a valid support email").max(200),
    salesEmail: z.union([z.literal(""), z.email("Enter a valid sales email").max(200)]),
    whatsappNumber: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))
      .refine((v) => v === "" || /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number for WhatsApp"),
    address: required(500, "Address"),
    mapUrl: url,
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .superRefine((v, ctx) => {
        if (!v) return;
        const r = checkGstin(v);
        if (!r.valid) ctx.addIssue({ code: "custom", message: r.message });
      }),
    supportOpenTime: time,
    supportCloseTime: time,
    openOnSunday: z.boolean(),
    instagramUrl: url,
    facebookUrl: url,
    linkedinUrl: url,
    youtubeUrl: url,
    twitterUrl: url,
  }),

  shipping: z
    .object({
      flatShippingCharge: rupees("Flat shipping charge", 10_000),
      freeShippingAbove: rupees("Free shipping threshold"),
      codEnabled: z.boolean(),
      codMaxOrderValue: rupees("COD limit"),
      codCharge: rupees("COD charge", 10_000),
      defaultDeliveryDays: z
        .string()
        .trim()
        .regex(/^\d{1,2}(-\d{1,2})?$/, 'Use days like "3-7" or "2"'),
      dispatchCutoffTime: time,
    })
    .transform((v) => ({
      flatShippingChargePaise: v.flatShippingCharge,
      freeShippingAbovePaise: v.freeShippingAbove,
      codEnabled: v.codEnabled,
      codMaxOrderValuePaise: v.codMaxOrderValue,
      codChargePaise: v.codCharge,
      defaultDeliveryDays: v.defaultDeliveryDays,
      dispatchCutoffTime: v.dispatchCutoffTime,
    })),

  tax: z.object({
    gstEnabled: z.boolean(),
    pricesIncludeGst: z.boolean(),
    defaultGstRate: z.coerce.number().refine((r) => [0, 5, 12, 18, 28].includes(r), "GST rate must be 0, 5, 12, 18 or 28 %"),
    dispatchStateCode: z.string().transform((v, ctx) => {
      const code = stateCode(v);
      if (!code || code === "97") {
        ctx.addIssue({ code: "custom", message: "Choose the state you dispatch from" });
        return z.NEVER;
      }
      return code;
    }),
    invoicePrefix: z
      .string()
      .trim()
      .max(16, "Invoice prefix must be at most 16 characters")
      .regex(/^[A-Z0-9/\-]*$/i, "Use letters, numbers, / or - only"),
    nextInvoiceNumber: z.coerce.number().int("Must be a whole number").min(1).max(99_999_999),
    invoiceNumberDigits: z.coerce.number().int().min(1).max(8),
    footerTerms: text(1500, "Invoice terms"),
    signatoryName: text(80, "Signatory name"),
  }),

  rental: z
    .object({
      reminderDaysBeforeDue: z.coerce.number().int().min(1, "At least 1 day").max(30, "At most 30 days"),
      lateFeePerDay: rupees("Late fee per day", 1_00_000),
      gracePeriodDays: z.coerce.number().int().min(0).max(30),
      depositRefundDays: z.coerce.number().int().min(1).max(30),
    })
    .transform(({ lateFeePerDay, ...rest }) => ({ ...rest, lateFeePerDayPaise: lateFeePerDay })),
};

/** Stored values → admin form values (paise → rupees). */
export function toAdminForm(group, values) {
  if (group === "shipping") {
    const { flatShippingChargePaise, freeShippingAbovePaise, codMaxOrderValuePaise, codChargePaise, ...rest } = values;
    return {
      ...rest,
      flatShippingCharge: flatShippingChargePaise / 100,
      freeShippingAbove: freeShippingAbovePaise / 100,
      codMaxOrderValue: codMaxOrderValuePaise / 100,
      codCharge: codChargePaise / 100,
    };
  }
  if (group === "rental") {
    const { lateFeePerDayPaise, ...rest } = values;
    return { ...rest, lateFeePerDay: lateFeePerDayPaise / 100 };
  }
  return values;
}

export const STATE_OPTIONS = Object.entries(GST_STATE_CODES)
  .filter(([code]) => code !== "97")
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));
