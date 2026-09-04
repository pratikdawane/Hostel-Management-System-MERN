import type { ResidentStatus } from '@/types/resident';

export function statusBadgeVariant(status: ResidentStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'INACTIVE') return 'warning';
  return 'neutral';
}
