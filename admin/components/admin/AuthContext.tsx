import React, { createContext, useCallback, useContext, useState } from 'react';
import type { AdminPermission, AdminRole, AdminUser, AuthSession } from '@/types/admin';
import {
  getStoredSession,
  hasPermission,
  loginAdmin,
  logoutAdmin,
  switchDemoRole,
  updateAdminProfile,
} from '@/lib/api/admin/auth';

interface AuthContextValue {
  session: AuthSession | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  can: (permission: AdminPermission) => boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: AdminRole) => Promise<void>;
  updateProfile: (updates: Partial<Pick<AdminUser, 'name' | 'phone' | 'department'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const nextSession = await loginAdmin({ email, password, rememberMe });
    setSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setSession(null);
  }, []);

  const switchRole = useCallback(async (role: AdminRole) => {
    const nextSession = await switchDemoRole(role);
    setSession(nextSession);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<AdminUser, 'name' | 'phone' | 'department'>>) => {
      const updatedUser = await updateAdminProfile(updates);
      setSession((prev) => (prev ? { ...prev, user: updatedUser } : prev));
    },
    []
  );

  const can = useCallback(
    (permission: AdminPermission) => hasPermission(session?.user.role, permission),
    [session?.user.role]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.user),
        can,
        login,
        logout,
        switchRole,
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
