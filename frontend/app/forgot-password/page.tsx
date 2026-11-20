import React, { Suspense } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import { PageSkeleton } from '@/components/skeletons/PageSkeletons';

/** /forgot-password — email a one-time link to set a new password. */
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuthPage mode="forgot" />
    </Suspense>
  );
}
