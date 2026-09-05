import type { BedStatus, RoomStatus } from '@/types/room';

export function roomStatusBadgeVariant(
  status: RoomStatus,
): 'success' | 'warning' | 'neutral' | 'danger' {
  if (status === 'AVAILABLE') return 'success';
  if (status === 'PARTIALLY_OCCUPIED') return 'warning';
  if (status === 'FULL') return 'neutral';
  return 'danger';
}

export function bedStatusBadgeVariant(status: BedStatus): 'success' | 'primary' | 'danger' {
  if (status === 'AVAILABLE') return 'success';
  if (status === 'OCCUPIED') return 'primary';
  return 'danger';
}
