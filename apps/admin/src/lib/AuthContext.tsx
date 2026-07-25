import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUser } from '@bos/shared-types';
import { api, setAccessToken } from './api';

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, totp_code?: string) => Promise<{ requires_totp?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt silent refresh on load (httpOnly refresh cookie may still be valid).
    api
      .refresh()
      .then(async (ok) => {
        if (!ok) return;
        const me = await api.me();
        setUser({ id: me.sub, email: me.email, role: me.role as AdminUser['role'], name: me.email, is_active: true });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string, totp_code?: string) {
    const res = await api.login(email, password, totp_code);
    if (res.requires_totp) return { requires_totp: true };
    setAccessToken(res.access_token ?? null);
    if (res.user) setUser(res.user);
    return {};
  }

  async function logout() {
    await api.logout().catch(() => {});
    setAccessToken(null);
    setUser(null);
  }

  async function refreshUser() {
    const me = await api.me();
    setUser({ id: me.sub, email: me.email, role: me.role as AdminUser['role'], name: me.email, is_active: true });
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
