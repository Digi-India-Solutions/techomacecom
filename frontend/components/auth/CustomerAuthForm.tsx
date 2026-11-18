'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Building2, Phone, ShoppingCart, Stethoscope, User as UserIcon, CheckCircle2 } from 'lucide-react';
import type { User } from '@/types';
import { useToastStore, useUserStore } from '@/lib/store';
import { errorMessage } from '@/lib/api/backend';
import {
  getAuthConfig,
  sendAddMobileOtp,
  sendLoginOtp,
  signInWithGoogle,
  updateCustomerProfile,
  verifyAddMobileOtp,
  verifyLoginOtp,
  type AuthConfig,
  type CustomerType,
} from '@/lib/api/customerAuth';
import GoogleSignInButton from './GoogleSignInButton';

/**
 * Sign in / sign up for storefront customers — used by the global AuthModal,
 * the /login page and checkout.
 *
 *   phone  → OTP sent (account is created on first verify = sign-up)
 *   otp    → verify
 *   profile→ new or incomplete accounts add a name (and a mobile, for Google sign-ups)
 */

type Step = 'phone' | 'otp' | 'profile';

const CUSTOMER_TYPES: { value: CustomerType; label: string; icon: React.ElementType }[] = [
  { value: 'doctor', label: 'Doctor / Dentist', icon: Stethoscope },
  { value: 'clinic_admin', label: 'Hospital / Clinic', icon: Building2 },
  { value: 'procurement', label: 'Procurement', icon: ShoppingCart },
  { value: 'individual', label: 'Patient / Family', icon: UserIcon },
];

const inputClass =
  'w-full px-4 py-3 border border-[#DCE6F2] focus:border-[#1D5FAF] focus:ring-2 focus:ring-[#1D5FAF]/20 rounded-xl text-sm font-semibold text-[#12263F] outline-none transition-all';
const primaryButton =
  'w-full py-3.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-heading';

interface CustomerAuthFormProps {
  onSuccess?: (user: User, isNewUser: boolean) => void;
}

