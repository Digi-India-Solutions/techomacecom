import { gstExclusive } from "../../lib/money.js";

/**
 * Rental money — document §6: GST is added on top of rent + delivery/pickup (never on the
 * refundable deposit), and rent + deposit + charges are collected together. Admin → Settings →
 * Rental → "Advance payment %" lets the customer pay part of that up front; the rest is the balance.
 * Everything is BigInt paise.
 */

export const PERIOD_UNITS = {
  daily: { one: "day", many: "days", adverb: "Daily" },
  weekly: { one: "week", many: "weeks", adverb: "Weekly" },
  monthly: { one: "month", many: "months", adverb: "Monthly" },
};

export const periodLabel = (period, n) => `${n} ${n === 1 ? PERIOD_UNITS[period]?.one : PERIOD_UNITS[period]?.many}`;

/** "2026-11-21" in India (rentals start / end on Indian calendar days). */
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** "2026-11-21" → Date at UTC midnight (what Prisma stores in a DATE column). */
export const dateOnly = (ymd) => new Date(`${String(ymd).slice(0, 10)}T00:00:00Z`);
export const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

export function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Return date for a rental of n periods starting on `start` (the day the equipment is due back). */
export function addPeriods(start, period, n) {
  const d = new Date(start);
  if (period === "daily") d.setUTCDate(d.getUTCDate() + n);
  else if (period === "weekly") d.setUTCDate(d.getUTCDate() + 7 * n);
  else {
    // Calendar months, clamped to the month's last day (31 Jan + 1 month = 28/29 Feb, not 3 Mar)
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + n);
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, lastDay));
  }
  return d;
}

export const daysBetween = (from, to) => Math.round((dateOnly(ymd(to)) - dateOnly(ymd(from))) / 86_400_000);

const roundUpToRupee = (paise) => ((paise + 99n) / 100n) * 100n;

/**
 * @param plan        rental_plans row
 * @param gstRate     product GST % (5 / 12 / 18 …)
 * @param periods     number of days / weeks / months
 * @param rental      settings group "rental"
 * @param tax         settings group "tax"
 */
export function quoteRental({ plan, gstRate, periods, rental, tax }) {
  const rate = BigInt(plan.price_paise);
  const rent = rate * BigInt(periods);
  const delivery = BigInt(plan.delivery_pickup_paise);
  const deposit = BigInt(plan.security_deposit_paise);
  const gst = tax.gstEnabled ? gstExclusive(rent + delivery, gstRate).gst : 0n;
  const total = rent + delivery + gst + deposit;
  const percent = Math.min(100, Math.max(1, Number(rental.advancePaymentPercent) || 100));
  const advance = percent >= 100 ? total : (() => {
    const a = roundUpToRupee((total * BigInt(percent)) / 100n);
    return a > total ? total : a;
  })();
  return { rate, rent, delivery, deposit, gst, gstRate: Number(gstRate), total, advancePercent: percent, advance, balance: total - advance };
}

/** Rent (+ GST) for extending by n more periods. */
export function quoteExtension({ rate, gstRate, periods, tax }) {
  const rent = BigInt(rate) * BigInt(periods);
  const gst = tax.gstEnabled ? gstExclusive(rent, gstRate).gst : 0n;
  return { rent, gst, total: rent + gst };
}

/** What the booking costs in total so far (rent incl. extensions + delivery + GST + deposit). */
export const rentalTotalPaise = (r) =>
  BigInt(r.rent_paise) + BigInt(r.charges_paise) + BigInt(r.tax_paise) + BigInt(r.deposit_paise);

export const capturedPaise = (payments = []) =>
  payments.filter((p) => p.status === "captured").reduce((s, p) => s + BigInt(p.amount_paise), 0n);

/** Late fee owed today for an overdue rental (grace days are free). */
export function lateFeeToday(rental, rentalSettings, today = todayIST()) {
  if (!rental.end_date || !["active", "overdue"].includes(rental.status)) return { days: 0, fee: 0n };
  const late = daysBetween(rental.end_date, dateOnly(today)) - Number(rentalSettings.gracePeriodDays || 0);
  const days = Math.max(0, late);
  return { days, fee: BigInt(days) * BigInt(rentalSettings.lateFeePerDayPaise || 0) };
}
