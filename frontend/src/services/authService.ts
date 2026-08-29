import { api } from './api';
import { setAccessToken } from './tokenStore';
import type { ApiEnvelope } from '@/types/api';
import type {
  AuthResult,
  User,
  LoginInput,
  RegisterAdminInput,
  ChangePasswordInput,
} from '@/types/auth';

function applySession(result: AuthResult): AuthResult {
  setAccessToken(result.accessToken);
  return result;
}

export async function registerAdmin(input: RegisterAdminInput): Promise<AuthResult> {
  const { data } = await api.post<ApiEnvelope<AuthResult>>('/auth/register', input);
  return applySession(data.data);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { data } = await api.post<ApiEnvelope<AuthResult>>('/auth/login', input);
  return applySession(data.data);
}

export async function refresh(): Promise<AuthResult> {
  const { data } = await api.post<ApiEnvelope<AuthResult>>('/auth/refresh');
  return applySession(data.data);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<{ user: User }>>('/auth/me');
  return data.data.user;
}

export async function changePassword(input: ChangePasswordInput): Promise<AuthResult> {
  const { data } = await api.put<ApiEnvelope<AuthResult>>('/auth/change-password', input);
  return applySession(data.data);
}
