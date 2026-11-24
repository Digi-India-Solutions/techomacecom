import { DELIVERY_TIME_SLOTS } from "./pricing.js";
import { z } from "zod";
import { mobileField } from "../../lib/mobile.js";
import { rupeesField, stateCode, GST_STATE_CODES } from "../../lib/money.js";
import { queryId } from "../../lib/list.js";

const id = z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^[1-9]\d{0,18}$/, "Invalid id"));
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `At most ${max} characters`)
    .nullish()
    .transform((v) => v || null);
const date = (msg) => z.iso.date(msg);
const period = z.enum(["daily", "weekly", "monthly"], { error: "Choose daily, weekly or monthly" });
const trackingUrl = z.union([z.literal(""), z.url("Enter a full tracking URL starting with https://").max(300)]).nullish();

export const idParams = z.object({ id: z.string().trim().min(1).max(40) });
export const docParams = z.object({ id: z.string().trim().min(1).max(40), docId: queryId });
export const docIdParams = z.object({ docId: queryId });
export const refundParams = z.object({ id: z.string().trim().min(1).max(40), refundId: queryId });

// ---- Storefront ----

export const quoteSchema = z.object({
  productId: z.string().trim().max(200).optional(),
  productSlug: z.string().trim().max(200).optional(),
  period,
  periods: z.coerce.number().int().min(1).max(365),
  startDate: date("Choose a start date").optional(),
  depositMode: z.enum(["online", "cheque"]).default("online"),
});

