import React, { Suspense } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import { PageSkeleton } from '@/components/skeletons/PageSkeletons';

/** /signup — name, verified email, mobile, password → account created and signed in. */
export default function SignupPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuthPage mode="signup" />
    </Suspense>
  );
}
