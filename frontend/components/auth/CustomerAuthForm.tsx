'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, MailCheck, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { User } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { ApiClientError, errorMessage } from '@/lib/api/backend';
import {
  requestPasswordReset,
  sendSignupEmailOtp,
  signInWithPassword,
  signUpWithEmail,
  verifySignupEmailOtp,
} from '@/lib/api/customerAuth';

/**
 * Storefront sign-in / sign-up (email + password) — used by the global AuthModal,
 * the /login and /signup pages, and rental checkout.
 *
 *   Sign up: name · email [Verify → 6-digit code emailed → Verify OTP] · mobile · password · confirm
 *            → account created and signed in straight away (no second sign-in)
 *   Sign in: email · password  (+ "Forgot password?")
 *   Forgot:  email → reset link emailed → /reset-password?token=… sets a new password
 *
 * Every rule is also enforced by the API (backend/src/modules/auth); the checks here
 * only give faster feedback.
 */

export type AuthMode = 'signin' | 'signup' | 'forgot';

const RESET_RESEND_SECONDS = 60; // matches the API's per-account cooldown

interface CustomerAuthFormProps {
  onSuccess?: (user: User, isNewUser: boolean) => void;
  initialMode?: AuthMode;
  /**
   * How "Create account" / "Sign in" switches: in place (modal, checkout) or by
   * linking to the /signup and /login pages (keeps ?next=).
   */
  switchVia?: 'inline' | 'pages';
  nextPath?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/; // same rule as the API (lib/password.js)

const inputClass =
  'w-full px-3.5 py-2.5 border border-[#DCE6F2] focus:border-[#1D5FAF] focus:ring-2 focus:ring-[#1D5FAF]/20 rounded-xl text-xs sm:text-sm font-medium text-[#12263F] outline-none transition-all disabled:bg-[#F6F9FD] disabled:text-[#5B6B82] font-body';
const errorInput = 'border-red-400 focus:border-red-500 focus:ring-red-200';
const primaryButton =
  'w-full py-2.5 sm:py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-heading';
const labelClass = 'block text-xs font-bold text-[#12263F] mb-1 font-heading';

type FieldErrors = Partial<Record<'name' | 'email' | 'otp' | 'mobile' | 'password' | 'confirmPassword', string>>;

/** API field errors (e.g. { mobile: "Already registered" }) → our field keys. */
function apiFieldErrors(err: unknown): FieldErrors {
  if (!(err instanceof ApiClientError) || !err.fields) return {};
  const out: FieldErrors = {};
  for (const [key, message] of Object.entries(err.fields)) {
    if (['name', 'email', 'otp', 'mobile', 'password', 'confirmPassword'].includes(key)) {
      out[key as keyof FieldErrors] = message;
    }
  }
  return out;
}

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;

/** Password input with a show / hide toggle (also used by the reset-password page). */
export const PasswordInput: React.FC<{
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  invalid?: boolean;
}> = ({ id, value, onChange, placeholder, autoComplete, invalid }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="w-4 h-4 text-[#1D5FAF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={128}
        className={`${inputClass} pl-10 pr-11 ${invalid ? errorInput : ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5B6B82] hover:text-[#1D5FAF] cursor-pointer"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const CustomerAuthForm: React.FC<CustomerAuthFormProps> = ({
  onSuccess,
  initialMode = 'signin',
  switchVia = 'inline',
  nextPath,
}) => {
  const { login } = useUserStore();
  const { addToast } = useToastStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign-up only
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSentTo, setCodeSentTo] = useState(''); // email the current code was sent to
  const [verificationToken, setVerificationToken] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Forgot password only
  const [resetSentTo, setResetSentTo] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetResendIn, setResetResendIn] = useState(0);
  const [devResetUrl, setDevResetUrl] = useState('');

  const cleanEmail = email.trim().toLowerCase();
  const emailVerified = Boolean(verificationToken) && verifiedEmail === cleanEmail;

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (resetResendIn <= 0) return;
    const t = setTimeout(() => setResetResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resetResendIn]);

  const switchTo = (next: AuthMode) => {
    setMode(next);
    setFormError('');
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const setField = (key: keyof FieldErrors, message?: string) =>
    setFieldErrors((prev) => ({ ...prev, [key]: message }));

  const finish = (user: User, isNewUser: boolean) => {
    login(user); // store + closes the auth modal
    addToast({
      type: 'success',
      title: isNewUser ? 'Account created' : 'Signed in',
      message: user.name ? `Welcome${isNewUser ? '' : ' back'}, ${user.name.split(' ')[0]}!` : 'Welcome to Buy Denmed',
    });
    onSuccess?.(user, isNewUser);
  };

  // ------------------------------------------------------------------
  // Email verification (sign-up)
  // ------------------------------------------------------------------

  const onEmailChange = (value: string) => {
    setEmail(value);
    setField('email', undefined);
    // A verified / pending code belongs to the old address — start over for a new one
    if (value.trim().toLowerCase() !== codeSentTo) {
      setCodeSentTo('');
      setOtp('');
      setDevOtp('');
      setVerificationToken('');
      setVerifiedEmail('');
    }
  };

  const sendCode = async () => {
    if (!EMAIL_RE.test(cleanEmail)) {
      setField('email', 'Enter a valid email address');
      return;
    }
    setFormError('');
    setField('email', undefined);
    setField('otp', undefined);
    setSendingCode(true);
    try {
      const res = await sendSignupEmailOtp(cleanEmail);
      setCodeSentTo(cleanEmail);
      setOtp('');
      setDevOtp(res.devOtp || '');
      setResendIn(res.resendAfterSeconds);
      addToast({ type: 'info', title: 'Code sent', message: res.message });
    } catch (err) {
      const fields = apiFieldErrors(err);
      if (fields.email) setField('email', errorMessage(err));
      else setFormError(errorMessage(err));
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setField('otp', 'Enter the 6-digit code');
      return;
    }
    setField('otp', undefined);
    setFormError('');
    setVerifyingCode(true);
    try {
      const res = await verifySignupEmailOtp(codeSentTo, otp);
      setVerificationToken(res.verificationToken);
      setVerifiedEmail(codeSentTo);
      setDevOtp('');
      setField('email', undefined);
    } catch (err) {
      setField('otp', errorMessage(err)); // e.g. "Incorrect code. 4 attempts left."
    } finally {
      setVerifyingCode(false);
    }
  };

  const changeEmail = () => {
    setCodeSentTo('');
    setOtp('');
    setDevOtp('');
    setVerificationToken('');
    setVerifiedEmail('');
    setResendIn(0);
  };

  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (name.trim().length < 2) errors.name = 'Please enter your full name';
    if (!EMAIL_RE.test(cleanEmail)) errors.email = 'Enter a valid email address';
    else if (!emailVerified) errors.email = 'Please verify your email with the code we send you';
    if (!MOBILE_RE.test(mobile)) errors.mobile = 'Enter a valid 10-digit Indian mobile number';
    if (!PASSWORD_RE.test(password)) errors.password = 'At least 8 characters with a letter and a number';
    if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setFormError('');
    setLoading(true);
    try {
      const { user, isNewUser } = await signUpWithEmail({
        name: name.trim(),
        email: cleanEmail,
        emailVerificationToken: verificationToken,
        mobile,
        password,
        confirmPassword,
      });
      finish(user, isNewUser);
    } catch (err) {
      const fields = apiFieldErrors(err);
      if (err instanceof ApiClientError && err.code === 'EMAIL_NOT_VERIFIED') changeEmail(); // token used / expired
      if (Object.keys(fields).length) setFieldErrors(fields);
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!EMAIL_RE.test(cleanEmail)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Enter your password';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setFormError('');
    setLoading(true);
    try {
      const { user } = await signInWithPassword(cleanEmail, password);
      finish(user, false);
    } catch (err) {
      setFormError(errorMessage(err));
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  /** Forgot password: the API answers the same for every email, so we always show "check your inbox". */
  const submitForgot = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!EMAIL_RE.test(cleanEmail)) {
      setFieldErrors({ email: 'Enter a valid email address' });
      return;
    }
    setFieldErrors({});
    setFormError('');
    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setResetSentTo(cleanEmail);
      setResetMessage(res.message);
      setDevResetUrl(res.devResetUrl || '');
      setResetResendIn(RESET_RESEND_SECONDS);
    } catch (err) {
      setFormError(errorMessage(err)); // e.g. rate limited
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    switchTo('forgot');
    setResetSentTo('');
    setResetMessage('');
    setDevResetUrl('');
  };

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------

  const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
  const switchLink = (target: AuthMode, label: string) =>
    switchVia === 'pages' ? (
      <Link href={`${target === 'signup' ? '/signup' : '/login'}${nextQuery}`} className="font-bold text-[#1D5FAF] hover:underline">
        {label}
      </Link>
    ) : (
      <button type="button" onClick={() => switchTo(target)} className="font-bold text-[#1D5FAF] hover:underline cursor-pointer">
        {label}
      </button>
    );

  const passwordChecks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Za-z]/.test(password), label: 'a letter' },
    { ok: /\d/.test(password), label: 'a number' },
  ];

  return (
    <div className="space-y-3.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Sign in / Create account tabs (inline mode only; hidden on "forgot password") */}
      {switchVia === 'inline' && mode !== 'forgot' && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F9FD] border border-[#DCE6F2] rounded-xl" role="tablist">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              className={`py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer font-heading ${
                mode === m ? 'bg-white text-[#1D5FAF] shadow-xs' : 'text-[#5B6B82] hover:text-[#12263F]'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
      )}

      {formError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl font-medium">
          {formError}
        </div>
      )}

