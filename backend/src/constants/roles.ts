export const ROLES = ['admin', 'manager', 'resident'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Hostel Manager',
  resident: 'Resident',
};
