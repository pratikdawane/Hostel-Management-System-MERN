import mongoose, { type Types } from 'mongoose';
import { Room, type RoomDocument } from '../models/room.model.js';
import { Bed, type BedDocument } from '../models/bed.model.js';
import type { IResident } from '../models/resident.model.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/regex.js';
import { MAX_ROOM_CAPACITY, type RoomType, type RoomStatus } from '../constants/room.js';
import type { CreateRoomInput, ListRoomsQuery, UpdateRoomInput } from '../validators/room.validator.js';
import type { CreateBedInput } from '../validators/bed.validator.js';

// Beds are labeled A, B, C, ... — capped at MAX_ROOM_CAPACITY (12) so this never needs a
// fallback beyond the alphabet.
function generateBedLabels(capacity: number): string[] {
  return Array.from({ length: capacity }, (_, index) => String.fromCharCode(65 + index));
}

async function assertRoomNumberAvailable(roomNumber: string, excludeId?: string): Promise<void> {
  const filter: Record<string, unknown> = { roomNumber };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const taken = await Room.exists(filter);
  if (taken) {
    throw ApiError.conflict('A room with this room number already exists');
  }
}

async function computeStatusFromOccupancy(
  roomId: string,
): Promise<'AVAILABLE' | 'PARTIALLY_OCCUPIED' | 'FULL'> {
  const beds = await Bed.find({ roomId }).select('status');
  if (beds.length === 0) return 'AVAILABLE';
  const occupied = beds.filter((bed) => bed.status === 'OCCUPIED').length;
  if (occupied === 0) return 'AVAILABLE';
  if (occupied === beds.length) return 'FULL';
  return 'PARTIALLY_OCCUPIED';
}

/**
 * Recomputes AVAILABLE/PARTIALLY_OCCUPIED/FULL from actual bed occupancy. A room left in
 * MAINTENANCE keeps that status until an admin explicitly clears it via updateRoom.
 */
export async function refreshRoomStatus(roomId: string): Promise<void> {
  const room = await Room.findById(roomId);
  if (!room || room.status === 'MAINTENANCE') return;
  room.status = await computeStatusFromOccupancy(roomId);
  await room.save();
}

export async function createRoom(
  input: CreateRoomInput,
  createdBy: string,
): Promise<{ room: RoomDocument; beds: BedDocument[] }> {
  await assertRoomNumberAvailable(input.roomNumber);

  const session = await mongoose.startSession();
  try {
    let room!: RoomDocument;
    let beds!: BedDocument[];
    await session.withTransaction(async () => {
      const created = await Room.create([{ ...input, status: 'AVAILABLE', createdBy }], {
        session,
      });
      room = created[0]!;
      beds = await Bed.insertMany(
        generateBedLabels(input.capacity).map((label) => ({
          roomId: room._id,
          label,
          status: 'AVAILABLE',
        })),
        { session },
      );
    });
    return { room, beds };
  } finally {
    await session.endSession();
  }
}

export interface BedCounts {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

const EMPTY_BED_COUNTS: BedCounts = { total: 0, available: 0, occupied: 0, maintenance: 0 };

export interface RoomListItem {
  id: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  monthlyRent: number;
  status: RoomStatus;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  bedCounts: BedCounts;
}

export interface PaginatedRooms {
  rooms: RoomListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listRooms(query: ListRoomsQuery): Promise<PaginatedRooms> {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.floor !== undefined) filter.floor = query.floor;
  if (query.q) {
    filter.roomNumber = new RegExp(escapeRegex(query.q), 'i');
  }

  const skip = (query.page - 1) * query.limit;

  const [rooms, total] = await Promise.all([
    Room.find(filter).sort({ floor: 1, roomNumber: 1 }).skip(skip).limit(query.limit),
    Room.countDocuments(filter),
  ]);

