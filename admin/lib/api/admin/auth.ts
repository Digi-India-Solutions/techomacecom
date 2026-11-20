import type { AdminPermission, AdminUser, AuthSession, DeviceSession, MyActivityEntry } from '@/types/admin';
import { adminDelete, adminFetch, adminGet, adminPost, adminPut, type ListMeta } from './client';

/**
 * Admin staff auth — backend/src/modules/admin-auth (/api/v1/admin/auth/*).
 * Email + password; tokens are httpOnly cookies, so only the user profile and
 * permission list are kept in the browser (for a fast first paint). The API
 * re-checks permissions on every request — this list only drives the UI.
 */

const STORAGE_KEY = 'buydenmed_admin_session_v2';

/**
 * The UI was built with a few coarse names (e.g. "categories.manage"); the API
 * uses the module × action matrix (e.g. "categories.view"). Map old → new.
 */
const LEGACY_PERMISSION_MAP: Record<string, string> = {
  'categories.manage': 'categories.view',
  'brands.manage': 'brands.view',
  'bulk_import.run': 'bulk_import.view',
  'inventory.adjust': 'inventory.edit',
  'rental_units.manage': 'rental_units.edit',
  'marketing.manage': 'marketing.view',
  'content.manage': 'content.view',
  'settings.manage': 'settings.view',
  'staff.manage': 'staff.view',
  'activity_log.view': 'activity.view',
};

export function normalizePermission(permission: AdminPermission | string): string {
  return LEGACY_PERMISSION_MAP[permission] || permission;
}

export function hasPermission(permissions: string[] | undefined, permission: AdminPermission | string): boolean {
  return Boolean(permissions?.includes(normalizePermission(permission)));
}

// ---------------------------------------------------------------------------
// Cached session (profile + permissions only — never tokens)
// ---------------------------------------------------------------------------

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession | null, rememberMe?: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    // Keep using whichever storage the session started in unless told otherwise
    const useLocal = rememberMe ?? window.localStorage.getItem(STORAGE_KEY) !== null;
    (useLocal ? window.sessionStorage : window.localStorage).removeItem(STORAGE_KEY);
    (useLocal ? window.localStorage : window.sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage blocked (private mode) — the cookie session still works
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function loginAdmin(payload: { email: string; password: string; rememberMe: boolean }): Promise<AuthSession> {
  const session = await adminPost<AuthSession>('/admin/auth/login', {
    email: payload.email.trim(),
    password: payload.password,
    rememberMe: payload.rememberMe,
  });
  persistSession(session, payload.rememberMe);
  return session;
}

/** Current session from the API (refreshing the access cookie if needed), or null. */
export async function fetchAdminSession(): Promise<AuthSession | null> {
  try {
    const session = await adminGet<AuthSession>('/admin/auth/me');
    persistSession(session);
    return session;
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      persistSession(null);
      return null;
    }
    throw error;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await adminPost('/admin/auth/logout');
  } finally {
    persistSession(null);
  }
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return adminPost<{ message: string }>('/admin/auth/forgot-password', { email: email.trim() });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return adminPost<{ message: string }>('/admin/auth/reset-password', { token, password });
}

export async function updateAdminProfile(
  updates: Partial<Pick<AdminUser, 'name' | 'phone' | 'department'>>
): Promise<AuthSession> {
  const session = await adminPut<AuthSession>('/admin/auth/me', {
    name: updates.name,
    mobile: updates.phone,
    department: updates.department,
  });
  persistSession(session);
  return session;
}

export async function changeAdminPassword(payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  return adminPut<{ message: string }>('/admin/auth/me/password', payload);
}

// ---------------------------------------------------------------------------
// My Profile — photo, signed-in devices, own activity
// ---------------------------------------------------------------------------

/** Uploads a profile photo; the API square-crops it to 256 × 256 WebP. */
export async function uploadAdminAvatar(file: File): Promise<AuthSession> {
  const form = new FormData();
  form.append('file', file);
  const session = await adminPut<AuthSession>('/admin/auth/me/avatar', form);
  persistSession(session);
  return session;
}

export async function removeAdminAvatar(): Promise<AuthSession> {
  const session = await adminDelete<AuthSession>('/admin/auth/me/avatar');
  persistSession(session);
  return session;
}

export const listMySessions = () => adminGet<DeviceSession[]>('/admin/auth/sessions');

export const signOutDevice = (id: string) => adminDelete<{ message: string }>(`/admin/auth/sessions/${id}`);

export const signOutOtherDevices = () =>
  adminPost<{ count: number; message: string }>('/admin/auth/sessions/revoke-others');

export async function listMyActivity(page = 1, limit = 15): Promise<{ rows: MyActivityEntry[]; meta?: ListMeta }> {
  const { data, meta } = await adminFetch<MyActivityEntry[]>(`/admin/auth/me/activity?page=${page}&limit=${limit}`);
  return { rows: data, meta };
}

/** Same rule as the API (backend/src/lib/password.js). */
export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number';
export function isStrongPassword(value: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(value);
}
