import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { resetPassword, isStrongPassword, PASSWORD_HINT } from '@/lib/api/admin/auth';
import { FormField, inputClass } from '@/components/admin/FormField';

/**
 * Opened from the emailed link:
 *   /admin/reset-password?token=…           (forgot password / "Reset" in Staff & Roles)
 *   /admin/reset-password?token=…&invite=1  (new staff member setting their first password)
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const isInvite = params.get('invite') === '1';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isStrongPassword(password)) {
      setError(`Password must have ${PASSWORD_HINT.toLowerCase()}.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setDone(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FD] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2545] text-white font-bold text-lg shadow-sm">
            BD
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#12263F] tracking-tight">Buy Denmed Admin</h1>
        </div>

        <div className="rounded-xl border border-[#DCE6F2] bg-white p-6 sm:p-8 shadow-sm">
          {!token ? (
            <div className="text-sm text-[#12263F] space-y-3">
              <p className="font-semibold">This link is incomplete.</p>
              <p className="text-[#5B6B82] text-xs">Open the link from your email again, or request a new one from the sign-in page.</p>
              <Link to="/admin/login" className="inline-block text-xs font-semibold text-[#1D5FAF] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{done}</p>
              </div>
              <Link
                to="/admin/login"
                className="block w-full text-center rounded-lg bg-[#1D5FAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174D8F]"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-[#1D5FAF] mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-[#12263F]">
                    {isInvite ? 'Set your password' : 'Choose a new password'}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#5B6B82]">
                    {isInvite
                      ? 'Welcome to the team. Create a password to activate your admin account.'
                      : 'You will be signed out of other devices after the change.'}
                  </p>
                </div>
              </div>

              {error && (
                <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="New password" htmlFor="reset-password" required hint={PASSWORD_HINT}>
                  <input
                    id="reset-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                </FormField>
                <FormField label="Confirm password" htmlFor="reset-confirm" required>
                  <input
                    id="reset-confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#1D5FAF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#174D8F] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Saving…' : isInvite ? 'Set password' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