      {mode === 'forgot' ? (
        resetSentTo ? (
          /* Link sent — same screen whether or not the email has an account */
          <div className="space-y-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#EAF2FC] flex items-center justify-center">
              <MailCheck className="w-7 h-7 text-[#1D5FAF]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-[#12263F] font-heading">Check your email</h3>
              <p className="text-xs sm:text-sm text-[#5B6B82] leading-relaxed">{resetMessage}</p>
              <p className="text-xs text-[#5B6B82]">
                Sent to <span className="font-bold text-[#12263F]">{resetSentTo}</span> · the link is valid for 30 minutes.
              </p>
            </div>
            {devResetUrl && process.env.NODE_ENV !== 'production' && (
              <p className="text-xs text-green-800 bg-green-50 p-2.5 rounded-xl border border-green-200 break-all">
                Development: email is not configured on the API —{' '}
                <a href={devResetUrl} className="font-bold underline">
                  open the reset link
                </a>
              </p>
            )}
            <button
              type="button"
              onClick={() => submitForgot()}
              disabled={loading || resetResendIn > 0}
              className="w-full py-3 rounded-xl border border-[#DCE6F2] text-sm font-bold text-[#1D5FAF] hover:bg-[#EAF2FC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Sending…' : resetResendIn > 0 ? `Resend link in ${resetResendIn}s` : 'Resend link'}
            </button>
            <button
              type="button"
              onClick={() => switchTo('signin')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1D5FAF] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={submitForgot} className="space-y-4" noValidate>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#12263F] font-heading">Forgot your password?</h3>
              <p className="text-xs sm:text-sm text-[#5B6B82]">
                Enter the email you signed up with and we&apos;ll send you a link to set a new password.
              </p>
            </div>
            <div>
              <label htmlFor="forgot-email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#1D5FAF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setField('email', undefined);
                  }}
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  maxLength={200}
                  className={`${inputClass} pl-10 ${fieldErrors.email ? errorInput : ''}`}
                  autoFocus
                />
              </div>
              <FieldError message={fieldErrors.email} />
            </div>
            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? 'Sending link…' : 'Send reset link'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center">
              <button
                type="button"
                onClick={() => switchTo('signin')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1D5FAF] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
            </p>
          </form>
        )
      ) : mode === 'signin' ? (
        <form onSubmit={submitSignIn} className="space-y-4" noValidate>
          <div>
            <label htmlFor="signin-email" className={labelClass}>
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#1D5FAF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setField('email', undefined);
                }}
                placeholder="you@clinic.com"
                autoComplete="email"
                maxLength={200}
                className={`${inputClass} pl-10 ${fieldErrors.email ? errorInput : ''}`}
                autoFocus
              />
            </div>
            <FieldError message={fieldErrors.email} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="signin-password" className={`${labelClass} mb-0`}>
                Password
              </label>
              <button
                type="button"
                onClick={openForgot}
                className="text-xs font-bold text-[#1D5FAF] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              id="signin-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setField('password', undefined);
              }}
              placeholder="Your password"
              autoComplete="current-password"
              invalid={Boolean(fieldErrors.password)}
            />
            <FieldError message={fieldErrors.password} />
          </div>

          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? 'Signing in…' : 'Sign in'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs sm:text-sm text-[#5B6B82]">
            New to Buy Denmed? {switchLink('signup', 'Create an account')}
          </p>
        </form>
      ) : (
        <form onSubmit={submitSignUp} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="signup-name" className={labelClass}>
              Full name <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#1D5FAF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="signup-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setField('name', undefined);
                }}
                placeholder="e.g. Dr. Priya Sharma"
                autoComplete="name"
                maxLength={120}
                className={`${inputClass} pl-10 ${fieldErrors.name ? errorInput : ''}`}
                autoFocus
              />
            </div>
            <FieldError message={fieldErrors.name} />
          </div>

          {/* Email + verify */}
          <div>
            <label htmlFor="signup-email" className={labelClass}>
              Email <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Mail className="w-4 h-4 text-[#1D5FAF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  maxLength={200}
                  disabled={emailVerified}
                  className={`${inputClass} pl-10 ${emailVerified ? 'pr-10' : ''} ${fieldErrors.email ? errorInput : ''}`}
                />
                {emailVerified && (
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] absolute right-3 top-1/2 -translate-y-1/2" aria-label="Verified" />
                )}
              </div>
              {emailVerified ? (
                <button
                  type="button"
                  onClick={changeEmail}
                  className="shrink-0 px-3 rounded-xl border border-[#DCE6F2] text-xs font-bold text-[#1D5FAF] hover:bg-[#EAF2FC] cursor-pointer"
                >
                  Change
                </button>
              ) : (
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sendingCode || !EMAIL_RE.test(cleanEmail) || (codeSentTo === cleanEmail && resendIn > 0)}
                  className="shrink-0 px-4 rounded-xl bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {sendingCode
                    ? 'Sending…'
                    : codeSentTo === cleanEmail
                      ? resendIn > 0
                        ? `Resend ${resendIn}s`
                        : 'Resend'
                      : 'Verify'}
                </button>
              )}
            </div>
            <FieldError message={fieldErrors.email} />
            {emailVerified && (
              <p className="mt-1 text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Email verified
              </p>
            )}

            {/* Code entry */}
            {codeSentTo === cleanEmail && !emailVerified && (
              <div className="mt-2 rounded-xl border border-[#DCE6F2] bg-[#F6F9FD] p-3 space-y-2">
                <label htmlFor="signup-otp" className="block text-xs font-semibold text-[#12263F]">
                  Enter the 6-digit code sent to <span className="font-bold">{codeSentTo}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="signup-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setField('otp', undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // verify the code, do not submit the whole form
                        verifyCode();
                      }
                    }}
                    placeholder="••••••"
                    className={`${inputClass} py-2.5 text-center font-mono tracking-[0.4em] ${fieldErrors.otp ? errorInput : ''}`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={verifyingCode || otp.length !== 6}
                    className="shrink-0 px-4 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {verifyingCode ? 'Checking…' : 'Verify OTP'}
                  </button>
                </div>
                <FieldError message={fieldErrors.otp} />
                <p className="text-[11px] text-[#5B6B82]">Didn&apos;t get it? Check spam, or resend after the timer.</p>
                {devOtp && process.env.NODE_ENV !== 'production' && (
                  <p className="text-xs text-green-800 bg-green-50 p-2 rounded-lg border border-green-200">
                    Development: email is not configured on the API — your code is{' '}
                    <strong className="font-mono tracking-wider">{devOtp}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label htmlFor="signup-mobile" className={labelClass}>
              Mobile number <span className="text-red-600">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1 text-[#12263F] font-bold text-sm pointer-events-none">
                <Phone className="w-4 h-4 text-[#1D5FAF]" />
                <span>+91</span>
              </div>
              <input
                id="signup-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ''));
                  setField('mobile', undefined);
                }}
                placeholder="10-digit mobile number"
                className={`${inputClass} pl-18 font-mono ${fieldErrors.mobile ? errorInput : ''}`}
              />
            </div>
            <FieldError message={fieldErrors.mobile} />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className={labelClass}>
              Password <span className="text-red-600">*</span>
            </label>
            <PasswordInput
              id="signup-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setField('password', undefined);
              }}
              placeholder="Create a password"
              autoComplete="new-password"
              invalid={Boolean(fieldErrors.password)}
            />
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {passwordChecks.map((c) => (
                <span key={c.label} className={`text-[11px] font-semibold ${c.ok ? 'text-[#16A34A]' : 'text-[#5B6B82]'}`}>
                  {c.ok ? '✓' : '•'} {c.label}
                </span>
              ))}
            </div>
            <FieldError message={fieldErrors.password} />
          </div>

          <div>
            <label htmlFor="signup-confirm" className={labelClass}>
              Confirm password <span className="text-red-600">*</span>
            </label>
            <PasswordInput
              id="signup-confirm"
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                setField('confirmPassword', undefined);
              }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              invalid={Boolean(fieldErrors.confirmPassword) || (confirmPassword.length > 0 && confirmPassword !== password)}
            />
            {confirmPassword.length > 0 && confirmPassword !== password && !fieldErrors.confirmPassword ? (
              <FieldError message="Passwords do not match" />
            ) : (
              <FieldError message={fieldErrors.confirmPassword} />
            )}
          </div>

          <button type="submit" disabled={loading || !emailVerified} className={primaryButton}>
            {loading ? 'Creating account…' : 'Create account'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {!emailVerified && (
            <p className="-mt-2 text-center text-[11px] text-[#5B6B82]">Verify your email to create the account.</p>
          )}

          <p className="text-center text-xs sm:text-sm text-[#5B6B82]">
            Already have an account? {switchLink('signin', 'Sign in')}
          </p>
        </form>
      )}
    </div>
  );
};

export default CustomerAuthForm;