  const roomIds = rooms.map((room) => room._id);
  const bedCountRows = await Bed.aggregate<{
    _id: { roomId: Types.ObjectId; status: string };
    count: number;
  }>([
    { $match: { roomId: { $in: roomIds } } },
    { $group: { _id: { roomId: '$roomId', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const bedCountsByRoom = new Map<string, BedCounts>();
  for (const row of bedCountRows) {
    const key = String(row._id.roomId);
    const entry = bedCountsByRoom.get(key) ?? { ...EMPTY_BED_COUNTS };
    entry.total += row.count;
    if (row._id.status === 'AVAILABLE') entry.available += row.count;
    else if (row._id.status === 'OCCUPIED') entry.occupied += row.count;
    else if (row._id.status === 'MAINTENANCE') entry.maintenance += row.count;
    bedCountsByRoom.set(key, entry);
  }

  const items: RoomListItem[] = rooms.map((room) => ({
    id: String(room._id),
    roomNumber: room.roomNumber,
    floor: room.floor,
    type: room.type,
    capacity: room.capacity,
    monthlyRent: room.monthlyRent,
    status: room.status,
    description: room.description,
    createdBy: String(room.createdBy),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    bedCounts: bedCountsByRoom.get(String(room._id)) ?? { ...EMPTY_BED_COUNTS },
  }));

  return {
    rooms: items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getRoomById(id: string): Promise<RoomDocument> {
  const room = await Room.findById(id);
  if (!room) {
    throw ApiError.notFound('Room not found');
  }
  return room;
}

export async function updateRoom(id: string, input: UpdateRoomInput): Promise<RoomDocument> {
  const room = await Room.findById(id);
  if (!room) {
    throw ApiError.notFound('Room not found');
  }

  if (input.roomNumber !== undefined) {
    await assertRoomNumberAvailable(input.roomNumber, id);
    room.roomNumber = input.roomNumber;
  }
  if (input.floor !== undefined) room.floor = input.floor;
  if (input.type !== undefined) room.type = input.type;
  if (input.capacity !== undefined) room.capacity = input.capacity;
  if (input.monthlyRent !== undefined) room.monthlyRent = input.monthlyRent;
  if (Object.hasOwn(input, 'description')) room.description = input.description;

  if (input.status === 'MAINTENANCE') {
    room.status = 'MAINTENANCE';
  } else if (input.status === 'AVAILABLE') {
    room.status = await computeStatusFromOccupancy(id);
  }

  await room.save();
  return room;
}

export async function deleteRoom(id: string): Promise<void> {
  const room = await Room.findById(id);
  if (!room) {
    throw ApiError.notFound('Room not found');
  }

  const hasOccupiedBed = await Bed.exists({ roomId: id, status: 'OCCUPIED' });
  if (hasOccupiedBed) {
    throw ApiError.conflict('Cannot delete a room while any of its beds are occupied');
  }

  await Bed.deleteMany({ roomId: id });
  await Room.findByIdAndDelete(id);
}

export interface RoomStats {
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
}

export async function getRoomStats(): Promise<RoomStats> {
  const [totalRooms, totalBeds, availableBeds] = await Promise.all([
    Room.countDocuments({}),
    Bed.countDocuments({}),
    Bed.countDocuments({ status: 'AVAILABLE' }),
  ]);
  return { totalRooms, totalBeds, availableBeds };
}

type PopulatedResident = Pick<IResident, 'name'> & { _id: Types.ObjectId };

export async function listRoomBeds(roomId: string) {
  const room = await Room.findById(roomId);
  if (!room) {
    throw ApiError.notFound('Room not found');
  }
  return Bed.find({ roomId })
    .sort({ label: 1 })
    .populate<{ residentId?: PopulatedResident }>('residentId', 'name');
}

export async function createRoomBed(roomId: string, input: CreateBedInput): Promise<BedDocument> {
  const room = await Room.findById(roomId);
  if (!room) {
    throw ApiError.notFound('Room not found');
  }

  const bedCount = await Bed.countDocuments({ roomId });
  if (bedCount >= MAX_ROOM_CAPACITY) {
    throw ApiError.conflict(`A room cannot have more than ${MAX_ROOM_CAPACITY} beds`);
  }

  const taken = await Bed.exists({ roomId, label: input.label });
  if (taken) {
    throw ApiError.conflict('A bed with this label already exists in this room');
  }

  const bed = await Bed.create({ roomId, label: input.label, status: 'AVAILABLE' });
  await refreshRoomStatus(roomId);
  return bed;
}
