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

export const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] as const;
export type BedStatus = (typeof BED_STATUSES)[number];

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
};

export const MAX_ROOM_CAPACITY = 12;

export interface BedCounts {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  monthlyRent: number;
  status: RoomStatus;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  bedCounts?: BedCounts;
}

export interface BedResident {
  id: string;
  name: string;
}

export interface Bed {
  id: string;
  roomId: string;
  label: string;
  status: BedStatus;
  residentId?: BedResident;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedRooms {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoomStats {
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
}

export interface CreateRoomInput {
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  monthlyRent: number;
  description?: string;
}

type Clearable<T> = { [K in keyof T]?: T[K] | null };

/**
 * `undefined` (key omitted) means "leave unchanged"; `null` means "clear this field" — same
 * convention as UpdateResidentInput. `status` can only ever be set to AVAILABLE or MAINTENANCE;
 * PARTIALLY_OCCUPIED/FULL are always computed server-side from bed occupancy.
 */
export interface UpdateRoomInput extends Clearable<CreateRoomInput> {
  status?: 'AVAILABLE' | 'MAINTENANCE';
}

export interface CreateBedInput {
  label: string;
}

export interface UpdateBedInput {
  label?: string;
  status?: 'AVAILABLE' | 'MAINTENANCE';
}
