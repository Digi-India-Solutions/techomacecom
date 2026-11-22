import { z } from "zod";
import { rupeesField } from "../../lib/money.js";
import { queryId } from "../../lib/list.js";

const text = (max, message) => z.string({ error: message }).trim().max(max, `At most ${max} characters`);
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `At most ${max} characters`)
    .nullish()
    .transform((v) => v || null);

export const idParams = z.object({ id: queryId });
export const orderReturnParams = z.object({ id: z.string().trim().min(1).max(40), returnId: queryId });

// Customer's bank / UPI account for a COD refund (stored encrypted)
const bankAccount = z.object({
  mode: z.literal("bank"),
  accountHolder: text(100, "Enter the account holder's name").min(2, "Enter the account holder's name"),
  accountNumber: z
    .string({ error: "Enter the account number" })
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{9,18}$/, "Account numbers have 9 to 18 digits")),
  ifsc: z
    .string({ error: "Enter the IFSC code" })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid 11-character IFSC, e.g. SBIN0001234"),
  bankName: optionalText(100),
});
const upiAccount = z.object({
  mode: z.literal("upi"),
  upiId: z
    .string({ error: "Enter your UPI id" })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.\-_]{2,256}@[a-z][a-z0-9]{1,63}$/, "Enter a valid UPI id, e.g. name@okhdfcbank"),
  accountHolder: optionalText(100),
});

export const createReturnSchema = z.object({
  type: z.enum(["refund", "replacement"], { error: "Choose a refund or a replacement" }),
  reason: text(120, "Choose a reason").min(3, "Choose a reason"),
  customerNote: text(1000, "Describe the problem").min(10, "Please describe the problem in a few words (at least 10 characters)"),
  photos: z.array(z.string().trim().max(300)).max(10, "At most 10 photos").default([]),
  items: z
    .array(
      z.object({
        orderItemId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^[1-9]\d{0,18}$/, "Invalid item")),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(1000),
      })
    )
    .min(1, "Select at least one item"),
  refundAccount: z.discriminatedUnion("mode", [bankAccount, upiAccount]).nullish(),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const listQuery = z.object({
  status: z
    .enum(["all", "open", "closed", "requested", "approved", "pickup_scheduled", "received", "replacement_shipped", "refunded", "completed", "rejected", "cancelled"])
    .default("all"),
  type: z.enum(["all", "refund", "replacement"]).default("all"),
  q: z.string().trim().max(80).optional(),
});

export const noteSchema = z.object({ note: optionalText(500) });
export const rejectSchema = z.object({
  reason: text(500, "Tell the customer why").min(5, "Tell the customer why (at least 5 characters)"),
});
export const adminNoteSchema = z.object({ adminNote: text(2000, "Note").default("") });

export const pickupSchema = z.object({
  pickupDate: z.iso.date("Choose the pickup date"),
  courier: text(80, "Enter the courier").min(2, "Enter the courier"),
  awb: optionalText(40),
  trackingUrl: z.union([z.literal(""), z.url("Enter a full tracking URL starting with https://").max(300)]).nullish(),
  note: optionalText(500),
});

export const receiveSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^[1-9]\d{0,18}$/)),
        condition: z.enum(["resellable", "damaged"], { error: "Choose the condition of each item" }),
      })
    )
    .default([]),
  note: optionalText(500),
});

export const refundSchema = z.object({
  amount: rupeesField({ min: 1 }),
  mode: z.enum(["gateway", "bank_transfer", "upi"], { error: "Choose how the refund is paid" }),
  reference: optionalText(80),
  note: optionalText(500),
});

export const orderRefundSchema = refundSchema.extend({
  reason: z.enum(["goodwill", "cancel", "return"]).default("goodwill"),
});

export const shipReplacementSchema = z.object({
  courier: text(80, "Enter the courier").min(2, "Enter the courier"),
  awb: optionalText(40),
  trackingUrl: z.union([z.literal(""), z.url("Enter a full tracking URL starting with https://").max(300)]).nullish(),
  note: optionalText(500),
});
