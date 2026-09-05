import type { AllocationStatus } from '@/types/allocation';

export function allocationStatusBadgeVariant(
  status: AllocationStatus,
): 'success' | 'neutral' | 'danger' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'COMPLETED') return 'neutral';
  return 'danger';
}
