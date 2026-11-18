/**
 * Indian states / UTs (official names, as the API stores them) and GSTIN checks.
 * Must match backend/src/lib/money.js GST_STATE_CODES and backend/src/lib/gstin.js.
 */

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '18', name: 'Assam' },
  { code: '10', name: 'Bihar' },
  { code: '04', name: 'Chandigarh' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '07', name: 'Delhi' },
  { code: '30', name: 'Goa' },
  { code: '24', name: 'Gujarat' },
  { code: '06', name: 'Haryana' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '20', name: 'Jharkhand' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '38', name: 'Ladakh' },
  { code: '31', name: 'Lakshadweep' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '27', name: 'Maharashtra' },
  { code: '14', name: 'Manipur' },
  { code: '17', name: 'Meghalaya' },
  { code: '15', name: 'Mizoram' },
  { code: '13', name: 'Nagaland' },
  { code: '21', name: 'Odisha' },
  { code: '34', name: 'Puducherry' },
  { code: '03', name: 'Punjab' },
  { code: '08', name: 'Rajasthan' },
  { code: '11', name: 'Sikkim' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '16', name: 'Tripura' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '19', name: 'West Bengal' },
];

const STATE_BY_CODE = Object.fromEntries(INDIAN_STATES.map((s) => [s.code, s.name]));

const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function checkChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}

/** null when valid, otherwise a message to show under the field. */
export function gstinError(value: string): string | null {
  const g = value.trim().toUpperCase();
  if (g.length !== 15) return 'A GSTIN has exactly 15 characters';
  if (!GSTIN_FORMAT.test(g)) return 'Enter a valid GSTIN, e.g. 27AAPFU0939F1ZV';
  const code = g.slice(0, 2) === '25' ? '26' : g.slice(0, 2);
  if (!STATE_BY_CODE[code] && code !== '97') return `"${g.slice(0, 2)}" is not a valid GST state code`;
  if (checkChar(g) !== g[14]) return "This GSTIN doesn't pass the check-digit test. Please re-check it.";
  return null;
}

export function gstinState(value: string): string | undefined {
  const code = value.slice(0, 2) === '25' ? '26' : value.slice(0, 2);
  return STATE_BY_CODE[code];
}

/** "9811234567" → "+91 98112 34567" */
export function formatMobile(mobile?: string | null): string {
  const digits = (mobile || '').replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : mobile || '';
}

/** Accepts +91 / 0 prefixes and spaces; returns 10 digits or null. */
export function normalizeMobile(input: string): string | null {
  let d = input.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}
