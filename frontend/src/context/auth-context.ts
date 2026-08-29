import { createContext } from 'react';
import type { User, LoginInput, RegisterAdminInput, ChangePasswordInput } from '@/types/auth';

export interface AuthContextValue {
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  registerAdmin: (input: RegisterAdminInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
