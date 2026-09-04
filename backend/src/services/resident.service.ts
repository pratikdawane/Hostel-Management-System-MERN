import { Types } from 'mongoose';
import { Resident, type ResidentDocument } from '../models/resident.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import type {
  CreateResidentInput,
  ListResidentsQuery,
  UpdateResidentInput,
} from '../validators/resident.validator.js';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function assertFieldAvailable(
  field: 'email' | 'studentId',
  value: string | undefined,
  excludeId: string | undefined,
  conflictMessage: string,
): Promise<void> {
  if (!value) return;
  const filter: Record<string, unknown> = { [field]: value };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const taken = await Resident.exists(filter);
  if (taken) {
    throw ApiError.conflict(conflictMessage);
  }
}

function assertEmailAvailable(email: string | undefined, excludeId?: string): Promise<void> {
  return assertFieldAvailable('email', email, excludeId, 'A resident with this email already exists');
}

function assertStudentIdAvailable(studentId: string | undefined, excludeId?: string): Promise<void> {
  return assertFieldAvailable(
    'studentId',
    studentId,
    excludeId,
    'A resident with this student ID already exists',
  );
}

async function applyUserLink(resident: ResidentDocument, userId: string | null): Promise<void> {
  if (userId === null) {
    resident.user = undefined;
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.badRequest('Linked account not found');
  }
  if (user.role !== 'resident') {
    throw ApiError.badRequest('Only accounts with the Resident role can be linked');
  }

  const alreadyLinked = await Resident.exists({
    user: user.id,
    _id: { $ne: resident._id },
  });
  if (alreadyLinked) {
    throw ApiError.conflict('This account is already linked to another resident');
  }

  resident.user = new Types.ObjectId(user.id);
}

export async function createResident(
  input: CreateResidentInput,
  createdBy: string,
): Promise<ResidentDocument> {
  await assertEmailAvailable(input.email);
  await assertStudentIdAvailable(input.studentId);

  return Resident.create({ ...input, createdBy });
}

export interface PaginatedResidents {
  residents: ResidentDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listResidents(query: ListResidentsQuery): Promise<PaginatedResidents> {
  const filter: Record<string, unknown> = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [
      { name: pattern },
      { phone: pattern },
      { email: pattern },
      { studentId: pattern },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [residents, total] = await Promise.all([
    Resident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Resident.countDocuments(filter),
  ]);

  return {
    residents,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getResidentById(id: string): Promise<ResidentDocument> {
  const resident = await Resident.findById(id);
  if (!resident) {
    throw ApiError.notFound('Resident not found');
  }
  return resident;
}

export async function updateResident(
  id: string,
  input: UpdateResidentInput,
): Promise<ResidentDocument> {
  const resident = await Resident.findById(id);
  if (!resident) {
    throw ApiError.notFound('Resident not found');
  }

  if (Object.hasOwn(input, 'email')) {
    await assertEmailAvailable(input.email, id);
    resident.email = input.email;
  }
  if (Object.hasOwn(input, 'studentId')) {
    await assertStudentIdAvailable(input.studentId, id);
    resident.studentId = input.studentId;
  }
  if (input.name !== undefined) {
    resident.name = input.name;
  }
  if (Object.hasOwn(input, 'phone')) resident.phone = input.phone;
  if (Object.hasOwn(input, 'gender')) resident.gender = input.gender;
  if (Object.hasOwn(input, 'dateOfBirth')) resident.dateOfBirth = input.dateOfBirth;
  if (Object.hasOwn(input, 'address')) resident.address = input.address;
  if (Object.hasOwn(input, 'emergencyContact')) resident.emergencyContact = input.emergencyContact;
  if (Object.hasOwn(input, 'college')) resident.college = input.college;
  if (Object.hasOwn(input, 'course')) resident.course = input.course;
  if (Object.hasOwn(input, 'profileImage')) resident.profileImage = input.profileImage;
  if (input.status !== undefined) {
    resident.status = input.status;
  }
  if (Object.hasOwn(input, 'userId')) {
    await applyUserLink(resident, input.userId ?? null);
  }

  await resident.save();
  return resident;
}

export async function deleteResident(id: string): Promise<void> {
  const resident = await Resident.findByIdAndDelete(id);
  if (!resident) {
    throw ApiError.notFound('Resident not found');
  }
}

export interface ResidentStats {
  total: number;
  active: number;
}

export async function getResidentStats(): Promise<ResidentStats> {
  const [total, active] = await Promise.all([
    Resident.countDocuments({}),
    Resident.countDocuments({ status: 'ACTIVE' }),
  ]);
  return { total, active };
}
