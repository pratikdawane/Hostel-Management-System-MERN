export const ALLOCATION_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const ALLOCATION_STATUS_LABELS: Record<AllocationStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export interface AllocationResident {
  id: string;
  name: string;
}

export interface AllocationRoom {
  id: string;
  roomNumber: string;
  floor: number;
}

export interface AllocationBed {
  id: string;
  label: string;
}

export interface Allocation {
  id: string;
  resident: AllocationResident | null;
  room: AllocationRoom | null;
  bed: AllocationBed | null;
  checkInDate: string;
  expectedCheckOutDate?: string;
  actualCheckOutDate?: string;
  monthlyRent: number;
  securityDeposit: number;
  status: AllocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAllocations {
  allocations: Allocation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAllocationInput {
  residentId: string;
  roomId: string;
  bedId: string;
  checkInDate: string;
  expectedCheckOutDate?: string;
  monthlyRent: number;
  securityDeposit: number;
}
