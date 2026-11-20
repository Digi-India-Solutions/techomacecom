import React, { Suspense } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import { PageSkeleton } from '@/components/skeletons/PageSkeletons';

/** /login — email + password sign-in (link to /signup keeps ?next=). */
export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AuthPage mode="signin" />
    </Suspense>
  );
}
