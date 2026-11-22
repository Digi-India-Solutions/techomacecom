import { test } from "node:test";
import assert from "node:assert/strict";
import "../config/load-env.js";
import { addPeriods, dateOnly, lateFeeToday, quoteExtension, quoteRental, rentalTotalPaise, ymd } from "../src/modules/rentals/pricing.js";

const plan = { price_paise: 250000n, delivery_pickup_paise: 10000n, security_deposit_paise: 100000n };
const tax = { gstEnabled: true };

test("GST is added on rent + delivery, never on the deposit", () => {
  const q = quoteRental({ plan, gstRate: 12, periods: 2, rental: { advancePaymentPercent: 100 }, tax });
  assert.equal(q.rent, 500000n);
  assert.equal(q.gst, 61200n); // 12% of ₹5,100
  assert.equal(q.total, 500000n + 10000n + 61200n + 100000n);
  assert.equal(q.advance, q.total);
  assert.equal(q.balance, 0n);
});

test("advance % is rounded up to the rupee and never exceeds the total", () => {
  const q = quoteRental({ plan, gstRate: 12, periods: 2, rental: { advancePaymentPercent: 33 }, tax });
  assert.equal(q.advance % 100n, 0n);
  assert.ok(q.advance >= (q.total * 33n) / 100n);
  assert.equal(q.advance + q.balance, q.total);
  const tiny = quoteRental({ plan: { price_paise: 150n, delivery_pickup_paise: 0n, security_deposit_paise: 0n }, gstRate: 0, periods: 1, rental: { advancePaymentPercent: 99 }, tax });
  assert.ok(tiny.advance <= tiny.total);
});

test("GST switched off → no tax", () => {
  const q = quoteRental({ plan, gstRate: 18, periods: 1, rental: { advancePaymentPercent: 50 }, tax: { gstEnabled: false } });
  assert.equal(q.gst, 0n);
  assert.equal(q.total, 360000n);
  assert.equal(q.advance, 180000n);
});

test("extension = rate × periods + GST", () => {
  const e = quoteExtension({ rate: 250000n, gstRate: 12, periods: 1, tax });
  assert.equal(e.total, 280000n);
});

test("period arithmetic, including month ends", () => {
  assert.equal(ymd(addPeriods(dateOnly("2026-11-22"), "daily", 3)), "2026-11-25");
  assert.equal(ymd(addPeriods(dateOnly("2026-11-22"), "weekly", 2)), "2026-12-06");
  assert.equal(ymd(addPeriods(dateOnly("2026-11-22"), "monthly", 2)), "2027-01-22");
  assert.equal(ymd(addPeriods(dateOnly("2027-01-31"), "monthly", 1)), "2027-02-28");
  assert.equal(ymd(addPeriods(dateOnly("2028-01-31"), "monthly", 1)), "2028-02-29"); // leap year
  assert.equal(ymd(addPeriods(dateOnly("2026-12-15"), "monthly", 3)), "2027-03-15");
});

test("late fee counts days after end date minus grace", () => {
  const r = { status: "overdue", end_date: dateOnly("2026-11-10") };
  const s = { gracePeriodDays: 2, lateFeePerDayPaise: 25000 };
  assert.deepEqual(lateFeeToday(r, s, "2026-11-15"), { days: 3, fee: 75000n });
  assert.deepEqual(lateFeeToday({ ...r, status: "returned" }, s, "2026-11-15"), { days: 0, fee: 0n });
  assert.deepEqual(lateFeeToday(r, s, "2026-11-11"), { days: 0, fee: 0n });
});

test("rental total includes rent, delivery, GST and deposit", () => {
  assert.equal(rentalTotalPaise({ rent_paise: 500000n, charges_paise: 10000n, tax_paise: 61200n, deposit_paise: 100000n }), 671200n);
});
