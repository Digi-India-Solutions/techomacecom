/** Express API base, e.g. http://localhost:5001/api/v1 (set VITE_API_URL in admin/.env). */
export function getApiBaseUrl(): string {
  const vitePublic =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_API_URL as string | undefined)
      : undefined;
  return (vitePublic || 'http://localhost:5001/api/v1').replace(/\/+$/, '');
}

export async function mockDelay(ms = 180): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Error thrown by adminFetch — carries the API error code and per-field messages. */
export class AdminApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: { page: number; limit: number; total: number };
  error?: { code: string; message: string; fields?: Record<string, string> };
}

const NO_REFRESH = ['/admin/auth/login', '/admin/auth/refresh', '/admin/auth/logout', '/admin/auth/forgot-password', '/admin/auth/reset-password'];
let refreshing: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

/** AuthContext registers this so a dead session sends the user to the login page. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

export function refreshAdminSession(): Promise<boolean> {
  refreshing ??= fetch(`${getApiBaseUrl()}/admin/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: 'include', // httpOnly auth cookies set by the API
      // JSON bodies only — FormData (file uploads) must let the browser set its multipart boundary
      headers: { ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) },
    });
  } catch {
    throw new AdminApiError(0, 'NETWORK_ERROR', 'Cannot reach the API server. Is the backend running?');
  }
}

/**
 * Calls the live API. On 401 it refreshes the session once and retries;
 * if that fails the session-expired handler signs the user out.
 */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: Envelope<T>['meta'] }> {
  let res = await send(path, init);
  if (res.status === 401 && !NO_REFRESH.includes(path)) {
    if (await refreshAdminSession()) res = await send(path, init);
    else onSessionExpired?.();
  }
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success) {
    throw new AdminApiError(
      res.status,
      body?.error?.code || 'HTTP_ERROR',
      body?.error?.message || `Request failed (${res.status})`,
      body?.error?.fields
    );
  }
  return { data: body.data as T, meta: body.meta };
}

export const adminGet = async <T>(path: string) => (await adminFetch<T>(path)).data;
export const adminPost = async <T>(path: string, body?: unknown) =>
  (
    await adminFetch<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    })
  ).data;
export const adminPut = async <T>(path: string, body: unknown) =>
  (await adminFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) })).data;
export const adminPatch = async <T>(path: string, body?: unknown) =>
  (await adminFetch<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) })).data;
export const adminDelete = async <T>(path: string) => (await adminFetch<T>(path, { method: 'DELETE' })).data;

// ---------------------------------------------------------------------------
// Image uploads — backend converts every image to WebP (+ responsive sizes)
// ---------------------------------------------------------------------------

export type UploadFolder = 'products' | 'categories' | 'brands' | 'banners' | 'content' | 'misc';

export interface UploadedImage {
  /** Store this in the database, e.g. /uploads/products/2026/11/ab12….webp */
  path: string;
  /** Full URL for display */
  url: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
  originalBytes: number;
  savedPercent: number;
  variants: { width: number; height: number; path: string; url: string; bytes: number }[];
  /** For <img srcSet> */
  srcSet: string;
  /** Tiny blurred WebP data URL for instant placeholders */
  placeholder: string;
}

export async function uploadImages(files: File[], folder: UploadFolder): Promise<UploadedImage[]> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return adminPost<UploadedImage[]>(`/admin/uploads?folder=${folder}`, form);
}

/** Deletes an uploaded image and its responsive sizes from the server. */
export async function deleteUploadedImage(path: string): Promise<void> {
  await adminFetch('/admin/uploads', { method: 'DELETE', body: JSON.stringify({ path }) });
}

/** @deprecated use adminFetch — kept for modules still on mock data */
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return (await adminFetch<T>(endpoint, options)).data;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const escapeCell = (cell: string | number | boolean | null | undefined): string => {
    const str = cell === null || cell === undefined ? '' : String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
