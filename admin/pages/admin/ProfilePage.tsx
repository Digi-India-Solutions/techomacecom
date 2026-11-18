import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Building2,
  Calendar,
  Camera,
  Check,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  Minus,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  UserCog,
} from 'lucide-react';
import type { DeviceSession, MyActivityEntry } from '@/types/admin';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { Avatar } from '@/components/admin/Avatar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { FormField, inputClass } from '@/components/admin/FormField';
import { AdminApiError, formatDateTime, formatShortDate, type ListMeta } from '@/lib/api/admin/client';
import {
  changeAdminPassword,
  isStrongPassword,
  listMyActivity,
  listMySessions,
  PASSWORD_HINT,
  removeAdminAvatar,
  signOutDevice,
  signOutOtherDevices,
  uploadAdminAvatar,
} from '@/lib/api/admin/auth';
import { MATRIX_ACTIONS, MATRIX_MODULES } from '@/lib/api/admin/staff';
import { formatMobile, timeAgo } from '@/lib/time';

type TabKey = 'profile' | 'security' | 'access' | 'activity';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile', label: 'Profile details', icon: UserCog },
  { key: 'security', label: 'Password & devices', icon: KeyRound },
  { key: 'access', label: 'Role & permissions', icon: ShieldCheck },
  { key: 'activity', label: 'My activity', icon: Activity },
];

const MAX_PHOTO_MB = 10;
const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

const card = 'rounded-xl border border-[#DCE6F2] bg-white';
const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC] disabled:cursor-not-allowed disabled:opacity-50';

function errorText(err: unknown, fallback = 'Please try again'): string {
  return err instanceof Error ? err.message : fallback;
}

function fieldErrors(err: unknown): Record<string, string> {
  return err instanceof AdminApiError && err.fields ? err.fields : {};
}

// ---------------------------------------------------------------------------

export function ProfilePage() {
  const { user, permissions } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as TabKey | null;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : 'profile';

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12263F]">My Profile</h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">Your account details, password, signed-in devices and access.</p>
      </div>

      <IdentityCard />

      <div className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE6F2] bg-white p-1.5 sm:w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setParams(t.key === 'profile' ? {} : { tab: t.key }, { replace: true })}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? 'bg-[#1D5FAF] text-white' : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profile' && <DetailsTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'access' && <AccessTab permissions={permissions} />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identity card — photo, name, role, key dates
// ---------------------------------------------------------------------------

