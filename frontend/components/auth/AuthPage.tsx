'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { useHydrated } from '@/hooks/use-hydrated';
import Logo from '@/components/common/Logo';
import CustomerAuthForm, { type AuthMode } from '@/components/auth/CustomerAuthForm';

/** Only same-site paths are allowed as ?next= targets (no open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

const COPY: Record<AuthMode, { title: string; subtitle: string }> = {
  signin: { title: 'Sign in to your account', subtitle: 'Use the email and password you signed up with' },
  signup: { title: 'Create your account', subtitle: 'Verify your email — GST invoices, orders and rentals in one place' },
  forgot: { title: 'Reset your password', subtitle: "We'll email you a secure link to set a new password" },
};

/**
 * Full-page sign-in / sign-up (app/login, app/signup). Needs a <Suspense> parent
 * because it reads ?next= with useSearchParams.
 *
 * Shared by /login and /signup — only the starting mode differs. */
export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { isAuthenticated } = useUserStore();
  const hydrated = useHydrated();

  // Already signed in → go straight on
  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(next);
  }, [hydrated, isAuthenticated, next, router]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DCE6F2] shadow-xl overflow-hidden">
        <div className="bg-[#0B2545] p-6 text-center text-white space-y-2">
          <div className="flex justify-center">
            <Logo variant="dark" size="sm" showTagline={false} />
          </div>
          <h1 className="text-xl font-black font-heading">{COPY[mode].title}</h1>
          <p className="text-xs text-slate-300">{COPY[mode].subtitle}</p>
        </div>
        <div className="p-6 sm:p-8">
          <CustomerAuthForm
            key={mode}
            initialMode={mode}
            switchVia="pages"
            nextPath={params.get('next') ? next : undefined}
            onSuccess={() => router.replace(next)}
          />
          <p className="mt-6 text-center text-xs text-[#5B6B82]">
            By continuing, you agree to our{' '}
            <Link href="/policies/terms" className="underline hover:text-[#1D5FAF]">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/policies/privacy" className="underline hover:text-[#1D5FAF]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
