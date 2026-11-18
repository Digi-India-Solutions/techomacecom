import { GST_STATE_CODES } from "./money.js";

/**
 * GSTIN validation — 15 characters:
 *   2 state code · 10 PAN · 1 entity number · "Z" · 1 check character
 *   e.g. 27AAPFU0939F1ZV
 *
 * The last character is a checksum, so a single mistyped character is caught
 * here instead of on a tax invoice.
 */

const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/; // same as the DB CHECK
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Check character for the first 14 characters (GSTN's base-36 algorithm). */
export function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}

/**
 * @returns {{ valid: true, gstin, stateCode, stateName, pan } | { valid: false, reason, message }}
 */
export function checkGstin(input) {
  const gstin = String(input || "").toUpperCase().replace(/\s+/g, "");
  if (gstin.length !== 15) {
    return { valid: false, reason: "length", message: "A GSTIN has exactly 15 characters" };
  }
  if (!GSTIN_FORMAT.test(gstin)) {
    return { valid: false, reason: "format", message: "Enter a valid GSTIN, e.g. 27AAPFU0939F1ZV" };
  }
  const code = gstin.slice(0, 2);
  if (!GST_STATE_CODES[code] && code !== "25") {
    return { valid: false, reason: "state", message: `"${code}" is not a valid GST state code` };
  }
  if (gstinCheckChar(gstin) !== gstin[14]) {
    return {
      valid: false,
      reason: "checksum",
      message: "This GSTIN doesn't pass the check-digit test. Please re-check it against your GST certificate.",
    };
  }
  const stateCode = code === "25" ? "26" : code;
  return { valid: true, gstin, stateCode, stateName: GST_STATE_CODES[stateCode], pan: gstin.slice(2, 12) };
}
