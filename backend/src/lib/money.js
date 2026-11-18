import { z } from "zod";

/**
 * Money — document §3 conventions: "Money is stored in paise as BIGINT
 * (₹48,999 = 4899900) — no floats anywhere."
 *
 * Every calculation here is integer BigInt math on paise. Rounding is always
 * half-up (0.5 paise → 1 paise), the usual rule for Indian GST invoices.
 *
 *   toPaise("₹48,999.50")        → 4899950n
 *   formatINR(4899950n)           → "₹48,999.50"
 *   gstInclusive(4899900n, 18)    → { taxable: 4152458n, gst: 747442n, total: 4899900n }
 *   splitGst(747442n, true)       → { cgst: 373721n, sgst: 373721n, igst: 0n }
 */

const BP_SCALE = 10_000n; // 100 % = 10 000 basis points

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Exact decimal string → integer scaled by 10^scale, rounded half-up. */
function scaleDecimal(text, scale, label) {
  const m = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(text);
  if (!m) throw new TypeError(`${label}: "${text}" is not a valid amount`);
  const [, sign, int, frac = ""] = m;
  const padded = (frac + "0".repeat(scale + 1)).slice(0, scale + 1);
  let value = BigInt(int) * 10n ** BigInt(scale) + BigInt(padded.slice(0, scale) || "0");
  if (Number(padded[scale]) >= 5) value += 1n;
  return sign === "-" ? -value : value;
}

