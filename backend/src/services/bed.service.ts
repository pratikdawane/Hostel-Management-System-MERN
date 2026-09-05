import { Bed, type BedDocument } from '../models/bed.model.js';
import { ApiError } from '../utils/ApiError.js';
import { refreshRoomStatus } from './room.service.js';
import type { UpdateBedInput } from '../validators/bed.validator.js';

export async function updateBed(id: string, input: UpdateBedInput): Promise<BedDocument> {
  const bed = await Bed.findById(id);
  if (!bed) {
    throw ApiError.notFound('Bed not found');
  }

  if (bed.status === 'OCCUPIED' && input.status !== undefined) {
    throw ApiError.conflict('Unassign the resident from this bed before changing its status');
  }

  if (input.label !== undefined) {
    const taken = await Bed.exists({ roomId: bed.roomId, label: input.label, _id: { $ne: id } });
    if (taken) {
      throw ApiError.conflict('A bed with this label already exists in this room');
    }
    bed.label = input.label;
  }
  if (input.status !== undefined) {
    bed.status = input.status;
  }

  await bed.save();
  await refreshRoomStatus(String(bed.roomId));
  return bed;
}

export async function deleteBed(id: string): Promise<void> {
  const bed = await Bed.findById(id);
  if (!bed) {
    throw ApiError.notFound('Bed not found');
  }

  if (bed.status === 'OCCUPIED') {
    throw ApiError.conflict('Cannot delete an occupied bed');
  }

  await Bed.findByIdAndDelete(id);
  await refreshRoomStatus(String(bed.roomId));
}