export const CustomerAuthForm: React.FC<CustomerAuthFormProps> = ({ onSuccess }) => {
  const { login, setUser } = useUserStore();
  const { addToast } = useToastStore();

  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [step, setStep] = useState<Step>('phone');
  const [customerType, setCustomerType] = useState<CustomerType>('doctor');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile step
  const [signedIn, setSignedIn] = useState<{ user: User; isNewUser: boolean } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);

  useEffect(() => {
    getAuthConfig()
      .then(setConfig)
      .catch(() => setConfig({ googleEnabled: false, googleClientId: null, otpLength: 6 }));
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const finish = useCallback(
    (user: User, isNewUser: boolean) => {
      login(user);
      addToast({
        type: 'success',
        title: isNewUser ? 'Account created' : 'Signed in',
        message: user.name ? `Welcome${isNewUser ? '' : ' back'}, ${user.name.split(' ')[0]}!` : 'Welcome to Buy Denmed',
      });
      onSuccess?.(user, isNewUser);
    },
    [login, addToast, onSuccess]
  );

  /** After OTP / Google: ask for missing details, otherwise we're done. */
  const afterSignIn = useCallback(
    (user: User, isNewUser: boolean) => {
      if (isNewUser || !user.profileComplete) {
        setUser(user); // session is live; the profile step just completes it
        setSignedIn({ user, isNewUser });
        setName(user.name || '');
        setEmail(user.email || '');
        setStep('profile');
      } else {
        finish(user, isNewUser);
      }
    },
    [finish, setUser]
  );

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await sendLoginOtp(clean);
      setDevOtp(res.devOtp || '');
      setOtp('');
      setResendIn(res.resendAfterSeconds);
      setStep('otp');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { user, isNewUser } = await verifyLoginOtp({ mobile, otp, customerType });
      afterSignIn(user, isNewUser);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleCredential = useCallback(
    async (credential: string) => {
      setError('');
      setLoading(true);
      try {
        const { user, isNewUser } = await signInWithGoogle(credential, customerType);
        afterSignIn(user, isNewUser);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [afterSignIn, customerType]
  );

  const sendMobileForProfile = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await sendAddMobileOtp(newMobile);
      setDevOtp(res.devOtp || '');
      setMobileOtpSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) return;
    if (name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let user = signedIn.user;
      if (!user.phone) {
        if (!mobileOtpSent || !/^\d{6}$/.test(mobileOtp)) {
          setError('Verify your mobile number — we need it for delivery updates');
          setLoading(false);
          return;
        }
        user = await verifyAddMobileOtp(newMobile, mobileOtp);
      }
      user = await updateCustomerProfile({
        name: name.trim(),
        customerType,
        ...(user.hasGoogle ? {} : { email: email.trim() }),
      });
      finish(user, signedIn.isNewUser);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const devHint =
    devOtp && process.env.NODE_ENV !== 'production' ? (
      <div className="text-xs text-green-800 bg-green-50 p-2.5 rounded-xl text-center font-medium border border-green-200">
        Development: your OTP is <strong className="font-mono tracking-wider">{devOtp}</strong> (also printed in the API terminal)
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={requestOtp} className="space-y-4">
          <div>
            <p className="block text-xs sm:text-sm font-semibold text-[#12263F] mb-2 font-heading">I am buying as</p>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOMER_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCustomerType(value)}
                  aria-pressed={customerType === value}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    customerType === value
                      ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90] shadow-xs'
                      : 'border-[#DCE6F2] text-[#12263F] hover:bg-[#F6F9FD]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#1D5FAF] shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="auth-mobile" className="block text-xs sm:text-sm font-semibold text-[#12263F] mb-1.5 font-heading">
              Mobile number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1 text-[#12263F] font-bold text-sm pointer-events-none">
                <Phone className="w-4 h-4 text-[#1D5FAF]" />
                <span>+91</span>
              </div>
              <input
                id="auth-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className={`${inputClass} pl-18 font-mono text-base`}
                autoFocus
              />
            </div>
            <p className="text-xs text-[#5B6B82] mt-1.5">New here? Verifying your number creates your account.</p>
          </div>

          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? 'Sending OTP…' : 'Continue with OTP'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {config?.googleEnabled && config.googleClientId && (
            <>
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-[#DCE6F2] w-full" />
                <span className="bg-white px-3 text-xs text-[#5B6B82] font-semibold uppercase">Or</span>
                <div className="border-t border-[#DCE6F2] w-full" />
              </div>
              <GoogleSignInButton clientId={config.googleClientId} onCredential={onGoogleCredential} disabled={loading} />
            </>
          )}
          {config && !config.googleEnabled && process.env.NODE_ENV !== 'production' && (
            <p className="text-[11px] text-center text-[#5B6B82]">
              Google sign-in is off — set <code>GOOGLE_CLIENT_ID</code> in backend/.env to enable it.
            </p>
          )}
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={submitOtp} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="auth-otp" className="text-xs sm:text-sm font-semibold text-[#12263F] font-heading">
                Enter the code sent to +91 {mobile}
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError('');
                  setDevOtp('');
                }}
                className="text-xs text-[#1D5FAF] font-bold hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <input
              id="auth-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className={`${inputClass} text-center text-xl tracking-[0.5em] font-mono`}
              autoFocus
            />
          </div>
          {devHint}
          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? 'Verifying…' : 'Verify & continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-center text-[#5B6B82]">
            Didn&apos;t get it?{' '}
            {resendIn > 0 ? (
              <span>Resend in {resendIn}s</span>
            ) : (
              <button type="button" onClick={() => requestOtp()} className="font-bold text-[#1D5FAF] hover:underline cursor-pointer">
                Resend OTP
              </button>
            )}
          </p>
        </form>
      )}

      {step === 'profile' && signedIn && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
            <CheckCircle2 className="w-4 h-4" />
            {signedIn.isNewUser ? 'Verified! Finish creating your account.' : 'Signed in. Just a few details left.'}
          </div>

          <div>
            <label htmlFor="auth-name" className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Full name <span className="text-red-600">*</span>
            </label>
            <input
              id="auth-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Priya Sharma"
              autoComplete="name"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#12263F] mb-1.5">
              Email <span className="font-normal text-[#5B6B82]">(for GST invoices)</span>
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={signedIn.user.hasGoogle}
              placeholder="you@clinic.com"
              autoComplete="email"
              className={`${inputClass} ${signedIn.user.hasGoogle ? 'bg-[#F6F9FD] text-[#5B6B82]' : ''}`}
            />
          </div>

          {!signedIn.user.phone && (
            <div className="space-y-2 rounded-xl border border-[#DCE6F2] p-3 bg-[#F6F9FD]">
              <label htmlFor="auth-new-mobile" className="block text-xs font-semibold text-[#12263F]">
                Mobile number <span className="text-red-600">*</span>{' '}
                <span className="font-normal text-[#5B6B82]">(delivery &amp; order updates)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="auth-new-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={newMobile}
                  onChange={(e) => {
                    setNewMobile(e.target.value.replace(/\D/g, ''));
                    setMobileOtpSent(false);
                  }}
                  placeholder="10-digit mobile"
                  className={`${inputClass} py-2.5 font-mono`}
                />
                <button
                  type="button"
                  onClick={sendMobileForProfile}
                  disabled={loading || !/^[6-9]\d{9}$/.test(newMobile)}
                  className="shrink-0 px-3 rounded-xl bg-[#0B2545] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {mobileOtpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {mobileOtpSent && (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit OTP"
                  aria-label="OTP for mobile number"
                  className={`${inputClass} py-2.5 text-center font-mono tracking-[0.4em]`}
                />
              )}
              {devHint}
            </div>
          )}

          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? 'Saving…' : signedIn.isNewUser ? 'Create account' : 'Save & continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
          {signedIn.user.phone && (
            <button
              type="button"
              onClick={() => finish(signedIn.user, signedIn.isNewUser)}
              className="w-full text-xs text-[#5B6B82] hover:text-[#12263F] font-semibold cursor-pointer"
            >
              Skip for now
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default CustomerAuthForm;