const address = z.object({
  name: z.string().trim().min(2, "Enter the contact person's name").max(120),
  phone: mobileField(),
  organisation_name: optionalText(200),
  line1: z.string().trim().min(3, "Enter the building, floor and street").max(200),
  line2: optionalText(200),
  landmark: optionalText(200),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.string().trim().min(2, "Enter the state").max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export const createRentalSchema = z
  .object({
    productId: z.string().trim().max(200).optional(),
    productSlug: z.string().trim().max(200).optional(),
    period,
    periods: z.coerce.number().int().min(1).max(365),
    startDate: date("Choose a start date"),
    addressId: id.optional(),
    address: address.optional(),
    kycDocumentIds: z.array(id).max(20).default([]),
    deliveryTime: z.enum(DELIVERY_TIME_SLOTS, { error: "Choose a delivery time between 10 AM and 4 PM" }),
    depositMode: z.enum(["online", "cheque"]).default("online"),
  })
  .refine((v) => v.addressId || v.address, { message: "Choose a delivery address", path: ["address"] })
  .refine((v) => v.productId || v.productSlug, { message: "Choose a product", path: ["productId"] });

export const kycUploadSchema = z.object({ docType: z.string().trim().min(2).max(40) });
export const payStartSchema = z.object({ kind: z.enum(["advance", "balance"]).default("balance") });
export const verifySchema = z.object({
  razorpayOrderId: z.string().trim().min(5).max(60),
  razorpayPaymentId: z.string().trim().min(5).max(60),
  razorpaySignature: z.string().trim().min(10).max(200),
});
export const extendSchema = z.object({ extraPeriods: z.coerce.number().int().min(1, "At least 1").max(365) });
export const returnRequestSchema = z.object({ pickupDate: date("Choose a pickup date") });
export const cancelSchema = z.object({ reason: z.string().trim().min(3, "Tell us why").max(300) });

// ---- Admin ----

export const listQuery = z.object({
  status: z
    .enum([
      "all", "open", "needs_action", "in_use",
      "pending_payment", "pending_approval", "approved", "dispatched", "active", "extension_requested",
      "overdue", "return_scheduled", "returned", "deposit_refunded", "cancelled",
    ])
    .default("all"),
  due: z.enum(["7d", "kyc"]).optional(),
  q: z.string().trim().max(80).optional(),
});

export const kycReviewSchema = z.object({
  decisions: z
    .array(z.object({ docId: id, status: z.enum(["approved", "rejected"]), reason: optionalText(300) }))
    .min(1, "Review at least one document"),
  note: optionalText(500),
});
export const approveSchema = z.object({ unitId: id.optional(), note: optionalText(500) });
export const assignSchema = z.object({ unitId: id });
export const dispatchSchema = z.object({
  courier: z.string().trim().min(2, "Enter the courier").max(80),
  awb: optionalText(40),
  trackingUrl,
  note: optionalText(500),
});
export const deliveredSchema = z.object({ deliveredOn: date("Choose the delivery date").optional() });
export const depositChequeSchema = z.object({
  chequeNumber: z.string().trim().min(3, "Enter the cheque number").max(30),
  bank: optionalText(80),
  note: optionalText(300),
});
export const paymentSchema = z.object({
  amount: rupeesField({ min: 1 }),
  method: z.enum(["cash", "upi", "bank_transfer", "cheque"], { error: "Choose how it was paid" }),
  reference: optionalText(80),
  note: optionalText(300),
});
export const adminExtendSchema = z
  .object({
    extraPeriods: z.coerce.number().int().min(1).max(365),
    collected: z.boolean().default(false),
    method: z.enum(["cash", "upi", "bank_transfer", "cheque"]).optional(),
    reference: optionalText(80),
  })
  .refine((v) => !v.collected || v.method, { message: "Choose how the payment was collected", path: ["method"] });
export const scheduleReturnSchema = z.object({
  pickupDate: date("Choose the pickup date"),
  courier: optionalText(80),
  awb: optionalText(40),
  trackingUrl,
  note: optionalText(500),
});
export const receiveSchema = z.object({
  condition: z.enum(["good", "needs_service", "damaged"], { error: "Choose the condition" }),
  notes: optionalText(1000),
  receivedOn: date("Choose the date").optional(),
  deductions: z
    .array(
      z.object({
        type: z.enum(["late_fee", "damage", "missing_accessory"]),
        amount: rupeesField({ min: 1 }),
        description: optionalText(200),
      })
    )
    .max(20)
    .default([]),
});
export const refundSchema = z.object({
  amount: rupeesField({ min: 0 }),
  mode: z.enum(["gateway", "bank_transfer", "upi"], { error: "Choose how the refund is paid" }),
  reference: optionalText(80),
  note: optionalText(300),
});
export const otherRefundSchema = refundSchema.extend({ amount: rupeesField({ min: 1 }) });
export const noteSchema = z.object({ note: z.string().trim().min(1, "Write a note").max(1000) });

// ---- Admin: enter a rental by hand ----

const ADDRESS_TYPES = ["home", "clinic", "hospital", "other"];
const manualAddress = z.object({
  type: z.enum(ADDRESS_TYPES).default("home"),
  name: z.string().trim().min(2, "Enter the contact person's name").max(120),
  phone: mobileField(),
  organisation: optionalText(200),
  line1: z.string().trim().min(3, "Enter the building, floor and street").max(200),
  line2: optionalText(200),
  landmark: optionalText(200),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.string().transform((value, ctx) => {
    const code = stateCode(value);
    if (!code || code === "97") {
      ctx.addIssue({ code: "custom", message: "Choose a state from the list" });
      return z.NEVER;
    }
    return GST_STATE_CODES[code];
  }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export const lookupQuery = z.object({ email: z.email("Enter a valid email").max(200) });

export const manualRentalSchema = z
  .object({
    productId: id,
    period,
    periods: z.coerce.number().int().min(1, "At least 1").max(365),
    startDate: date("Choose the start date"),
    status: z.enum(["approved", "active", "completed"], { error: "Choose the rental status" }),
    // Price agreed at the time (defaults to the plan)
    rate: rupeesField({ min: 0 }).optional(),
    deposit: rupeesField({ min: 0 }).optional(),
    delivery: rupeesField({ min: 0 }).optional(),
    chargeGst: z.boolean().default(true),
    customer: z.object({
      email: z.email("Enter a valid email").max(200).transform((v) => v.toLowerCase()),
      name: z.string().trim().min(2, "Enter the customer's name").max(120),
      mobile: mobileField({ allowEmpty: true }).optional(),
      type: z.enum(["doctor", "clinic_admin", "procurement", "individual"]).optional(),
    }),
    addressId: id.optional(),
    address: manualAddress.optional(),
    unitId: id.optional(),
    payment: z
      .object({
        amount: rupeesField({ min: 0 }),
        method: z.enum(["cash", "upi", "bank_transfer", "cheque", "card"], { error: "Choose how it was paid" }),
        reference: optionalText(80),
        paidOn: date("Choose the payment date").optional(),
      })
      .optional(),
    completion: z
      .object({
        returnedOn: date("Choose the return date"),
        condition: z.enum(["good", "needs_service", "damaged"]).default("good"),
        depositRefund: rupeesField({ min: 0 }),
        refundMethod: z.enum(["bank_transfer", "upi", "pending", "none"]).default("bank_transfer"),
        refundReference: optionalText(80),
      })
      .optional(),
    note: optionalText(500),
  })
  .refine((v) => v.addressId || v.address, { message: "Choose or enter the delivery address", path: ["address"] })
  .refine((v) => v.status !== "completed" || v.completion, { message: "Enter the return details", path: ["completion"] })
  .refine((v) => v.status !== "completed" || !v.completion || v.completion.returnedOn >= v.startDate, {
    message: "The return date cannot be before the start date",
    path: ["completion.returnedOn"],
  });
