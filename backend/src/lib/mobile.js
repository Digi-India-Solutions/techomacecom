import { z } from "zod";

/**
 * Indian mobile numbers are stored as 10 digits (e.g. 9811234567).
 * Accepts "+91 98112 34567", "09811234567", "919811234567", …
 * Returns null when the number is not a valid Indian mobile.
 */
export function normalizeMobile(input) {
  if (input === undefined || input === null) return null;
  let digits = String(input).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** 98XXXXXX67 — for logs and messages that should not show the full number. */
export function maskMobile(mobile) {
  return mobile ? `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}` : "";
}

/**
 * zod field: any common way of writing an Indian mobile → "9811234567".
 *   mobileField()                            required
 *   mobileField({ allowEmpty: true })        "" → null (clears the number)
 *   mobileField({ allowEmpty: true }).optional()  missing → unchanged
 */
export function mobileField({ allowEmpty = false, message = "Enter a valid 10-digit Indian mobile number" } = {}) {
  return z.string({ error: "Mobile number is required" }).transform((v, ctx) => {
    if (allowEmpty && !v.trim()) return null;
    const m = normalizeMobile(v);
    if (!m) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return m;
  });
}
