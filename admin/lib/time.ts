/** "just now" · "5 min ago" · "3 hours ago" · "2 days ago" · "12 Nov 2026" */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso);
  const seconds = Math.round((Date.now() - then.getTime()) / 1000);
  if (Number.isNaN(seconds)) return '—';
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(then);
}

/** "9811234567" → "+91 98112 34567" */
export function formatMobile(mobile: string | null | undefined): string {
  const digits = (mobile || '').replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : mobile || '';
}
