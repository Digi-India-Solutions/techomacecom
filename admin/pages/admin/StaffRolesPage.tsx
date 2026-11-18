import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
} from 'lucide-react';
import type {
  RoleDefinition,
  RolePermissionMatrix,
  StaffMember,
} from '@/types/admin';
import {
  deleteRoleDefinition,
  listRoles,
  listStaff,
  MATRIX_ACTIONS,
  MATRIX_MODULES,
  resetStaffPassword,
  saveRoleDefinition,
  saveStaffMember,
  toggleStaffActive,
} from '@/lib/api/admin/staff';
import { changeAdminPassword, PASSWORD_HINT } from '@/lib/api/admin/auth';
import { formatDateTime } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Drawer } from '@/components/admin/Drawer';
import { FormField, inputClass, selectClass } from '@/components/admin/FormField';

type StaffTabKey = 'staff' | 'roles' | 'profile';

function emptyMatrix(): RolePermissionMatrix {
  const m = {} as RolePermissionMatrix;
  MATRIX_MODULES.forEach((mod) => {
    m[mod.key] = { view: false, create: false, edit: false, delete: false, export: false };
  });
  return m;
}

export function StaffRolesPage() {
  const { user, updateProfile, can, reload } = useAuth();
  const canCreate = can('staff.create');
  const canEdit = can('staff.edit');
  const canDelete = can('staff.delete');

  const errorToast = (title: string, err: unknown) =>
    showToast({ title, description: err instanceof Error ? err.message : 'Please try again', variant: 'error' });
  const { showToast } = useToast();

  const [tab, setTab] = useState<StaffTabKey>('staff');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff drawer
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | undefined>(undefined);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [staffDept, setStaffDept] = useState('');
  const [staffStatus, setStaffStatus] = useState<'active' | 'inactive'>('active');

  // Role matrix drawer
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | undefined>(undefined);
  const [roleName, setRoleName] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleMatrix, setRoleMatrix] = useState<RolePermissionMatrix>(emptyMatrix());
  const [roleLocked, setRoleLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // My Profile tab state
  const [myName, setMyName] = useState(user?.name || '');
  const [myPhone, setMyPhone] = useState(user?.phone || '');
  const [myDept, setMyDept] = useState(user?.department || '');
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [sRows, rRows] = await Promise.all([listStaff(), listRoles()]);
      setStaff(sRows);
      setRoles(rRows);
    } catch (err) {
      errorToast('Could not load staff & roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNewStaff = () => {
    setEditingStaffId(undefined);
    setStaffName('');
    setStaffEmail('');
    setStaffMobile('');
    setStaffRoleId(roles.find((r) => r.key === 'staff')?.id || roles[0]?.id || '');
    setStaffDept('Operations');
    setStaffStatus('active');
    setStaffDrawerOpen(true);
  };

  const openEditStaff = (m: StaffMember) => {
    setEditingStaffId(m.id);
    setStaffName(m.name);
    setStaffEmail(m.email);
    setStaffMobile(m.mobile);
    setStaffRoleId(m.roleId);
    setStaffDept(m.department);
    setStaffStatus(m.status);
    setStaffDrawerOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveStaffMember({
        id: editingStaffId,
        name: staffName,
        email: staffEmail,
        mobile: staffMobile,
        roleId: staffRoleId,
        department: staffDept,
        status: staffStatus,
      });
      setStaff(res.list);
      setStaffDrawerOpen(false);
      showToast({
        title: editingStaffId ? 'Staff account updated' : 'Staff member added',
        // inviteUrl only comes back in development when the email could not be sent
        description: res.inviteUrl ? `${res.message}. Invite link: ${res.inviteUrl}` : res.message,
        variant: 'success',
      });
      if (editingStaffId === user?.id) await reload();
    } catch (err) {
      errorToast('Could not save staff member', err);
    } finally {
      setSaving(false);
    }
  };

  const openNewRole = () => {
    setEditingRoleId(undefined);
    setRoleName('');
    setRoleKey('');
    setRoleDesc('');
    setRoleMatrix(emptyMatrix());
    setRoleLocked(false);
    setRoleDrawerOpen(true);
  };

  const openEditRole = (r: RoleDefinition) => {
    setEditingRoleId(r.id);
    setRoleName(r.name);
    setRoleKey(r.key);
    setRoleDesc(r.description);
    setRoleMatrix(structuredClone(r.matrix));
    setRoleLocked(Boolean(r.isLocked));
    setRoleDrawerOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await saveRoleDefinition({
        id: editingRoleId,
        name: roleName,
        key: roleKey || roleName.toLowerCase().replace(/\s+/g, '_'),
        description: roleDesc,
        matrix: roleMatrix,
      });
      setRoles(next);
      setRoleDrawerOpen(false);
      showToast({
        title: editingRoleId ? 'Role permissions updated' : 'Custom role created',
        description: 'Staff with this role get the new permissions on their next action.',
        variant: 'success',
      });
      // If this is my own role, refresh what I can see
      await reload();
    } catch (err) {
      errorToast('Could not save role', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (r: RoleDefinition) => {
    if (!window.confirm(`Delete the "${r.name}" role? This cannot be undone.`)) return;
    try {
      setRoles(await deleteRoleDefinition(r.id));
      showToast({ title: `Role "${r.name}" deleted`, variant: 'success' });
    } catch (err) {
      errorToast('Could not delete role', err);
    }
  };

  const staffColumns: DataTableColumn<StaffMember>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Staff Member',
        sortable: true,
        sortValue: (s) => s.name,
        render: (s) => (
          <div>
            <p className="text-sm font-semibold text-[#12263F] flex items-center gap-1.5 flex-wrap">
              {s.name}
              {s.id === user?.id && <span className="rounded bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-semibold text-[#1D5FAF]">You</span>}
              {s.passwordSet === false && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Invite pending</span>
              )}
              {s.lockedUntil && (
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Locked</span>
              )}
            </p>
            <p className="text-xs text-[#5B6B82]">
              {s.email} · {s.mobile}
            </p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role & Department',
        render: (s) => (
          <div className="text-xs">
            <span className="rounded bg-[#EAF2FC] px-2 py-0.5 font-semibold text-[#1D5FAF]">
              {s.roleName}
            </span>
            <p className="mt-1 text-[#5B6B82]">{s.department}</p>
          </div>
        ),
      },
      {
        key: 'lastLoginAt',
        header: 'Last Login',
        sortable: true,
        sortValue: (s) => s.lastLoginAt,
        render: (s) => (
          <span className="text-xs text-[#5B6B82] tabular-nums">
            {formatDateTime(s.lastLoginAt)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (s) => <StatusBadge status={s.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (s) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await resetStaffPassword(s.id);
                  showToast({
                    title: s.passwordSet === false ? 'Invite re-sent' : 'Password reset sent',
                    description: res.resetUrl ? `${res.message}. Link: ${res.resetUrl}` : res.message,
                    variant: 'info',
                  });
                } catch (err) {
                  errorToast('Could not send reset link', err);
                }
              }}
              disabled={!canEdit}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send password reset"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#5B6B82]" />
              Reset
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setStaff(await toggleStaffActive(s.id));
                  showToast({
                    title: s.status === 'active' ? `${s.name} deactivated` : `${s.name} activated`,
                    description: s.status === 'active' ? 'They have been signed out of every device.' : undefined,
                    variant: 'success',
                  });
                } catch (err) {
                  errorToast('Could not change status', err);
                }
              }}
              disabled={!canEdit || s.id === user?.id}
              className="rounded-lg border border-[#DCE6F2] bg-white p-1.5 text-[#5B6B82] hover:bg-[#EAF2FC] disabled:opacity-40 disabled:cursor-not-allowed"
              title={s.status === 'active' ? 'Deactivate' : 'Activate'}
            >
              {s.status === 'active' ? (
                <UserX className="h-3.5 w-3.5 text-red-600" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => openEditStaff(s)}
              disabled={!canEdit}
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, user?.id]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">
            Staff &amp; Roles
          </h1>
          <p className="mt-0.5 text-sm text-[#5B6B82]">
            Manage team accounts, configure granular module permissions, and update your profile.
          </p>
        </div>

        {tab === 'staff' && canCreate && (
          <button
            type="button"
            onClick={openNewStaff}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
          >
            <Plus className="h-4 w-4" />
            Add Staff Member
          </button>
        )}
        {tab === 'roles' && canCreate && (
          <button
            type="button"
            onClick={openNewRole}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
          >
            <Plus className="h-4 w-4" />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[#DCE6F2] bg-white p-1.5 w-fit">
        {[
          { key: 'staff' as const, label: 'Staff Members', icon: UserCheck },
          { key: 'roles' as const, label: 'Roles & Permission Matrix', icon: ShieldCheck },
          { key: 'profile' as const, label: 'My Profile', icon: UserCog },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[#1D5FAF] text-white'
                  : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'staff' && (
        <DataTable
          data={staff}
          columns={staffColumns}
          getRowId={(s) => s.id}
          loading={loading}
          searchKeys={(s) => `${s.name} ${s.email} ${s.roleName} ${s.department}`}
          searchPlaceholder="Search staff name, email, role..."
        />
      )}

      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r) => {
            const totalAllowed = MATRIX_MODULES.reduce(
              (acc, mod) =>
                acc +
                MATRIX_ACTIONS.filter((act) => r.matrix[mod.key]?.[act.key]).length,
              0
            );
            return (
              <div
                key={r.id}
                className="rounded-xl border border-[#DCE6F2] bg-white p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[#12263F]">{r.name}</h3>
                    <div className="flex items-center gap-1">
                      {r.isLocked && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#0B2545] px-2 py-0.5 text-[10px] font-semibold text-white">
                          <Lock className="h-3 w-3" /> Full access
                        </span>
                      )}
                      {r.isDefault && (
                        <span className="rounded bg-[#EAF2FC] px-2 py-0.5 text-[10px] font-semibold text-[#1D5FAF]">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-[#5B6B82]">{r.description}</p>
                  <p className="mt-3 text-xs font-semibold text-[#12263F] tabular-nums">
                    {totalAllowed} / {MATRIX_MODULES.length * MATRIX_ACTIONS.length} permissions enabled
                  </p>
                  <p className="mt-0.5 text-xs text-[#5B6B82] tabular-nums">
                    {r.staffCount ?? 0} staff member{r.staffCount === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditRole(r)}
                    className="flex-1 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3.5 py-2 text-xs font-semibold text-[#1D5FAF] hover:bg-[#EAF2FC]"
                  >
                    {canEdit && !r.isLocked ? 'Edit Permission Matrix' : 'View Permissions'}
                  </button>
                  {canDelete && !r.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(r)}
                      disabled={(r.staffCount ?? 0) > 0}
                      title={(r.staffCount ?? 0) > 0 ? 'Move its staff to another role first' : 'Delete role'}
                      className="rounded-lg border border-[#DCE6F2] bg-white px-2.5 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Delete role ${r.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateProfile({ name: myName, phone: myPhone, department: myDept });
                showToast({ title: 'My Profile updated', variant: 'success' });
              } catch (err) {
                errorToast('Could not update profile', err);
              }
            }}
            className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-[#12263F]">My Profile Details</h2>
            <FormField label="Full Name" required>
              <input
                type="text"
                required
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Email">
              <input type="email" disabled value={user?.email || ''} className={inputClass} />
            </FormField>
            <FormField label="Phone">
              <input
                type="text"
                value={myPhone}
                onChange={(e) => setMyPhone(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Department">
              <input
                type="text"
                value={myDept}
                onChange={(e) => setMyDept(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <button
              type="submit"
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
            >
              Save Profile
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await changeAdminPassword({
                  currentPassword: currPwd,
                  newPassword: newPwd,
                });
                setCurrPwd('');
                setNewPwd('');
                showToast({ title: 'Password updated', description: res.message, variant: 'success' });
              } catch (err) {
                showToast({
                  title: 'Failed to update password',
                  description: err instanceof Error ? err.message : 'Check password',
                  variant: 'error',
                });
              }
            }}
            className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4 h-fit"
          >
            <h2 className="text-base font-semibold text-[#12263F]">Change Password</h2>
            <FormField label="Current Password" required>
              <input
                type="password"
                required
                value={currPwd}
                onChange={(e) => setCurrPwd(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="New Password" required hint={PASSWORD_HINT}>
              <input
                type="password"
                required
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <button
              type="submit"
              className="rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#143766]"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* Staff Add/Edit Drawer */}
      <Drawer
        open={staffDrawerOpen}
        onClose={() => setStaffDrawerOpen(false)}
        title={editingStaffId ? 'Edit Staff Account' : 'Add Staff Member'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <FormField label="Full Name" required>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Work Email" required>
            <input
              type="email"
              required
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Mobile Number" required>
            <input
              type="text"
              required
              value={staffMobile}
              onChange={(e) => setStaffMobile(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Assigned Role" required>
            <select
              value={staffRoleId}
              onChange={(e) => setStaffRoleId(e.target.value)}
              className={selectClass}
              disabled={editingStaffId === user?.id}
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department" required>
            <input
              type="text"
              required
              value={staffDept}
              onChange={(e) => setStaffDept(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Account Status">
            <select
              value={staffStatus}
              onChange={(e) => setStaffStatus(e.target.value as 'active' | 'inactive')}
              className={selectClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          {!editingStaffId && (
            <p className="rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] px-3 py-2 text-xs text-[#5B6B82]">
              We email an invite link to this address so they can set their own password.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE6F2]">
            <button
              type="button"
              onClick={() => setStaffDrawerOpen(false)}
              className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingStaffId ? 'Save Staff' : 'Add & Send Invite'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Role Permission Matrix Drawer */}
      <Drawer
        open={roleDrawerOpen}
        onClose={() => setRoleDrawerOpen(false)}
        title={editingRoleId ? `Permissions: ${roleName}` : 'Create Custom Role'}
        widthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Role Name" required>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Description" required>
              <input
                type="text"
                required
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

          {roleLocked && (
            <p className="flex items-center gap-2 rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-2 text-xs text-[#5B6B82]">
              <Lock className="h-3.5 w-3.5 text-[#0B2545]" />
              Super Admin always has every permission, including new modules. Only the name and description can change.
            </p>
          )}
          <div className="overflow-x-auto rounded-xl border border-[#DCE6F2]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] font-semibold text-[#5B6B82]">
                  <th className="px-3.5 py-2.5">Module</th>
                  {MATRIX_ACTIONS.map((act) => (
                    <th key={act.key} className="px-3 py-2.5 text-center">
                      {act.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F2]">
                {MATRIX_MODULES.map((mod) => (
                  <tr key={mod.key} className="hover:bg-[#F6F9FD]">
                    <td className="px-3.5 py-2 font-medium text-[#12263F]">{mod.label}</td>
                    {MATRIX_ACTIONS.map((act) => {
                      const checked = Boolean(roleMatrix[mod.key]?.[act.key]);
                      return (
                        <td key={act.key} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setRoleMatrix((prev) => ({
                                ...prev,
                                [mod.key]: {
                                  ...prev[mod.key],
                                  [act.key]: e.target.checked,
                                },
                              }))
                            }
                            aria-label={`${mod.label} ${act.label}`}
                            disabled={roleLocked || (editingRoleId ? !canEdit : !canCreate)}
                            className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE6F2]">
            <button
              type="button"
              onClick={() => setRoleDrawerOpen(false)}
              className="rounded-lg border border-[#DCE6F2] px-4 py-2 text-xs font-semibold text-[#12263F]"
            >
              Cancel
            </button>
            {(editingRoleId ? canEdit : canCreate) && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Role Matrix'}
              </button>
            )}
          </div>
        </form>
      </Drawer>
    </div>
  );
}
