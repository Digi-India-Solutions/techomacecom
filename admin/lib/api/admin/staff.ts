import type {
  ActivityLogEntry,
  MatrixActionKey,
  MatrixModuleKey,
  RoleDefinition,
  RolePermissionMatrix,
  StaffMember,
} from '@/types/admin';
import { mockDelay } from './client';

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

function buildMatrix(preset: 'all' | 'manager' | 'staff'): RolePermissionMatrix {
  const matrix = {} as RolePermissionMatrix;
  for (const mod of MATRIX_MODULES) {
    if (preset === 'all') {
      matrix[mod.key] = { view: true, create: true, edit: true, delete: true, export: true };
    } else if (preset === 'manager') {
      const restricted = mod.key === 'settings' || mod.key === 'staff';
      matrix[mod.key] = {
        view: !restricted,
        create: !restricted,
        edit: !restricted,
        delete: false,
        export: !restricted,
      };
    } else {
      const opsAllowed = [
        'dashboard',
        'products',
        'inventory',
        'rental_units',
        'orders',
        'rentals',
        'enquiries',
      ].includes(mod.key);
      matrix[mod.key] = {
        view: opsAllowed,
        create: mod.key === 'rental_units',
        edit: ['inventory', 'rental_units', 'orders', 'rentals', 'enquiries'].includes(mod.key),
        delete: false,
        export: false,
      };
    }
  }
  return matrix;
}

let rolesStore: RoleDefinition[] = [
  {
    id: 'role-super',
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Full access to all catalog, financial, settings, and staff modules.',
    isDefault: true,
    matrix: buildMatrix('all'),
  },
  {
    id: 'role-mgr',
    key: 'manager',
    name: 'Operations Manager',
    description: 'Full catalog, orders, rentals, and marketing access without delete or system settings.',
    isDefault: true,
    matrix: buildMatrix('manager'),
  },
  {
    id: 'role-staff',
    key: 'staff',
    name: 'Warehouse & Rental Staff',
    description: 'Operational access to stock adjustments, serial rental units, order packing, and enquiries.',
    isDefault: true,
    matrix: buildMatrix('staff'),
  },
];

let staffStore: StaffMember[] = [
  {
    id: 'usr-1',
    name: 'Rohan Malhotra',
    email: 'rohan.malhotra@buydenmed.in',
    mobile: '+91 98110 42100',
    roleId: 'role-super',
    roleName: 'Super Admin',
    department: 'Executive & Operations',
    status: 'active',
    lastLoginAt: '2026-11-17T08:30:00Z',
  },
  {
    id: 'usr-2',
    name: 'Priya Nair',
    email: 'priya.nair@buydenmed.in',
    mobile: '+91 98201 33410',
    roleId: 'role-mgr',
    roleName: 'Operations Manager',
    department: 'Catalog & Supply Chain',
    status: 'active',
    lastLoginAt: '2026-11-17T07:55:00Z',
  },
  {
    id: 'usr-3',
    name: 'Vikram Singh',
    email: 'vikram.singh@buydenmed.in',
    mobile: '+91 99103 88120',
    roleId: 'role-staff',
    roleName: 'Warehouse & Rental Staff',
    department: 'Okhla Fulfillment Hub',
    status: 'active',
    lastLoginAt: '2026-11-17T06:45:00Z',
  },
  {
    id: 'usr-4',
    name: 'Suresh Verma',
    email: 'suresh.verma@buydenmed.in',
    mobile: '+91 98712 40912',
    roleId: 'role-staff',
    roleName: 'Warehouse & Rental Staff',
    department: 'Biomedical Service Lab',
    status: 'inactive',
    lastLoginAt: '2026-11-09T14:20:00Z',
  },
];

