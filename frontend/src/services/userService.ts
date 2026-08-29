import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type { CreateUserInput, PaginatedUsers, Role, User } from '@/types/auth';

export interface ListUsersParams {
  role?: Role;
  page?: number;
  limit?: number;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<ApiEnvelope<{ user: User }>>('/users', input);
  return data.data.user;
}

export async function listUsers(params: ListUsersParams = {}): Promise<PaginatedUsers> {
  const { data } = await api.get<ApiEnvelope<PaginatedUsers>>('/users', { params });
  return data.data;
}

export async function setUserActiveStatus(id: string, isActive: boolean): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<{ user: User }>>(`/users/${id}/status`, {
    isActive,
  });
  return data.data.user;
}
