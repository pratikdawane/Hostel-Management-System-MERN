export const ROLES = ['admin', 'manager', 'resident'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Hostel Manager',
  resident: 'Resident',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}