function IdentityCard() {
  const { user, applySession } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);

  if (!user) return null;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      showToast({ title: 'Photo too large', description: `Choose an image under ${MAX_PHOTO_MB} MB.`, variant: 'error' });
      return;
    }
    setBusy('upload');
    try {
      applySession(await uploadAdminAvatar(file));
      showToast({ title: 'Profile photo updated', variant: 'success' });
    } catch (err) {
      showToast({ title: 'Could not upload photo', description: errorText(err), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const onRemove = async () => {
    setBusy('remove');
    try {
      applySession(await removeAdminAvatar());
      showToast({ title: 'Profile photo removed', variant: 'success' });
    } catch (err) {
      showToast({ title: 'Could not remove photo', description: errorText(err), variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const facts = [
    { icon: Calendar, label: 'Member since', value: user.createdAt ? formatShortDate(user.createdAt) : '—' },
    { icon: Clock, label: 'Last sign-in', value: user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'First session', title: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : undefined },
    {
      icon: KeyRound,
      label: 'Password changed',
      value: user.passwordChangedAt ? timeAgo(user.passwordChangedAt) : 'Not yet',
      title: user.passwordChangedAt ? formatDateTime(user.passwordChangedAt) : undefined,
    },
  ];

  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative">
            <Avatar name={user.name} initials={user.avatarInitials} url={user.avatarUrl} className="h-20 w-20 text-2xl" rounded="rounded-2xl" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy !== null}
              className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1D5FAF] text-white shadow hover:bg-[#174D8F] disabled:opacity-60"
              aria-label="Change profile photo"
              title="Change profile photo"
            >
              {busy === 'upload' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept={PHOTO_TYPES} className="hidden" onChange={onPick} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-[#12263F]">{user.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-md border border-[#1D5FAF]/25 bg-[#EAF2FC] px-2 py-0.5 text-[11px] font-semibold text-[#1D5FAF]">
                <ShieldCheck className="h-3 w-3" />
                {user.roleLabel}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                  user.status === 'inactive' ? 'border-[#DCE6F2] bg-slate-100 text-[#5B6B82]' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {user.status === 'inactive' ? 'Inactive' : 'Active'}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B6B82]">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {formatMobile(user.phone)}
                </span>
              )}
              {user.department && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {user.department}
                </span>
              )}
            </div>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={onRemove}
                disabled={busy !== null}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B6B82] hover:text-red-600 disabled:opacity-50"
              >
                {busy === 'remove' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remove photo
              </button>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 md:w-auto md:min-w-[420px]">
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] px-3 py-2.5" title={f.title}>
                <dt className="flex items-center gap-1.5 text-[11px] font-medium text-[#5B6B82]">
                  <Icon className="h-3.5 w-3.5" />
                  {f.label}
                </dt>
                <dd className="mt-1 truncate text-sm font-semibold text-[#12263F]">{f.value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Profile details
// ---------------------------------------------------------------------------

function DetailsTab() {
  const { user, updateProfile, can } = useAuth();
  const { showToast } = useToast();
  const initial = useMemo(
    () => ({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' }),
    [user?.name, user?.phone, user?.department]
  );
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reload the form when the saved profile changes (e.g. after saving)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setForm(initial);
  }

  if (!user) return null;

  const dirty = form.name !== initial.name || form.phone !== initial.phone || form.department !== initial.department;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key === 'phone' ? 'mobile' : key]: '' }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    const digits = form.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    if (form.phone.trim() && !/^[6-9]\d{9}$/.test(digits)) next.mobile = 'Enter a valid 10-digit Indian mobile number';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim(), department: form.department.trim() });
      showToast({ title: 'Profile updated', variant: 'success' });
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast({ title: 'Could not update profile', description: errorText(err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const accountRows = [
    { label: 'Staff ID', value: `#${user.id}` },
    { label: 'Role', value: user.roleLabel },
    { label: 'Status', value: user.status === 'inactive' ? 'Inactive' : 'Active' },
    { label: 'Account created', value: user.createdAt ? formatDateTime(user.createdAt) : '—' },
    { label: 'Last sign-in', value: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—' },
    { label: 'Profile last updated', value: user.updatedAt ? formatDateTime(user.updatedAt) : '—' },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={onSubmit} className={`${card} space-y-4 p-5`} noValidate>
        <div>
          <h2 className="text-base font-semibold text-[#12263F]">Personal details</h2>
          <p className="mt-0.5 text-xs text-[#5B6B82]">Shown to your team in activity logs, assignments and notes.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="pf-name" required error={errors.name}>
            <input id="pf-name" value={form.name} onChange={set('name')} className={inputClass} autoComplete="name" maxLength={120} />
          </FormField>
          <FormField
            label="Work email"
            htmlFor="pf-email"
            hint={can('staff.edit') ? 'Your sign-in email. Change it under Staff & Roles.' : 'Your sign-in email. Ask a Super Admin to change it.'}
          >
            <input id="pf-email" value={user.email} disabled className={inputClass} />
          </FormField>
          <FormField label="Mobile number" htmlFor="pf-phone" error={errors.mobile} hint="10-digit Indian mobile, used by colleagues to reach you">
            <input
              id="pf-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="98XXXXXXXX"
              className={inputClass}
              autoComplete="tel"
              maxLength={16}
            />
          </FormField>
          <FormField label="Department" htmlFor="pf-dept" error={errors.department} hint="e.g. Operations, Sales, Warehouse">
            <input id="pf-dept" value={form.department} onChange={set('department')} className={inputClass} maxLength={80} />
          </FormField>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 border-t border-[#DCE6F2] pt-4">
          <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {dirty && !saving && (
            <button
              type="button"
              onClick={() => {
                setForm(initial);
                setErrors({});
              }}
              className="text-xs font-semibold text-[#5B6B82] hover:text-[#12263F]"
            >
              Discard changes
            </button>
          )}
        </div>
      </form>

      <aside className={`${card} h-fit p-5`}>
        <h2 className="text-base font-semibold text-[#12263F]">Account</h2>
        <dl className="mt-3 divide-y divide-[#DCE6F2] text-xs">
          {accountRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-[#5B6B82]">{r.label}</dt>
              <dd className="text-right font-semibold text-[#12263F]">{r.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password & signed-in devices
// ---------------------------------------------------------------------------

function PasswordRule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-emerald-700' : 'text-[#5B6B82]'}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      {children}
    </li>
  );
}

function ChangePasswordCard({ onChanged }: { onChanged: () => void }) {
  const { reload } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rules = { length: next.length >= 8, letter: /[A-Za-z]/.test(next), number: /\d/.test(next) };
  const strength = Object.values(rules).filter(Boolean).length + (next.length >= 12 ? 1 : 0) + (/[^A-Za-z0-9]/.test(next) ? 1 : 0);
  const strengthLabel = !next ? '' : strength <= 2 ? 'Weak' : strength === 3 ? 'Okay' : strength === 4 ? 'Good' : 'Strong';
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-[#F28C38]' : 'bg-emerald-500';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!current) er.currentPassword = 'Enter your current password';
    if (!isStrongPassword(next)) er.newPassword = PASSWORD_HINT;
    else if (next === current) er.newPassword = 'Choose a password different from your current one';
    if (confirm !== next) er.confirm = 'Passwords do not match';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const res = await changeAdminPassword({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      showToast({ title: 'Password updated', description: res.message, variant: 'success' });
      await reload();
      onChanged();
    } catch (err) {
      setErrors(fieldErrors(err));
      showToast({ title: 'Could not update password', description: errorText(err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <form onSubmit={onSubmit} className={`${card} h-fit space-y-4 p-5`} noValidate>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#12263F]">Change password</h2>
          <p className="mt-0.5 text-xs text-[#5B6B82]">Every other device is signed out when you change it.</p>
        </div>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D5FAF] hover:underline"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      <FormField label="Current password" htmlFor="pw-current" required error={errors.currentPassword}>
        <input id="pw-current" type={type} value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} autoComplete="current-password" />
      </FormField>
      <FormField label="New password" htmlFor="pw-new" required error={errors.newPassword}>
        <input id="pw-new" type={type} value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} autoComplete="new-password" maxLength={128} />
      </FormField>
      {next && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#DCE6F2]">
              <div className={`h-full rounded-full transition-all ${strengthColor}`} style={{ width: `${Math.min(100, (strength / 5) * 100)}%` }} />
            </div>
            <span className="w-12 text-right text-[11px] font-semibold text-[#5B6B82]">{strengthLabel}</span>
          </div>
          <ul className="grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-3">
            <PasswordRule ok={rules.length}>8+ characters</PasswordRule>
            <PasswordRule ok={rules.letter}>A letter</PasswordRule>
            <PasswordRule ok={rules.number}>A number</PasswordRule>
          </ul>
        </div>
      )}
      <FormField label="Confirm new password" htmlFor="pw-confirm" required error={errors.confirm}>
        <input id="pw-confirm" type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" maxLength={128} />
      </FormField>
      <div className="border-t border-[#DCE6F2] pt-4">
        <button type="submit" disabled={saving || !current || !next || !confirm} className={btnPrimary}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}

const DEVICE_ICON = { desktop: Laptop, mobile: Smartphone, tablet: Tablet } as const;

function DevicesCard({ version }: { version: number }) {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [allBusy, setAllBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await listMySessions());
    } catch (err) {
      showToast({ title: 'Could not load devices', description: errorText(err), variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load, version]);

  const others = (sessions || []).filter((s) => !s.current);

  const onSignOut = async (s: DeviceSession) => {
    setBusyId(s.id);
    try {
      const res = await signOutDevice(s.id);
      setSessions((list) => (list || []).filter((x) => x.id !== s.id));
      showToast({ title: 'Device signed out', description: res.message, variant: 'success' });
    } catch (err) {
      showToast({ title: 'Could not sign out device', description: errorText(err), variant: 'error' });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const onSignOutAll = async () => {
    setAllBusy(true);
    try {
      const res = await signOutOtherDevices();
      showToast({ title: 'Other devices signed out', description: res.message, variant: 'success' });
      setConfirmAll(false);
      load();
    } catch (err) {
      showToast({ title: 'Could not sign out devices', description: errorText(err), variant: 'error' });
    } finally {
      setAllBusy(false);
    }
  };

  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#12263F]">Signed-in devices</h2>
          <p className="mt-0.5 text-xs text-[#5B6B82]">Browsers where your account is signed in. Sign out any you don&rsquo;t recognise.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} disabled={loading} className={btnSecondary} aria-label="Refresh devices" title="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {others.length > 0 && (
            <button type="button" onClick={() => setConfirmAll(true)} className={`${btnSecondary} text-red-600 hover:bg-red-50`}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out all others
            </button>
          )}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-[#DCE6F2] rounded-lg border border-[#DCE6F2]">
        {loading && !sessions
          ? Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <span className="h-9 w-9 animate-pulse rounded-lg bg-[#EAF2FC]" />
                <span className="flex-1 space-y-1.5">
                  <span className="block h-3 w-40 animate-pulse rounded bg-[#EAF2FC]" />
                  <span className="block h-2.5 w-56 animate-pulse rounded bg-[#F6F9FD]" />
                </span>
              </li>
            ))
          : (sessions || []).map((s) => {
              const Icon = DEVICE_ICON[s.type] || Laptop;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.current ? 'bg-[#1D5FAF] text-white' : 'bg-[#EAF2FC] text-[#1D5FAF]'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#12263F]">
                      {s.label}
                      {s.current && (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-[#5B6B82]">
                      {[s.ipAddress && `IP ${s.ipAddress}`, `Active ${timeAgo(s.lastActiveAt)}`, s.rememberMe ? 'Remembered' : 'Until browser closes']
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {!s.current && (
                    <button type="button" onClick={() => onSignOut(s)} disabled={busyId === s.id} className={btnSecondary}>
                      {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Sign out
                    </button>
                  )}
                </li>
              );
            })}
      </ul>
      <p className="mt-3 text-[11px] text-[#5B6B82]">
        A signed-out device loses access as soon as its current access token expires (the API&rsquo;s ACCESS_TOKEN_EXPIRY).
      </p>

      <ConfirmDialog
        open={confirmAll}
        title="Sign out all other devices?"
        description={`${others.length} other device${others.length === 1 ? '' : 's'} will need to sign in again. This browser stays signed in.`}
        confirmLabel="Sign out others"
        variant="danger"
        loading={allBusy}
        onConfirm={onSignOutAll}
        onCancel={() => setConfirmAll(false)}
      />
    </section>
  );
}

function SecurityTab() {
  const [version, setVersion] = useState(0);
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <ChangePasswordCard onChanged={() => setVersion((v) => v + 1)} />
      <DevicesCard version={version} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role & permissions (read-only)
// ---------------------------------------------------------------------------

function AccessTab({ permissions }: { permissions: string[] }) {
  const { user, can } = useAuth();
  const granted = useMemo(() => new Set(permissions), [permissions]);
  if (!user) return null;

  const total = MATRIX_MODULES.length * MATRIX_ACTIONS.length;
  const count = MATRIX_MODULES.reduce((n, m) => n + MATRIX_ACTIONS.filter((a) => granted.has(`${m.key}.${a.key}`)).length, 0);

  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#12263F]">{user.roleLabel}</h2>
          <p className="mt-0.5 text-xs text-[#5B6B82]">
            {user.isSuperAdmin
              ? 'Super Admin always has every permission, including modules added later.'
              : `${count} of ${total} permissions. The API checks these on every request.`}
          </p>
        </div>
        {can('staff.view') ? (
          <Link to="/admin/staff" className={btnSecondary}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Open Staff &amp; Roles
          </Link>
        ) : (
          <p className="max-w-xs text-right text-[11px] text-[#5B6B82]">Need more access? Ask a Super Admin to update your role.</p>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-[#DCE6F2]">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-[#F6F9FD] text-[#5B6B82]">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Module</th>
              {MATRIX_ACTIONS.map((a) => (
                <th key={a.key} className="px-3 py-2.5 text-center font-semibold">
                  {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE6F2]">
            {MATRIX_MODULES.map((m) => {
              const any = MATRIX_ACTIONS.some((a) => granted.has(`${m.key}.${a.key}`));
              return (
                <tr key={m.key} className={any ? '' : 'text-[#5B6B82]/70'}>
                  <td className="px-4 py-2.5 font-medium text-[#12263F]">{m.label}</td>
                  {MATRIX_ACTIONS.map((a) => {
                    const ok = granted.has(`${m.key}.${a.key}`);
                    return (
                      <td key={a.key} className="px-3 py-2.5 text-center">
                        {ok ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-[#C5D2E3]" aria-label="Not allowed" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// My activity
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

function ActivityTab() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<MyActivityEntry[]>([]);
  const [meta, setMeta] = useState<ListMeta | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listMyActivity(page, PAGE_SIZE)
      .then((res) => {
        if (!alive) return;
        setRows(res.rows);
        setMeta(res.meta);
      })
      .catch((err) => showToast({ title: 'Could not load activity', description: errorText(err), variant: 'error' }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, showToast]);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#12263F]">My activity</h2>
          <p className="mt-0.5 text-xs text-[#5B6B82]">
            Everything you have done in the admin panel, newest first{meta ? ` · ${meta.total} entr${meta.total === 1 ? 'y' : 'ies'}` : ''}.
          </p>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <ul className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-lg bg-[#F6F9FD]" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Activity} title="No activity yet" description="Changes you make in the admin panel will be listed here." />
        </div>
      ) : (
        <ol className={`mt-4 divide-y divide-[#DCE6F2] rounded-lg border border-[#DCE6F2] ${loading ? 'opacity-60' : ''}`}>
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <time className="w-40 shrink-0 text-xs text-[#5B6B82] tabular-nums" dateTime={r.timestamp} title={formatDateTime(r.timestamp)}>
                {formatDateTime(r.timestamp)}
              </time>
              <span className="w-fit shrink-0 rounded-md bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1D5FAF]">
                {r.module}
              </span>
              <p className="min-w-0 flex-1 text-sm text-[#12263F]">
                {r.summary || `${r.action} ${r.recordLabel}`}
                {r.recordLabel && r.summary && <span className="text-[#5B6B82]"> · {r.recordLabel}</span>}
              </p>
              {r.ipAddress && <span className="shrink-0 text-[11px] text-[#5B6B82]">IP {r.ipAddress}</span>}
            </li>
          ))}
        </ol>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#5B6B82]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!meta?.hasPrevPage || loading} onClick={() => setPage((p) => p - 1)} className={btnSecondary}>
              Previous
            </button>
            <button type="button" disabled={!meta?.hasNextPage || loading} onClick={() => setPage((p) => p + 1)} className={btnSecondary}>
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
