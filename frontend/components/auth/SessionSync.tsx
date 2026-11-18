'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { fetchCurrentCustomer } from '@/lib/api/customerAuth';

/**
 * Runs once per page load: asks the API who is signed in (GET /auth/me, which
 * silently refreshes an expired access cookie) and makes the store match.
 * Handles sign-in / sign-out in another tab and sessions revoked on the server.
 */
export function SessionSync() {
  const setUser = useUserStore((s) => s.setUser);
  const logout = useUserStore((s) => s.logout);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentCustomer()
      .then((user) => {
        if (cancelled) return;
        if (user) setUser(user);
        else if (useUserStore.getState().isAuthenticated) logout();
      })
      .catch(() => {
        // API unreachable — keep whatever the store has; the next call will retry.
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, logout]);

  return null;
}

export default SessionSync;
