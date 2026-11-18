import type {
  ActivityLogEntry,
  MatrixActionKey,
  MatrixModuleKey,
  RoleDefinition,
  StaffMember,
} from '@/types/admin';
import { adminDelete, adminGet, adminPatch, adminPost, adminPut } from './client';

export const MATRIX_MODULES: { key: MatrixModuleKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'brands', label: 'Brands' },
  { key: 'bulk_import', label: 'Bulk Import' },
  { key: 'inventory', label: 'Inventory Stock' },
  { key: 'rental_units', label: 'Rental Units' },
  { key: 'orders', label: 'Orders' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'rentals', label: 'Rentals' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'customers', label: 'Customers' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'content', label: 'Content' },
  { key: 'settings', label: 'Settings' },
  { key: 'staff', label: 'Staff & Roles' },
  { key: 'activity', label: 'Activity Log' },
];

export const MATRIX_ACTIONS: { key: MatrixActionKey; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'export', label: 'Export' },
];

// ---------------------------------------------------------------------------
// Live API — backend/src/modules/staff (/api/v1/admin/roles, /staff, /activity-logs)
// MATRIX_MODULES / MATRIX_ACTIONS above must match backend/src/rbac/catalog.js.
// ---------------------------------------------------------------------------

type ApiStaff = Omit<StaffMember, 'lastLoginAt'> & { lastLoginAt: string | null };

const toStaff = (s: ApiStaff): StaffMember => ({ ...s, lastLoginAt: s.lastLoginAt || '' });

export async function listStaff(): Promise<StaffMember[]> {
  return (await adminGet<ApiStaff[]>('/admin/staff')).map(toStaff);
}

export interface SaveStaffResult {
  list: StaffMember[];
  message: string;
  /** Development only: returned when the invite email could not be sent. */
  inviteUrl?: string;
}

export async function saveStaffMember(
  member: Omit<StaffMember, 'id' | 'lastLoginAt' | 'roleName'> & { id?: string }
): Promise<SaveStaffResult> {
  const body = {
    name: member.name,
    email: member.email,
    mobile: member.mobile,
    roleId: member.roleId,
    department: member.department,
    status: member.status,
  };
  let message = 'Staff account updated';
  let inviteUrl: string | undefined;
  if (member.id) {
    await adminPut(`/admin/staff/${member.id}`, body);
  } else {
    const res = await adminPost<{ message: string; inviteUrl?: string }>('/admin/staff', body);
    message = res.message;
    inviteUrl = res.inviteUrl;
  }
  return { list: await listStaff(), message, inviteUrl };
}

export async function toggleStaffActive(id: string): Promise<StaffMember[]> {
  await adminPatch(`/admin/staff/${id}/status`);
  return listStaff();
}

/** Emails a reset link (or the invite again, if no password was ever set). */
export async function resetStaffPassword(id: string): Promise<{ message: string; resetUrl?: string }> {
  return adminPost<{ message: string; resetUrl?: string }>(`/admin/staff/${id}/reset-password`);
}

export async function listRoles(): Promise<RoleDefinition[]> {
  return adminGet<RoleDefinition[]>('/admin/roles');
}

export async function saveRoleDefinition(
  role: Omit<RoleDefinition, 'id' | 'isDefault'> & { id?: string }
): Promise<RoleDefinition[]> {
  const body = { name: role.name, description: role.description, matrix: role.matrix };
  if (role.id) await adminPut(`/admin/roles/${role.id}`, body);
  else await adminPost('/admin/roles', body);
  return listRoles();
}

export async function deleteRoleDefinition(id: string): Promise<RoleDefinition[]> {
  await adminDelete(`/admin/roles/${id}`);
  return listRoles();
}

export async function listActivityLogs(filters?: {
  staffId?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActivityLogEntry[]> {
  const q = new URLSearchParams({ limit: '200' });
  if (filters?.staffId && filters.staffId !== 'all') q.set('staffId', filters.staffId);
  if (filters?.module && filters.module !== 'all') q.set('module', filters.module);
  if (filters?.dateFrom) q.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) q.set('dateTo', filters.dateTo);
  return adminGet<ActivityLogEntry[]>(`/admin/activity-logs?${q}`);
}
