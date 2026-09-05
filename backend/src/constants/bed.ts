export const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] as const;

export type BedStatus = (typeof BED_STATUSES)[number];

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
};
