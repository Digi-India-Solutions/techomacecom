import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toPaise, asPaise, formatINR, moneyJson, percentOf, percentDiscount, flatDiscount, discountPercent,
  gstExclusive, gstInclusive, splitGst, stateCode, isIntraState, sumPaise, lineTotal, rupeesField,
} from "../src/lib/money.js";

test("toPaise parses rupees exactly (no float errors)", () => {
  assert.equal(toPaise(48999), 4899900n);
  assert.equal(toPaise("48,999.50"), 4899950n);
  assert.equal(toPaise("₹ 1,00,000"), 10000000n);
  assert.equal(toPaise(0.1 + 0.2), 30n); // 0.30000000000000004
  assert.equal(toPaise("10.005"), 1001n); // half-up
  assert.equal(toPaise("10.004"), 1000n);
  assert.equal(toPaise("-5.5"), -550n);
  assert.throws(() => toPaise("abc"));
  assert.throws(() => toPaise(Number.NaN));
});

test("formatINR uses Indian grouping and hides .00", () => {
  assert.equal(formatINR(4899900n), "₹48,999");
  assert.equal(formatINR(4899950n), "₹48,999.50");
  assert.equal(formatINR(1000000000n), "₹1,00,00,000");
  assert.equal(formatINR(5n), "₹0.05");
  assert.equal(formatINR(-12345n), "-₹123.45");
  assert.equal(formatINR(4899900n, { alwaysDecimals: true }), "₹48,999.00");
  assert.deepEqual(moneyJson("4899900"), { paise: "4899900", rupees: 48999, display: "₹48,999" });
});

test("percentages and discounts", () => {
  assert.equal(percentOf(10000n, 18), 1800n);
  assert.equal(percentOf(333n, "12.50"), 42n); // 41.625 → 42
  assert.equal(percentDiscount(500000n, 10, { maxDiscountPaise: 30000n }), 30000n);
  assert.equal(percentDiscount(100n, 150), 100n); // never more than the amount
  assert.equal(flatDiscount(1000n, 5000n), 1000n);
  assert.equal(discountPercent(toPaise(68000), toPaise(48999)), 27); // 27.94 → 27
  assert.equal(discountPercent(100n, 120n), 0);
  assert.equal(sumPaise(100n, "200", 300, [400n]), 1000n);
  assert.equal(lineTotal(toPaise(2499), 3), 749700n);
  assert.equal(asPaise("42"), 42n);
});

test("GST exclusive / inclusive / split", () => {
  assert.deepEqual(gstExclusive(toPaise(4500), 12), { taxable: 450000n, gst: 54000n, total: 504000n });
  const inc = gstInclusive(toPaise(48999), 18);
  assert.equal(inc.taxable + inc.gst, 4899900n);
  assert.equal(inc.taxable, 4152458n);
  assert.deepEqual(splitGst(inc.gst, true), { cgst: 373721n, sgst: 373721n, igst: 0n });
  assert.deepEqual(splitGst(101n, true), { cgst: 50n, sgst: 51n, igst: 0n });
  assert.deepEqual(splitGst(101n, false), { cgst: 0n, sgst: 0n, igst: 101n });
  assert.deepEqual(gstInclusive(10000n, 0), { taxable: 10000n, gst: 0n, total: 10000n });
});

test("state codes for intra/inter-state GST", () => {
  assert.equal(stateCode("Uttar Pradesh"), "09");
  assert.equal(stateCode("09AAACM1234F1Z8"), "09");
  assert.equal(stateCode("NCT of Delhi"), "07");
  assert.equal(stateCode("Orissa"), "21");
  assert.equal(stateCode("Jammu & Kashmir"), "01");
  assert.equal(stateCode("Atlantis"), null);
  assert.equal(isIntraState("Delhi", "07AAACM1234F1Z8"), true);
  assert.equal(isIntraState("Delhi", "Haryana"), false);
  assert.throws(() => isIntraState("Delhi", "Atlantis"));
});

test("rupeesField validates form input into paise", () => {
  const f = rupeesField({ min: 1 });
  assert.equal(f.parse("48,999"), 4899900n);
  assert.equal(f.safeParse("0").success, false);
  assert.equal(f.safeParse("12abc").success, false);
});
