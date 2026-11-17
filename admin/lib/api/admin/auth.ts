import type { AdminPermission, AdminRole, AdminUser, AuthSession } from '@/types/admin';
import { mockDelay } from './client';

const STORAGE_KEY = 'buydenmed_admin_session_v1';

export const DEMO_USERS: Record<AdminRole, AdminUser> = {
  super_admin: {
    id: 'usr-1',
    name: 'Rohan Malhotra',
    email: 'rohan.malhotra@buydenmed.in',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    avatarInitials: 'RM',
    phone: '+91 98110 42100',
    department: 'Executive & Operations',
    lastLoginAt: '2026-11-17T08:30:00Z',
  },
  manager: {
    id: 'usr-2',
    name: 'Priya Nair',
    email: 'priya.nair@buydenmed.in',
    role: 'manager',
    roleLabel: 'Operations Manager',
    avatarInitials: 'PN',
    phone: '+91 98201 33410',
    department: 'Catalog & Supply Chain',
    lastLoginAt: '2026-11-17T07:55:00Z',
  },
  staff: {
    id: 'usr-3',
    name: 'Vikram Singh',
    email: 'vikram.singh@buydenmed.in',
    role: 'staff',
    roleLabel: 'Warehouse & Rental Staff',
    avatarInitials: 'VS',
    phone: '+91 99103 88120',
    department: 'Okhla Fulfillment Hub',
    lastLoginAt: '2026-11-17T06:45:00Z',
  },
};

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'categories.manage',
    'brands.manage',
    'bulk_import.run',
    'inventory.view',
    'inventory.adjust',
    'rental_units.view',
    'rental_units.manage',
    'orders.view',
    'rentals.view',
    'enquiries.view',
    'reviews.view',
    'customers.view',
    'marketing.manage',
    'content.manage',
    'settings.manage',
    'staff.manage',
    'activity_log.view',
  ],
  manager: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'categories.manage',
    'brands.manage',
    'bulk_import.run',
    'inventory.view',
    'inventory.adjust',
    'rental_units.view',
    'rental_units.manage',
    'orders.view',
    'rentals.view',
    'enquiries.view',
    'reviews.view',
    'customers.view',
    'marketing.manage',
    'content.manage',
  ],
  staff: [
    'dashboard.view',
    'products.view',
    'inventory.view',
    'inventory.adjust',
    'rental_units.view',
    'rental_units.manage',
    'orders.view',
    'rentals.view',
    'enquiries.view',
  ],
};

export function hasPermission(role: AdminRole | undefined, permission: AdminPermission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  const target = session.rememberMe ? window.localStorage : window.sessionStorage;
  const other = session.rememberMe ? window.sessionStorage : window.localStorage;
  other.removeItem(STORAGE_KEY);
  target.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function loginAdmin(payload: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<AuthSession> {
  await mockDelay(250);
  const emailLower = payload.email.trim().toLowerCase();
  if (!emailLower || !payload.password.trim()) {
    throw new Error('Please enter both email and password.');
  }
  if (payload.password.length < 4) {
    throw new Error('Invalid credentials. Password must be at least 4 characters.');
  }

  let matchedUser: AdminUser = DEMO_USERS.super_admin;
  if (emailLower.includes('priya') || emailLower.includes('manager')) {
    matchedUser = DEMO_USERS.manager;
  } else if (emailLower.includes('vikram') || emailLower.includes('staff')) {
    matchedUser = DEMO_USERS.staff;
  } else if (emailLower !== DEMO_USERS.super_admin.email && !emailLower.includes('admin')) {
    matchedUser = {
      ...DEMO_USERS.super_admin,
      email: emailLower,
    };
  }

  const session: AuthSession = {
    user: { ...matchedUser, lastLoginAt: new Date().toISOString() },
    token: `bdm_mock_jwt_${Date.now()}`,
    rememberMe: payload.rememberMe,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  persistSession(session);
  return session;
}

export async function switchDemoRole(role: AdminRole): Promise<AuthSession> {
  await mockDelay(120);
  const current = getStoredSession();
  const user = DEMO_USERS[role];
  const session: AuthSession = {
    user: { ...user, lastLoginAt: new Date().toISOString() },
    token: `bdm_mock_jwt_${role}_${Date.now()}`,
    rememberMe: current?.rememberMe ?? true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  persistSession(session);
  return session;
}

export async function logoutAdmin(): Promise<void> {
  await mockDelay(80);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  await mockDelay(250);
  if (!email.includes('@')) {
    throw new Error('Enter a valid work email address.');
  }
  return {
    message: `Password reset instructions sent to ${email}. Check your inbox or contact IT Security.`,
  };
}

export async function updateAdminProfile(updates: Partial<Pick<AdminUser, 'name' | 'phone' | 'department'>>): Promise<AdminUser> {
  await mockDelay(180);
  const session = getStoredSession();
  if (!session) throw new Error('Not authenticated');
  const updatedUser: AdminUser = {
    ...session.user,
    ...updates,
    avatarInitials: (updates.name || session.user.name)
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  };
  persistSession({ ...session, user: updatedUser });
  return updatedUser;
}

export async function changeAdminPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  await mockDelay(200);
  if (!payload.currentPassword || payload.newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }
  return { success: true };
}
