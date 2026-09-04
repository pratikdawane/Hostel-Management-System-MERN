export const RESIDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'CHECKED_OUT'] as const;

export type ResidentStatus = (typeof RESIDENT_STATUSES)[number];

export const RESIDENT_STATUS_LABELS: Record<ResidentStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  CHECKED_OUT: 'Checked out',
};

export const GENDERS = ['male', 'female', 'other'] as const;

export type Gender = (typeof GENDERS)[number];
