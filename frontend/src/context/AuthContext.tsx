import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '@/services/authService';
import { onSessionExpired } from '@/services/authEvents';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { AuthContext } from './auth-context';
import type { User, LoginInput, RegisterAdminInput, ChangePasswordInput } from '@/types/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authService
      .refresh()
      .then((result) => {
        if (!cancelled) setUser(result.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await authService.login(input);
    setUser(result.user);
    return result.user;
  }, []);

  const registerAdmin = useCallback(async (input: RegisterAdminInput) => {
    const result = await authService.registerAdmin(input);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const freshUser = await authService.getMe();
    setUser(freshUser);
  }, []);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    const result = await authService.changePassword(input);
    setUser(result.user);
  }, []);

  if (isBootstrapping) {
    return <FullPageLoader />;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, registerAdmin, logout, refreshUser, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}
