import { z } from "zod";
import { mobileField } from "../../lib/mobile.js";
import { queryId } from "../../lib/list.js";
import { stateCode, GST_STATE_CODES } from "../../lib/money.js";
import { checkGstin } from "../../lib/gstin.js";

export const ADDRESS_TYPES = ["home", "clinic", "hospital", "other"]; // addresses_type_chk
export const MAX_ADDRESSES = 20;
export const MAX_GST_PROFILES = 10;

const requiredText = (min, max, message) =>
  z.string({ error: message }).trim().min(min, message).max(max, `At most ${max} characters`);

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `At most ${max} characters`)
    .nullish()
    .transform((v) => v || null);

/** Any spelling of an Indian state / UT ("delhi", "Orissa", "09") → its official name. */
const indianState = z.string({ error: "Choose a state" }).transform((value, ctx) => {
  const code = stateCode(value);
  if (!code || code === "97") {
    ctx.addIssue({ code: "custom", message: "Choose a state from the list" });
    return z.NEVER;
  }
  return GST_STATE_CODES[code];
});

export const idParams = z.object({ id: queryId });

export const addressSchema = z.object({
  type: z.enum(ADDRESS_TYPES, { error: "Choose an address type" }),
  name: requiredText(2, 120, "Enter the contact person's name"),
  phone: mobileField(),
  organisationName: optionalText(200),
  line1: requiredText(3, 200, "Enter the building, floor and street"),
  line2: optionalText(200),
  landmark: optionalText(200),
  city: requiredText(2, 80, "Enter the city"),
  state: indianState,
  pincode: z.string({ error: "Enter the PIN code" }).trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
  isDefault: z.boolean().optional().default(false),
});

export const gstSchema = z.object({
  gstin: z.string({ error: "Enter your GSTIN" }).transform((value, ctx) => {
    const result = checkGstin(value);
    if (!result.valid) {
      ctx.addIssue({ code: "custom", message: result.message });
      return z.NEVER;
    }
    return result.gstin;
  }),
  companyName: requiredText(2, 200, "Enter the legal name registered with GST"),
  billingAddress: optionalText(500),
  isDefault: z.boolean().optional().default(false),
});
