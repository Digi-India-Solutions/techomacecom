'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { useHydrated } from '@/hooks/use-hydrated';
import Logo from '@/components/common/Logo';
import CustomerAuthForm from '@/components/auth/CustomerAuthForm';
import { PageSkeleton } from '@/components/skeletons/PageSkeletons';

/** Only same-site paths are allowed as ?next= targets (no open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { isAuthenticated, user } = useUserStore();
  const hydrated = useHydrated();

  // Already signed in (and profile complete) → go straight on
  useEffect(() => {
    if (hydrated && isAuthenticated && user?.profileComplete !== false) router.replace(next);
  }, [hydrated, isAuthenticated, user, next, router]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DCE6F2] shadow-xl overflow-hidden">
        <div className="bg-[#0B2545] p-6 text-center text-white space-y-2">
          <div className="flex justify-center">
            <Logo variant="dark" size="sm" showTagline={false} />
          </div>
          <h1 className="text-xl font-black font-heading">Sign in or create an account</h1>
          <p className="text-xs text-slate-300">Use your mobile number or Google account</p>
        </div>
        <div className="p-6 sm:p-8">
          <CustomerAuthForm onSuccess={() => router.replace(next)} />
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

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}
