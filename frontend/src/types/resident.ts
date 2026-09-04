export const RESIDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'CHECKED_OUT'] as const;
export type ResidentStatus = (typeof RESIDENT_STATUSES)[number];

export const RESIDENT_STATUS_LABELS: Record<ResidentStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  CHECKED_OUT: 'Checked out',
};

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface Resident {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  college?: string;
  course?: string;
  studentId?: string;
  profileImage?: string;
  status: ResidentStatus;
  user?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResidents {
  residents: Resident[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResidentStats {
  total: number;
  active: number;
}

export interface CreateResidentInput {
  name: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  college?: string;
  course?: string;
  studentId?: string;
  profileImage?: string;
}

type Clearable<T> = { [K in keyof T]?: T[K] | null };

/**
 * `undefined` (key omitted) means "leave unchanged"; `null` means "clear this
 * field". JSON.stringify drops `undefined` keys but keeps `null` ones, so the
 * update payload must use `null` to clear a field on the server — see
 * ResidentForm's buildUpdatePayload.
 */
export interface UpdateResidentInput extends Clearable<CreateResidentInput> {
  status?: ResidentStatus;
  userId?: string | null;
}