function normalize(value, label) {
  if (typeof value === "bigint") return `${value}`;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label}: ${value} is not a finite number`);
    if (Math.abs(value) > 9e13) throw new TypeError(`${label}: ${value} is too large`);
    return value.toFixed(6); // avoids 1e-7 / float artefacts like 0.30000000000000004
  }
  if (typeof value === "string") return value.replace(/[₹,\s]/g, "").replace(/^Rs\.?/i, "");
  if (value && typeof value.toString === "function") return value.toString(); // Prisma Decimal
  throw new TypeError(`${label}: expected a number or string`);
}

/** Rupees (number | "48,999.50" | "₹48,999") → paise BigInt */
export function toPaise(rupees) {
  return scaleDecimal(normalize(rupees, "amount"), 2, "amount");
}

/** Anything paise-like (BigInt, number, "4899900") → BigInt */
export function asPaise(paise) {
  if (typeof paise === "bigint") return paise;
  if (typeof paise === "number" && Number.isSafeInteger(paise)) return BigInt(paise);
  if (typeof paise === "string" && /^-?\d+$/.test(paise)) return BigInt(paise);
  throw new TypeError(`Invalid paise value: ${paise}`);
}

/** Percentage (18 | "18.00" | Prisma Decimal) → basis points BigInt (1800n) */
export function toBasisPoints(percent) {
  return scaleDecimal(normalize(percent, "rate"), 2, "rate");
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** paise → rupees as a JS number (for charts / JSON clients; never calculate with it). */
export function paiseToRupees(paise) {
  return Number(asPaise(paise)) / 100;
}

const groupINR = new Intl.NumberFormat("en-IN");

/** 4899900n → "₹48,999" · 4899950n → "₹48,999.50" · alwaysDecimals → "₹48,999.00" */
export function formatINR(paise, { alwaysDecimals = false, symbol = true } = {}) {
  const p = asPaise(paise);
  const negative = p < 0n;
  const abs = negative ? -p : p;
  const rupees = abs / 100n;
  const rest = abs % 100n;
  const decimals = rest || alwaysDecimals ? `.${String(rest).padStart(2, "0")}` : "";
  return `${negative ? "-" : ""}${symbol ? "₹" : ""}${groupINR.format(rupees)}${decimals}`;
}

/**
 * Shape for API responses: exact paise (string, from BigInt) + rupees + display text.
 *   { paise: "4899900", rupees: 48999, display: "₹48,999" }
 */
export function moneyJson(paise) {
  if (paise === null || paise === undefined) return null;
  const p = asPaise(paise);
  return { paise: p.toString(), rupees: paiseToRupees(p), display: formatINR(p) };
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

/** a × b / c, rounded half-up (non-negative results; sign handled for negatives). */
function mulDivRound(a, b, c) {
  const n = a * b;
  const negative = n < 0n !== c < 0n;
  const absN = n < 0n ? -n : n;
  const absC = c < 0n ? -c : c;
  const q = (absN * 2n + absC) / (absC * 2n);
  return negative ? -q : q;
}

export function sumPaise(...values) {
  return values.flat().reduce((sum, v) => sum + asPaise(v ?? 0n), 0n);
}

/** percent of an amount: percentOf(10000n, 18) → 1800n */
export function percentOf(paise, percent) {
  return mulDivRound(asPaise(paise), toBasisPoints(percent), BP_SCALE);
}

/** Line total: unit price × quantity */
export function lineTotal(unitPaise, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new TypeError("quantity must be a whole number ≥ 0");
  return asPaise(unitPaise) * BigInt(quantity);
}

/**
 * Coupon / offer discount.
 *   percentDiscount(500000n, 10, { maxDiscountPaise: 30000n }) → 30000n (capped)
 */
export function percentDiscount(paise, percent, { maxDiscountPaise } = {}) {
  const amount = asPaise(paise);
  let d = percentOf(amount, percent);
  if (maxDiscountPaise !== undefined && maxDiscountPaise !== null) {
    const cap = asPaise(maxDiscountPaise);
    if (d > cap) d = cap;
  }
  return d > amount ? amount : d;
}

/** Flat discount never larger than the amount. */
export function flatDiscount(paise, discountPaise) {
  const amount = asPaise(paise);
  const d = asPaise(discountPaise);
  return d > amount ? amount : d < 0n ? 0n : d;
}

/** "28% off" badge: whole-number percent saved vs MRP (rounded down, never negative). */
export function discountPercent(mrpPaise, pricePaise) {
  const mrp = asPaise(mrpPaise);
  const price = asPaise(pricePaise);
  if (mrp <= 0n || price >= mrp) return 0;
  return Number(((mrp - price) * 100n) / mrp);
}

// ---------------------------------------------------------------------------
// GST
// ---------------------------------------------------------------------------

export const GST_RATES = [0, 5, 12, 18, 28]; // products.gst_rate CHECK

/** Price excludes GST (rentals: rent + charges, document §6 step 2). */
export function gstExclusive(basePaise, ratePercent) {
  const taxable = asPaise(basePaise);
  const gst = percentOf(taxable, ratePercent);
  return { taxable, gst, total: taxable + gst };
}

/** Price includes GST (retail selling price / MRP). taxable = total × 100 / (100 + rate) */
export function gstInclusive(totalPaise, ratePercent) {
  const total = asPaise(totalPaise);
  const bp = toBasisPoints(ratePercent);
  const taxable = mulDivRound(total, BP_SCALE, BP_SCALE + bp);
  return { taxable, gst: total - taxable, total };
}

/**
 * Intra-state supply → CGST + SGST (half each); inter-state → IGST (document §11.6 order_items).
 * An odd paise goes to SGST so cgst + sgst always equals gst exactly.
 */
export function splitGst(gstPaise, intraState) {
  const gst = asPaise(gstPaise);
  if (!intraState) return { cgst: 0n, sgst: 0n, igst: gst };
  const cgst = gst / 2n;
  return { cgst, sgst: gst - cgst, igst: 0n };
}

/** GST state codes (first 2 digits of a GSTIN). 25 & 26 were merged into 26 in 2020. */
export const GST_STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

const squash = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
const STATE_ALIASES = {
  nctofdelhi: "07",
  newdelhi: "07",
  orissa: "21",
  pondicherry: "34",
  uttaranchal: "05",
  damananddiu: "26",
  dadraandnagarhaveli: "26",
  andamanandnicobar: "35",
  jandk: "01",
};
const CODE_BY_NAME = Object.fromEntries(Object.entries(GST_STATE_CODES).map(([code, name]) => [squash(name), code]));

/** "Uttar Pradesh" | "09AAACM1234F1Z8" (GSTIN) | "09" → "09"; null if unknown */
export function stateCode(stateOrGstin) {
  if (!stateOrGstin) return null;
  const v = String(stateOrGstin).trim();
  if (/^\d{2}/.test(v)) {
    const code = v.slice(0, 2) === "25" ? "26" : v.slice(0, 2);
    return GST_STATE_CODES[code] ? code : null;
  }
  const key = squash(v);
  return CODE_BY_NAME[key] || STATE_ALIASES[key] || null;
}

/** Seller (warehouse state / company GSTIN) vs place of supply (delivery state / buyer GSTIN). */
export function isIntraState(seller, placeOfSupply) {
  const a = stateCode(seller);
  const b = stateCode(placeOfSupply);
  if (!a || !b) throw new TypeError(`Unknown state for GST: "${!a ? seller : placeOfSupply}"`);
  return a === b;
}

// ---------------------------------------------------------------------------
// Validation (zod) — accept rupees from admin forms, store paise
// ---------------------------------------------------------------------------

/**
 * rupeesField({ min: 1 }) → accepts 48999 | "48,999.50" and outputs paise BigInt.
 *   price: rupeesField({ min: 1 }), mrp: rupeesField({ min: 1 }), deposit: rupeesField({ min: 0 }).optional()
 */
export function rupeesField({ min = 0, max = 10_00_00_000 } = {}) {
  return z.union([z.number(), z.string().trim().min(1, "Enter an amount")]).transform((value, ctx) => {
    let paise;
    try {
      paise = toPaise(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount, e.g. 48999 or 48999.50" });
      return z.NEVER;
    }
    if (paise < toPaise(min)) {
      ctx.addIssue({ code: "custom", message: `Must be at least ${formatINR(toPaise(min))}` });
      return z.NEVER;
    }
    if (paise > toPaise(max)) {
      ctx.addIssue({ code: "custom", message: `Must be at most ${formatINR(toPaise(max))}` });
      return z.NEVER;
    }
    return paise;
  });
}

export const gstRateField = z.coerce
  .number()
  .refine((r) => GST_RATES.includes(r), { message: `GST rate must be one of ${GST_RATES.join(", ")} %` });
