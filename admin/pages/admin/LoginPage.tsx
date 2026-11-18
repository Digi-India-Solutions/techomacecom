import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { requestPasswordReset } from '@/lib/api/admin/auth';
import { FormField, inputClass } from '@/components/admin/FormField';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentMsg, setForgotSentMsg] = useState('');

  if (isAuthenticated) {
    const dest = (location.state as { from?: string } | null)?.from || '/admin';
    return <Navigate to={dest} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      showToast({ title: 'Signed in to Buy Denmed Admin', variant: 'success' });
      const dest = (location.state as { from?: string } | null)?.from || '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await requestPasswordReset(forgotEmail);
      setForgotSentMsg(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FD] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2545] text-white font-bold text-lg shadow-sm">
            BD
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#12263F] tracking-tight">
            Buy Denmed Admin
          </h1>
          <p className="mt-1 text-sm text-[#5B6B82]">
            Medical &amp; Dental Equipment Commerce + Rental Console
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-6 sm:p-8 shadow-sm">
          {mode === 'login' ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[#12263F]">Sign in to your account</h2>
                <p className="mt-0.5 text-xs text-[#5B6B82]">
                  Authorized personnel only. Session protected by role-based access control.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <FormField label="Work Email" htmlFor="login-email" required>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@buydenmed.in"
                      autoComplete="username"
                      autoFocus
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </FormField>

                <FormField label="Password" htmlFor="login-password" required>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </FormField>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-[#12263F] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#DCE6F2] text-[#1D5FAF] focus:ring-[#1D5FAF]"
                    />
                    Keep me signed in on this device
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setForgotSentMsg('');
                      setForgotEmail(email);
                      setMode('forgot');
                    }}
                    className="text-xs font-medium text-[#1D5FAF] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#1D5FAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174D8F] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

            </>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setForgotSentMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5B6B82] hover:text-[#12263F] mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>

              <h2 className="text-lg font-semibold text-[#12263F]">Reset your password</h2>
              <p className="mt-1 text-xs text-[#5B6B82]">
                Enter your Buy Denmed work email and we will send a password reset link.
              </p>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              {forgotSentMsg ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Reset Link Sent</p>
                    <p className="mt-1 leading-relaxed">{forgotSentMsg}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-4 space-y-4">
                  <FormField label="Work Email" htmlFor="forgot-email" required>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@buydenmed.in"
                      className={inputClass}
                    />
                  </FormField>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[#1D5FAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174D8F] transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send Reset Instructions'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