let activityStore: ActivityLogEntry[] = [
  {
    id: 'act-1',
    timestamp: '2026-11-17T09:45:00Z',
    staffId: 'usr-3',
    staffName: 'Vikram Singh',
    module: 'Orders',
    action: 'Status Updated',
    recordLabel: 'ORD-2026-8841',
    recordHref: '/admin/orders/ord-1',
    changesSummary: 'Order Status: Confirmed → Packed',
  },
  {
    id: 'act-2',
    timestamp: '2026-11-17T08:30:00Z',
    staffId: 'usr-1',
    staffName: 'Rohan Malhotra',
    module: 'Orders',
    action: 'Confirmed Order',
    recordLabel: 'ORD-2026-8841',
    recordHref: '/admin/orders/ord-1',
    changesSummary: 'Order Status: New → Confirmed (B2B GSTIN verified)',
  },
  {
    id: 'act-3',
    timestamp: '2026-11-16T18:10:00Z',
    staffId: 'usr-2',
    staffName: 'Priya Nair',
    module: 'Products',
    action: 'Updated Price',
    recordLabel: 'MedixPulse 5L Oxygen Concentrator',
    recordHref: '/admin/products/prod-oxy-5l',
    changesSummary: 'Selling Price: ₹44,000 → ₹42,500',
  },
  {
    id: 'act-4',
    timestamp: '2026-11-16T12:00:00Z',
    staffId: 'usr-3',
    staffName: 'Vikram Singh',
    module: 'Inventory',
    action: 'Stock Adjustment',
    recordLabel: 'BDM-MON-7000-5P',
    recordHref: '/admin/inventory',
    changesSummary: 'Available Stock: 4 → 3 (-1 Damage / RMA)',
  },
  {
    id: 'act-5',
    timestamp: '2026-11-15T15:30:00Z',
    staffId: 'usr-1',
    staffName: 'Rohan Malhotra',
    module: 'Rentals',
    action: 'KYC Verified',
    recordLabel: 'RNT-2026-412',
    recordHref: '/admin/rentals/rnt-2',
    changesSummary: 'KYC Status: Pending → Approved · Assigned RU-OXY-001',
  },
];

export async function listStaff(): Promise<StaffMember[]> {
  await mockDelay(100);
  return structuredClone(staffStore);
}

export async function saveStaffMember(
  member: Omit<StaffMember, 'id' | 'lastLoginAt' | 'roleName'> & { id?: string }
): Promise<StaffMember[]> {
  await mockDelay(140);
  const role = rolesStore.find((r) => r.id === member.roleId);
  const roleName = role?.name || 'Staff';

  if (member.id) {
    staffStore = staffStore.map((s) =>
      s.id === member.id ? { ...s, ...member, roleName } : s
    );
  } else {
    staffStore.unshift({
      ...member,
      id: `usr-${Date.now()}`,
      roleName,
      lastLoginAt: new Date().toISOString(),
    });
  }
  return listStaff();
}

export async function toggleStaffActive(id: string): Promise<StaffMember[]> {
  await mockDelay(110);
  staffStore = staffStore.map((s) =>
    s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
  );
  return listStaff();
}

export async function resetStaffPassword(id: string): Promise<string> {
  await mockDelay(140);
  const target = staffStore.find((s) => s.id === id);
  if (!target) throw new Error('Staff member not found');
  return `Password reset link sent to ${target.email}`;
}

export async function listRoles(): Promise<RoleDefinition[]> {
  await mockDelay(100);
  return structuredClone(rolesStore);
}

export async function saveRoleDefinition(
  role: Omit<RoleDefinition, 'id' | 'isDefault'> & { id?: string }
): Promise<RoleDefinition[]> {
  await mockDelay(150);
  if (role.id) {
    rolesStore = rolesStore.map((r) => (r.id === role.id ? { ...r, ...role } : r));
  } else {
    rolesStore.push({ ...role, id: `role-${Date.now()}`, isDefault: false });
  }
  return listRoles();
}

export async function listActivityLogs(filters?: {
  staffId?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActivityLogEntry[]> {
  await mockDelay(110);
  let list = [...activityStore];
  if (filters?.staffId && filters.staffId !== 'all') {
    list = list.filter((a) => a.staffId === filters.staffId);
  }
  if (filters?.module && filters.module !== 'all') {
    list = list.filter((a) => a.module === filters.module);
  }
  if (filters?.dateFrom) {
    list = list.filter((a) => a.timestamp.slice(0, 10) >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    list = list.filter((a) => a.timestamp.slice(0, 10) <= filters.dateTo!);
  }
  return structuredClone(list);
}
