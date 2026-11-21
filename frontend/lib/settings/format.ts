import type { SiteSettings } from './types';

/** "09:00" → "9:00 AM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

/** "Mon – Sat, 9:00 AM – 7:30 PM IST" */
export function formatSupportHours(h: SiteSettings['store']['supportHours']): string {
  return `${h.openOnSunday ? 'All days' : 'Mon – Sat'}, ${formatTime(h.open)} – ${formatTime(h.close)} IST`;
}

/** Is the support desk open right now (IST)? */
export function isSupportOpen(h: SiteSettings['store']['supportHours'], now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const toMin = (s: string) => {
    const [hh, mm] = s.split(':').map(Number);
    return hh * 60 + (mm || 0);
  };
  if (get('weekday') === 'Sun' && !h.openOnSunday) return false;
  return minutes >= toMin(h.open) && minutes < toMin(h.close);
}

/** WhatsApp chat link with a pre-filled message. */
export function whatsappUrl(store: SiteSettings['store'], message?: string): string {
  if (!store.whatsappLink) return '';
  return message ? `${store.whatsappLink}?text=${encodeURIComponent(message)}` : store.whatsappLink;
}

export const mailto = (email: string) => `mailto:${email}`;
