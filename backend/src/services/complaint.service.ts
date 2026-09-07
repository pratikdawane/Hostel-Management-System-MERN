import type { Types } from 'mongoose';
import { Complaint, type ComplaintDocument } from '../models/complaint.model.js';
import { Resident, type IResident } from '../models/resident.model.js';
import { PENDING_COMPLAINT_STATUSES } from '../constants/complaint.js';
import { ApiError } from '../utils/ApiError.js';
import type { Role } from '../constants/roles.js';
import type {
  CreateComplaintInput,
  ListComplaintsQuery,
  UpdateComplaintInput,
} from '../validators/complaint.validator.js';

interface AuthUser {
  id: string;
  role: Role;
}

async function resolveOwnResidentId(userId: string): Promise<Types.ObjectId> {
  const resident = await Resident.findOne({ user: userId }).select('_id');
  if (!resident) {
    throw ApiError.forbidden('No resident profile is linked to your account yet');
  }
  return resident._id;
}

export interface ComplaintListItem {
  id: string;
  resident: { id: string; name: string } | null;
  title: string;
  description: string;
  category: ComplaintDocument['category'];
  priority: ComplaintDocument['priority'];
  status: ComplaintDocument['status'];
  assignedStaffName?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedComplaints {
  complaints: ComplaintListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PopulatedResident = Pick<IResident, 'name'> & { _id: Types.ObjectId };
type PopulatedComplaint = Omit<ComplaintDocument, 'residentId'> & {
  residentId: PopulatedResident | null;
};

function toListItem(row: PopulatedComplaint): ComplaintListItem {
  return {
    id: String(row._id),
    resident: row.residentId ? { id: String(row.residentId._id), name: row.residentId.name } : null,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    assignedStaffName: row.assignedStaffName,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createComplaint(
  input: CreateComplaintInput,
  user: AuthUser,
): Promise<ComplaintDocument> {
  let residentId: Types.ObjectId;

  if (user.role === 'resident') {
    residentId = await resolveOwnResidentId(user.id);
  } else {
    if (!input.residentId) {
      throw ApiError.badRequest('residentId is required when filing on behalf of a resident');
    }
    const resident = await Resident.findById(input.residentId).select('_id');
    if (!resident) {
      throw ApiError.notFound('Resident not found');
    }
    residentId = resident._id;
  }

  return Complaint.create({
    residentId,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    createdBy: user.id,
  });
}

export async function listComplaints(
  query: ListComplaintsQuery,
  user: AuthUser,
): Promise<PaginatedComplaints> {
  const filter: Record<string, unknown> = {};

  if (user.role === 'resident') {
    filter.residentId = await resolveOwnResidentId(user.id);
  } else if (query.residentId) {
    filter.residentId = query.residentId;
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate<{ residentId: PopulatedResident | null }>('residentId', 'name'),
    Complaint.countDocuments(filter),
  ]);

  return {
    complaints: rows.map((row) => toListItem(row as unknown as PopulatedComplaint)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getComplaintById(id: string, user: AuthUser): Promise<ComplaintListItem> {
  const row = await Complaint.findById(id).populate<{ residentId: PopulatedResident | null }>(
    'residentId',
    'name',
  );

  if (!row) {
    throw ApiError.notFound('Complaint not found');
  }

  if (user.role === 'resident') {
    const ownResidentId = await resolveOwnResidentId(user.id);
    if (String(row.residentId?._id) !== String(ownResidentId)) {
      throw ApiError.notFound('Complaint not found');
    }
  }

  return toListItem(row as unknown as PopulatedComplaint);
}

export async function updateComplaint(
  id: string,
  input: UpdateComplaintInput,
): Promise<ComplaintListItem> {
  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  if (input.status) {
    complaint.status = input.status;
    if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
      complaint.resolvedAt = complaint.resolvedAt ?? new Date();
    } else {
      complaint.resolvedAt = undefined;
    }
  }

  if (input.priority) {
    complaint.priority = input.priority;
  }

  if (input.assignedStaffName !== undefined) {
    complaint.assignedStaffName = input.assignedStaffName || undefined;
  }

  await complaint.save();
  const populated = await complaint.populate<{ residentId: PopulatedResident | null }>(
    'residentId',
    'name',
  );

  return toListItem(populated as unknown as PopulatedComplaint);
}

export async function deleteComplaint(id: string): Promise<void> {
  const result = await Complaint.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Complaint not found');
  }
}

export interface ComplaintStats {
  pending: number;
  total: number;
}

export async function getComplaintStats(user: AuthUser): Promise<ComplaintStats> {
  const filter: Record<string, unknown> = {};

  if (user.role === 'resident') {
    filter.residentId = await resolveOwnResidentId(user.id);
  }

  const [pending, total] = await Promise.all([
    Complaint.countDocuments({ ...filter, status: { $in: PENDING_COMPLAINT_STATUSES } }),
    Complaint.countDocuments(filter),
  ]);

  return { pending, total };
}
