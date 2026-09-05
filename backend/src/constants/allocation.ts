export const ALLOCATION_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const ALLOCATION_STATUS_LABELS: Record<AllocationStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
