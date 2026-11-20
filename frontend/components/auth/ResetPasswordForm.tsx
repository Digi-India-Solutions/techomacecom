'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, KeyRound } from 'lucide-react';
import { useToastStore, useUserStore } from '@/lib/store';
import { ApiClientError, errorMessage } from '@/lib/api/backend';
import { checkResetLink, resetPasswordWithLink } from '@/lib/api/customerAuth';
import { PasswordInput } from './CustomerAuthForm';

/**
 * /reset-password?token=… — opened from the "Reset your password" email.
 *
 *   1. reads the token, then removes it from the address bar (no leaks via history / referrer)
 *   2. asks the API whether the link is still valid (expired / used links fail up front)
 *   3. new password + confirm → API sets it, signs out other devices, signs in here
 */

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/; // same rule as the API

type State = { step: 'checking' } | { step: 'invalid'; message: string } | { step: 'form'; email: string };

export const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useUserStore();
  const { addToast } = useToastStore();

  // Read once on first render; kept in memory after the address bar is cleaned
  const [token] = useState(() => params.get('token') || '');
  const [state, setState] = useState<State>(() =>
    token ? { step: 'checking' } : { step: 'invalid', message: 'This reset link is incomplete. Please request a new one.' }
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Keep the token only in memory: strip it from the address bar / browser history
    window.history.replaceState(null, '', '/reset-password');
    let cancelled = false;
    checkResetLink(token)
      .then((res) => !cancelled && setState({ step: 'form', email: res.email }))
      .catch((err) => !cancelled && setState({ step: 'invalid', message: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!PASSWORD_RE.test(password)) next.password = 'At least 8 characters with a letter and a number';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setFormError('');
    setSaving(true);
    try {
      const user = await resetPasswordWithLink({ token, password, confirmPassword });
      login(user);
      addToast({
        type: 'success',
        title: 'Password updated',
        message: 'You are signed in. Other devices were signed out for your security.',
      });
      router.replace('/account');
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'RESET_LINK_INVALID') {
        setState({ step: 'invalid', message: err.message });
      } else {
        if (err instanceof ApiClientError && err.fields) {
          setErrors({ password: err.fields.password, confirmPassword: err.fields.confirmPassword });
        }
        setFormError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  if (state.step === 'checking') {
    return <p className="text-center text-sm text-[#5B6B82] py-6">Checking your reset link…</p>;
  }

  if (state.step === 'invalid') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-black text-[#12263F] font-heading">Link not valid</h2>
          <p className="text-xs sm:text-sm text-[#5B6B82]">{state.message}</p>
        </div>
        <Link
          href="/forgot-password"
          className="w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 font-heading"
        >
          Request a new link <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/login" className="block text-xs sm:text-sm font-bold text-[#1D5FAF] hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const checks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Za-z]/.test(password), label: 'a letter' },
    { ok: /\d/.test(password), label: 'a number' },
  ];

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center gap-2 text-sm text-[#12263F]">
        <KeyRound className="w-4 h-4 text-[#1D5FAF] shrink-0" />
        <span>
          Set a new password for <span className="font-bold">{state.email}</span>
        </span>
      </div>

      {formError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl font-medium">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="reset-password" className="block text-xs sm:text-sm font-semibold text-[#12263F] mb-1.5 font-heading">
          New password
        </label>
        <PasswordInput
          id="reset-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="Create a new password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
        />
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {checks.map((c) => (
            <span key={c.label} className={`text-[11px] font-semibold ${c.ok ? 'text-[#16A34A]' : 'text-[#5B6B82]'}`}>
              {c.ok ? '✓' : '•'} {c.label}
            </span>
          ))}
        </div>
        {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="reset-confirm" className="block text-xs sm:text-sm font-semibold text-[#12263F] mb-1.5 font-heading">
          Confirm new password
        </label>
        <PasswordInput
          id="reset-confirm"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            setErrors((e) => ({ ...e, confirmPassword: undefined }));
          }}
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword) || (confirmPassword.length > 0 && confirmPassword !== password)}
        />
        {(errors.confirmPassword || (confirmPassword.length > 0 && confirmPassword !== password)) && (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword || 'Passwords do not match'}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-heading"
      >
        {saving ? 'Saving…' : 'Set new password & sign in'}
        <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-center text-[11px] text-[#5B6B82]">For your security, other devices will be signed out.</p>
    </form>
  );
};

export default ResetPasswordForm;
