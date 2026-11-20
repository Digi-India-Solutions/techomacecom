import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Logo from '@/components/common/Logo';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { PageSkeleton } from '@/components/skeletons/PageSkeletons';

// The URL carries a one-time token: never send it to other sites, never index the page
export const metadata: Metadata = {
  title: 'Set a new password | Buy Denmed',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

/** /reset-password?token=… — opened from the "Reset your password" email. */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DCE6F2] shadow-xl overflow-hidden">
        <div className="bg-[#0B2545] p-6 text-center text-white space-y-2">
          <div className="flex justify-center">
            <Logo variant="dark" size="sm" showTagline={false} />
          </div>
          <h1 className="text-xl font-black font-heading">Set a new password</h1>
          <p className="text-xs text-slate-300">Choose a strong password you don&apos;t use anywhere else</p>
        </div>
        <div className="p-6 sm:p-8">
          <Suspense fallback={<PageSkeleton />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
