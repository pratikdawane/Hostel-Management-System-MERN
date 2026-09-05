export const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING', 'DORMITORY'] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  TRIPLE: 'Triple',
  FOUR_SHARING: 'Four sharing',
  DORMITORY: 'Dormitory',
};

export const ROOM_STATUSES = ['AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULL', 'MAINTENANCE'] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'Available',
  PARTIALLY_OCCUPIED: 'Partially occupied',
  FULL: 'Full',
  MAINTENANCE: 'Maintenance',
};

export const MAX_ROOM_CAPACITY = 12;
