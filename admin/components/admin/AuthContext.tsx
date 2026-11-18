import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AdminPermission, AdminUser, AuthSession } from '@/types/admin';
import {
  fetchAdminSession,
  getStoredSession,
  hasPermission,
  loginAdmin,
  logoutAdmin,
  persistSession,
  updateAdminProfile,
} from '@/lib/api/admin/auth';
import { setSessionExpiredHandler } from '@/lib/api/admin/client';

/**
 * status:
 *   checking      — asking the API whether the cookie session is valid (first load)
 *   authenticated — signed in; `permissions` came from the API
 *   anonymous     — signed out
 */
type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  session: AuthSession | null;
  user: AdminUser | null;
  permissions: string[];
  status: AuthStatus;
  isAuthenticated: boolean;
  /** UI check only — the API enforces every permission on its own. */
  can: (permission: AdminPermission | string) => boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads the user and permissions (e.g. after an admin edits your role). */
  reload: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AdminUser, 'name' | 'phone' | 'department'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Cached profile gives an instant first paint; the API check below confirms it.
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [status, setStatus] = useState<AuthStatus>(() => (getStoredSession() ? 'authenticated' : 'checking'));

  const reload = useCallback(async () => {
    try {
      const next = await fetchAdminSession();
      setSession(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    } catch {
      // API unreachable: keep the cached session so the UI stays usable; calls will show errors.
      setStatus((s) => (s === 'checking' ? (getStoredSession() ? 'authenticated' : 'anonymous') : s));
    }
  }, []);

  useEffect(() => {
    reload();
    // A refresh that fails anywhere in the app signs the user out here.
    setSessionExpiredHandler(() => {
      persistSession(null);
      setSession(null);
      setStatus('anonymous');
    });
    // Pick up permission changes when the tab regains focus.
    const onFocus = () => {
      if (getStoredSession()) reload();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      setSessionExpiredHandler(null);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const next = await loginAdmin({ email, password, rememberMe });
    setSession(next);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin().catch(() => undefined);
    setSession(null);
    setStatus('anonymous');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<AdminUser, 'name' | 'phone' | 'department'>>) => {
    setSession(await updateAdminProfile(updates));
  }, []);

  const permissions = session?.permissions ?? [];
  const can = useCallback((permission: AdminPermission | string) => hasPermission(permissions, permission), [permissions]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        permissions,
        status,
        isAuthenticated: status === 'authenticated' && Boolean(session?.user),
        can,
        login,
        logout,
        reload,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
