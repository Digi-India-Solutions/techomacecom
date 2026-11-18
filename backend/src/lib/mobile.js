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
