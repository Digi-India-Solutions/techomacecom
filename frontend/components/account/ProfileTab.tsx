'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Check, Loader2, Pencil, Smartphone, X } from 'lucide-react';
import type { User } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { sendAddMobileOtp, updateCustomerProfile, verifyAddMobileOtp, type CustomerType } from '@/lib/api/customerAuth';
import { errorMessage } from '@/lib/api/backend';
import { formatMobile, normalizeMobile } from '@/lib/india';
import { apiFieldErrors, btnPrimary, btnSecondary, CUSTOMER_TYPE_LABEL, Field, inputClass, linkButton, SectionHeader } from './ui';

const TYPES = Object.keys(CUSTOMER_TYPE_LABEL) as CustomerType[];
const REG_PATTERN = /^[A-Z0-9][A-Z0-9/.\- ]{1,39}$/;

type Form = { name: string; email: string; customerType: CustomerType; qualification: string; registrationNumber: string };

const fromUser = (u: User): Form => ({
  name: u.name || '',
  email: u.email || '',
  customerType: u.role,
  qualification: u.degree || '',
  registrationNumber: u.registrationNumber || '',
});

/* ── Change mobile number (OTP to the new number) ── */

function MobileSection({ user }: { user: User }) {
  const { setUser } = useUserStore();
  const { addToast } = useToastStore();
  const [editing, setEditing] = useState(!user.phone);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const reset = () => {
    setEditing(!user.phone);
    setMobile('');
    setOtp('');
    setSentTo(null);
    setDevOtp('');
    setError('');
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalized = normalizeMobile(mobile);
    if (!normalized) return setError('Enter a valid 10-digit Indian mobile number');
    if (normalized === user.phone) return setError('This is already your mobile number');
    setBusy(true);
    setError('');
    try {
      const res = await sendAddMobileOtp(normalized);
      setSentTo(normalized);
      setDevOtp(res.devOtp || '');
      setResendIn(res.resendAfterSeconds || 30);
      setOtp('');
      addToast({ type: 'info', title: 'OTP sent', message: `Enter the 6-digit code sent to ${formatMobile(normalized)}.` });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentTo) return;
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP');
    setBusy(true);
    setError('');
    try {
      setUser(await verifyAddMobileOtp(sentTo, otp));
      addToast({ type: 'success', title: 'Mobile number verified', message: `${formatMobile(sentTo)} is now on your account.` });
      setEditing(false);
      setMobile('');
      setOtp('');
      setSentTo(null);
      setDevOtp('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#DCE6F2] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-[#EAF2FC] text-[#1D5FAF] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-[#12263F]">Mobile number</p>
            {user.phone ? (
              <p className="text-[14px] text-[#12263F] mt-0.5 flex items-center gap-1.5">
                {formatMobile(user.phone)}
                {user.mobileVerified && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#16A34A]">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </p>
            ) : (
              <p className="text-[13px] text-[#B45309] mt-0.5">Add a mobile number — needed for delivery updates, rentals and OTP sign-in.</p>
            )}
            <p className="text-[12px] text-[#8A97A8] mt-1">Used to sign in with OTP and for delivery and rental updates.</p>
          </div>
        </div>
        {user.phone && !editing && (
          <button type="button" onClick={() => setEditing(true)} className={`${btnSecondary} !py-2 !text-[13px]`}>
            <Pencil className="w-3.5 h-3.5" /> Change
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-[#EEF2F7]">
          {!sentTo ? (
            <form onSubmit={send} className="flex flex-col sm:flex-row sm:items-start gap-3" noValidate>
              <div className="flex-1 max-w-xs">
                <label htmlFor="mob-new" className="sr-only">
                  New mobile number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#D5DEEA] bg-[#F6F9FD] text-[14px] text-[#5B6B82]">+91</span>
                  <input
                    id="mob-new"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={user.phone ? 'New mobile number' : '10-digit mobile number'}
                    value={mobile}
                    maxLength={14}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      setError('');
                    }}
                    className={`${inputClass} !rounded-l-none`}
                  />
                </div>
                {error && <p className="mt-1 text-[12px] text-[#DC2626]" role="alert">{error}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" disabled={busy} className={btnPrimary}>
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send OTP
                </button>
                {user.phone && (
                  <button type="button" onClick={reset} className={btnSecondary}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-3" noValidate>
              <p className="text-[13px] text-[#5B6B82]">
                Enter the code sent to <strong className="text-[#12263F]">{formatMobile(sentTo)}</strong>.{' '}
                <button type="button" className={linkButton} onClick={() => setSentTo(null)}>
                  Change number
                </button>
              </p>
              {devOtp && process.env.NODE_ENV !== 'production' && (
                <p className="text-[12px] text-[#5B6B82] bg-[#FFF7ED] border border-[#FED7AA] rounded-lg px-3 py-2">
                  Development: your OTP is <strong className="font-mono tracking-wider">{devOtp}</strong>
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="max-w-[200px]">
                  <label htmlFor="mob-otp" className="sr-only">
                    OTP
                  </label>
                  <input
                    id="mob-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={`${inputClass} font-mono tracking-[0.3em]`}
                  />
                  {error && <p className="mt-1 text-[12px] text-[#DC2626]" role="alert">{error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={busy || otp.length !== 6} className={btnPrimary}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Verify &amp; save
                  </button>
                  <button type="button" onClick={reset} className={btnSecondary} aria-label="Cancel">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button type="button" disabled={resendIn > 0 || busy} onClick={() => send()} className={linkButton}>
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Profile form ── */

export default function ProfileTab({ user }: { user: User }) {
  const { setUser } = useUserStore();
  const { addToast } = useToastStore();
  // Only these fields reset the form — a photo upload must not wipe unsaved edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => fromUser(user), [user.name, user.email, user.role, user.degree, user.registrationNumber]);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reload the form when the saved profile changes (e.g. after saving)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setForm(initial);
  }

  // The email is a sign-in id for Google and email + password accounts — the API refuses to change it
  const emailLocked = Boolean(user.email && (user.hasGoogle || user.hasPassword));
  const dirty = (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== initial[k]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = 'Name must be at least 2 characters';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (!form.email.trim() && !user.phone) er.email = 'Add a mobile number before removing your email';
    if (form.registrationNumber.trim() && !REG_PATTERN.test(form.registrationNumber.trim())) {
      er.registrationNumber = 'Use letters, numbers, / . or - only';
    }
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const updated = await updateCustomerProfile({
        name: form.name.trim(),
        customerType: form.customerType,
        qualification: form.qualification.trim(),
        registrationNumber: form.registrationNumber.trim(),
        ...(emailLocked ? {} : { email: form.email.trim() }),
      });
      setUser(updated);
      addToast({ type: 'success', title: 'Profile updated', message: 'Your details have been saved.' });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      addToast({ type: 'error', title: 'Could not save profile', message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHeader title="Profile" subtitle="Your details appear on quotations and invoices." />

      <div className="max-w-2xl space-y-6">
        <MobileSection key={user.phone || 'none'} user={user} />

        <form onSubmit={onSubmit} noValidate>
          <fieldset className="mb-5">
            <legend className="text-[13px] font-semibold text-[#12263F] mb-2">I am buying as</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('customerType', t)}
                  aria-pressed={form.customerType === t}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-colors cursor-pointer ${
                    form.customerType === t ? 'bg-[#1D5FAF] border-[#1D5FAF] text-white' : 'bg-white border-[#D5DEEA] text-[#12263F] hover:border-[#9DB4D3]'
                  }`}
                >
                  {CUSTOMER_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field label="Full name" htmlFor="pf-name" required error={errors.name}>
                <input
                  id="pf-name"
                  value={form.name}
                  maxLength={120}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                  placeholder="e.g. Dr. Ananya Sharma"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Email"
                htmlFor="pf-email"
                error={errors.email}
                hint={
                  emailLocked ? (
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-[#16A34A]" />{' '}
                      {user.hasGoogle ? 'Linked to your Google sign-in' : 'Your verified sign-in email'}, so it can&rsquo;t be changed here.
                    </span>
                  ) : (
                    'Order confirmations and GST invoices are emailed here.'
                  )
                }
              >
                <input
                  id="pf-email"
                  type="email"
                  value={form.email}
                  maxLength={200}
                  disabled={emailLocked}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                  placeholder="you@clinic.com"
                />
              </Field>
            </div>
            <Field label="Qualification" htmlFor="pf-degree" error={errors.qualification} hint="e.g. BDS, MDS (Prosthodontics)">
              <input
                id="pf-degree"
                value={form.qualification}
                maxLength={120}
                onChange={(e) => set('qualification', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Council registration no."
              htmlFor="pf-reg"
              error={errors.registrationNumber}
              hint="Dental / Medical Council number — shows the Registered practitioner badge"
            >
              <input
                id="pf-reg"
                value={form.registrationNumber}
                maxLength={40}
                onChange={(e) => set('registrationNumber', e.target.value.toUpperCase())}
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-7 pt-5 border-t border-[#E8EEF5]">
            <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {dirty && !saving && (
              <button
                type="button"
                onClick={() => {
                  setForm(initial);
                  setErrors({});
                }}
                className="text-[14px] font-semibold text-[#5B6B82] hover:text-[#12263F] cursor-pointer"
              >
                Discard changes
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
