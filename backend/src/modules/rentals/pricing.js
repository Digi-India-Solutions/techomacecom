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
/** Delivery time slots the customer can pick (24h "HH:MM"), 10 AM – 4 PM. */
export const DELIVERY_TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

/** "14:00" → "2:00 PM" */
export function timeLabel(hhmm) {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export const DEPOSIT_MODES = ["online", "cheque"];

/**
 * @param depositMode "online" → the deposit is part of what is paid online (advance + balance);
 *                    "cheque" → the deposit is collected by staff as a cheque before delivery, so the
 *                    advance / online balance are worked out on rent + delivery + GST only.
 */
export function quoteRental({ plan, gstRate, periods, rental, tax, depositMode = "online" }) {
  const rate = BigInt(plan.price_paise);
  const rent = rate * BigInt(periods);
  const delivery = BigInt(plan.delivery_pickup_paise);
  const deposit = BigInt(plan.security_deposit_paise);
  const gst = tax.gstEnabled ? gstExclusive(rent + delivery, gstRate).gst : 0n;
  const total = rent + delivery + gst + deposit;
  const mode = depositMode === "cheque" && deposit > 0n ? "cheque" : "online";
  const depositByCheque = mode === "cheque" ? deposit : 0n;
  const online = total - depositByCheque;
  const percent = Math.min(100, Math.max(1, Number(rental.advancePaymentPercent) || 100));
  const advance = percent >= 100 ? online : (() => {
    const a = roundUpToRupee((online * BigInt(percent)) / 100n);
    return a > online ? online : a;
  })();
  return {
    rate, rent, delivery, deposit, gst, gstRate: Number(gstRate), total,
    depositMode: mode, depositByCheque, onlineTotal: online,
    advancePercent: percent, advance, balance: online - advance,
  };
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

/** Payment purpose of a deposit cheque recorded by staff (kept apart from the online balance). */
export const DEPOSIT_PAYMENT_PURPOSE = "rental_deposit";

const isChequeDeposit = (r) => r.deposit_mode === "cheque" && BigInt(r.deposit_paise) > 0n;

/** Part of the booking paid online / as normal payments (everything except a cheque deposit). */
export const onlineTotalPaise = (r) => rentalTotalPaise(r) - (isChequeDeposit(r) ? BigInt(r.deposit_paise) : 0n);

/** Rent / charges still unpaid (excludes the deposit when it comes by cheque). */
export function onlineDuePaise(r, payments = r.payments || []) {
  const paid = capturedPaise(payments.filter((p) => p.purpose !== DEPOSIT_PAYMENT_PURPOSE));
  const due = onlineTotalPaise(r) - paid;
  return due > 0n ? due : 0n;
}

/** Deposit cheque amount not yet recorded by staff (0 for online-deposit rentals). */
export function depositChequeDuePaise(r, payments = r.payments || []) {
  if (!isChequeDeposit(r)) return 0n;
  const got = capturedPaise(payments.filter((p) => p.purpose === DEPOSIT_PAYMENT_PURPOSE));
  const due = BigInt(r.deposit_paise) - got;
  return due > 0n ? due : 0n;
}

/** Late fee owed today for an overdue rental (grace days are free). */
export function lateFeeToday(rental, rentalSettings, today = todayIST()) {
  if (!rental.end_date || !["active", "overdue"].includes(rental.status)) return { days: 0, fee: 0n };
  const late = daysBetween(rental.end_date, dateOnly(today)) - Number(rentalSettings.gracePeriodDays || 0);
  const days = Math.max(0, late);
  return { days, fee: BigInt(days) * BigInt(rentalSettings.lateFeePerDayPaise || 0) };
}
