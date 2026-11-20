/**
 * Client for the live Express API (backend/). Modules that are built on the API
 * use this; the rest of lib/api still uses mock data via fetchOrMock.
 *
 * Auth uses httpOnly cookies set by the API, so every call sends
 * `credentials: 'include'` and no token is ever stored in JavaScript.
 * A 401 triggers one silent POST /auth/refresh, then the request is retried.
 */

import { BACKEND_API_URL } from '../config';

// Local or production API, chosen automatically (lib/config.ts)
export const BACKEND_URL = BACKEND_API_URL;

export class ApiClientError extends Error {
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

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: { page: number; limit: number; total: number; totalPages?: number; hasNextPage?: boolean; hasPrevPage?: boolean };
  error?: { code: string; message: string; fields?: Record<string, string> };
}

// Endpoints that must never trigger the refresh-and-retry loop
const NO_REFRESH = ['/auth/refresh', '/auth/logout', '/auth/otp/send', '/auth/otp/verify', '/auth/google'];

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time, shared by every request that hit a 401 together. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BACKEND_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        // JSON only — FormData (photo uploads) must let the browser set its multipart boundary
        ...(typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response = await send(path, init);

  if (response.status === 401 && !NO_REFRESH.includes(path) && (await refreshSession())) {
    response = await send(path, init);
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiClientError(
      response.status,
      body?.error?.code || 'HTTP_ERROR',
      body?.error?.message || `Request failed (${response.status})`,
      body?.error?.fields
    );
  }
  return body.data as T;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Public, read-only GET that also returns the list `meta` (pagination).
 * No cookies are sent, so it works the same in server components and the browser.
 * `cache: 'no-store'` keeps admin edits visible immediately; switch to
 * `next: { revalidate: 30 }` later if the storefront needs more caching.
 */
export async function publicGet<T>(path: string): Promise<{ data: T; meta?: PageMeta }> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, { cache: 'no-store' });
  } catch {
    throw new ApiClientError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }
  const body = (await response.json().catch(() => null)) as (ApiEnvelope<T> & { meta?: PageMeta }) | null;
  if (!response.ok || !body?.success) {
    throw new ApiClientError(
      response.status,
      body?.error?.code || 'HTTP_ERROR',
      body?.error?.message || `Request failed (${response.status})`
    );
  }
  return { data: body.data as T, meta: body.meta };
}

export const apiPost = <T>(path: string, data?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

export const apiPut = <T>(path: string, data: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) });

export const apiDelete = <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' });

/** Human message for any thrown error. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiClientError || error instanceof Error) return error.message || fallback;
  return fallback;
}
