import type { ComplaintPriority, ComplaintStatus } from '@/types/complaint';

export function complaintStatusBadgeVariant(
  status: ComplaintStatus,
): 'primary' | 'success' | 'warning' | 'neutral' {
  if (status === 'OPEN') return 'warning';
  if (status === 'IN_PROGRESS') return 'primary';
  if (status === 'RESOLVED') return 'success';
  return 'neutral';
}

export function complaintPriorityBadgeVariant(
  priority: ComplaintPriority,
): 'neutral' | 'primary' | 'warning' | 'danger' {
  if (priority === 'LOW') return 'neutral';
  if (priority === 'MEDIUM') return 'primary';
  if (priority === 'HIGH') return 'warning';
  return 'danger';
}
