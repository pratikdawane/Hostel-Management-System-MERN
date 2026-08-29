import { User, type UserDocument } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import type { CreateUserInput, ListUsersQuery } from '../validators/user.validator.js';

export async function createUser(
  input: CreateUserInput,
  createdBy: string,
): Promise<UserDocument> {
  const emailTaken = await User.exists({ email: input.email });
  if (emailTaken) {
    throw ApiError.conflict('An account with this email already exists');
  }

  return User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
    phone: input.phone,
    createdBy,
  });
}

export interface PaginatedUsers {
  users: UserDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
  const filter = query.role ? { role: query.role } : {};
  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function setUserActiveStatus(
  targetUserId: string,
  isActive: boolean,
  requestingUserId: string,
): Promise<UserDocument> {
  if (targetUserId === requestingUserId) {
    throw ApiError.badRequest('You cannot change your own active status');
  }

  const user = await User.findById(targetUserId).select('+tokenVersion');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!isActive && user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdminCount <= 1) {
      throw ApiError.badRequest('Cannot deactivate the only active admin account');
    }
  }

  user.isActive = isActive;
  if (!isActive) {
    user.tokenVersion += 1;
  }
  await user.save();

  return user;
}
