import mongoose, { type Types } from 'mongoose';
import { RoomAllocation, type RoomAllocationDocument } from '../models/allocation.model.js';
import { Resident, type IResident } from '../models/resident.model.js';
import { Room, type IRoom } from '../models/room.model.js';
import { Bed, type IBed } from '../models/bed.model.js';
import { ApiError } from '../utils/ApiError.js';
import { refreshRoomStatus } from './room.service.js';
import type {
  CreateAllocationInput,
  ListAllocationsQuery,
} from '../validators/allocation.validator.js';

export async function createAllocation(
  input: CreateAllocationInput,
  createdBy: string,
): Promise<RoomAllocationDocument> {
  const [resident, room, bed] = await Promise.all([
    Resident.findById(input.residentId),
    Room.findById(input.roomId),
    Bed.findById(input.bedId),
  ]);

  if (!resident) {
    throw ApiError.notFound('Resident not found');
  }
  if (!room) {
    throw ApiError.notFound('Room not found');
  }
  if (!bed) {
    throw ApiError.notFound('Bed not found');
  }
  if (String(bed.roomId) !== String(room._id)) {
    throw ApiError.badRequest('This bed does not belong to the selected room');
  }
  if (bed.status === 'OCCUPIED') {
    throw ApiError.conflict('Bed is already occupied.');
  }
  if (bed.status === 'MAINTENANCE') {
    throw ApiError.conflict('Bed is currently under maintenance.');
  }

  const [hasActiveElsewhere, activeRoomCount] = await Promise.all([
    RoomAllocation.exists({ residentId: resident._id, status: 'ACTIVE' }),
    RoomAllocation.countDocuments({ roomId: room._id, status: 'ACTIVE' }),
  ]);
  if (hasActiveElsewhere) {
    throw ApiError.conflict('This resident already has an active room allocation.');
  }
  if (activeRoomCount >= room.capacity) {
    throw ApiError.conflict('This room has reached its bed capacity.');
  }

  const session = await mongoose.startSession();
  try {
    let allocation!: RoomAllocationDocument;
    await session.withTransaction(async () => {
      const bedUpdate = await Bed.updateOne(
        { _id: bed._id, status: 'AVAILABLE' },
        { $set: { status: 'OCCUPIED', residentId: resident._id } },
        { session },
      );
      if (bedUpdate.matchedCount === 0) {
        throw ApiError.conflict('Bed is already occupied.');
      }

      const created = await RoomAllocation.create(
        [
          {
            residentId: resident._id,
            roomId: room._id,
            bedId: bed._id,
            checkInDate: input.checkInDate,
            expectedCheckOutDate: input.expectedCheckOutDate,
            monthlyRent: input.monthlyRent,
            securityDeposit: input.securityDeposit,
            status: 'ACTIVE',
            createdBy,
          },
        ],
        { session },
      );
      allocation = created[0]!;

      await Resident.updateOne(
        { _id: resident._id },
        { $set: { status: 'ACTIVE' } },
        { session },
      );
    });

    await refreshRoomStatus(String(room._id));
    return allocation;
  } finally {
    await session.endSession();
  }
}

export interface AllocationListItem {
  id: string;
  resident: { id: string; name: string } | null;
  room: { id: string; roomNumber: string; floor: number } | null;
  bed: { id: string; label: string } | null;
  checkInDate: Date;
  expectedCheckOutDate?: Date;
  actualCheckOutDate?: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: RoomAllocationDocument['status'];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedAllocations {
  allocations: AllocationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PopulatedResident = Pick<IResident, 'name'> & { _id: Types.ObjectId };
type PopulatedRoom = Pick<IRoom, 'roomNumber' | 'floor'> & { _id: Types.ObjectId };
type PopulatedBed = Pick<IBed, 'label'> & { _id: Types.ObjectId };

export async function listAllocations(
  query: ListAllocationsQuery,
): Promise<PaginatedAllocations> {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.roomId) filter.roomId = query.roomId;

  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await Promise.all([
    RoomAllocation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate<{ residentId: PopulatedResident | null }>('residentId', 'name')
      .populate<{ roomId: PopulatedRoom | null }>('roomId', 'roomNumber floor')
      .populate<{ bedId: PopulatedBed | null }>('bedId', 'label'),
    RoomAllocation.countDocuments(filter),
  ]);

  const allocations: AllocationListItem[] = rows.map((row) => ({
    id: String(row._id),
    resident: row.residentId ? { id: String(row.residentId._id), name: row.residentId.name } : null,
    room: row.roomId
      ? { id: String(row.roomId._id), roomNumber: row.roomId.roomNumber, floor: row.roomId.floor }
      : null,
    bed: row.bedId ? { id: String(row.bedId._id), label: row.bedId.label } : null,
    checkInDate: row.checkInDate,
    expectedCheckOutDate: row.expectedCheckOutDate,
    actualCheckOutDate: row.actualCheckOutDate,
    monthlyRent: row.monthlyRent,
    securityDeposit: row.securityDeposit,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return {
    allocations,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function cancelAllocation(id: string): Promise<RoomAllocationDocument> {
  const allocation = await RoomAllocation.findById(id);
  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }
  if (allocation.status !== 'ACTIVE') {
    throw ApiError.conflict('Only an active allocation can be cancelled');
  }

  allocation.status = 'CANCELLED';
  await allocation.save();

  await Bed.updateOne(
    { _id: allocation.bedId, status: 'OCCUPIED' },
    { $set: { status: 'AVAILABLE' }, $unset: { residentId: 1 } },
  );
  await refreshRoomStatus(String(allocation.roomId));

  return allocation;
}
