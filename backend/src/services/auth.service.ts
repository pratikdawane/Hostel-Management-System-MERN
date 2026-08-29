import { User, type UserDocument } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.service.js';
import type {
  RegisterAdminInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth.validator.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: UserDocument;
}

function issueTokens(user: UserDocument): AuthTokens {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  return { accessToken, refreshToken };
}

export async function registerFirstAdmin(input: RegisterAdminInput): Promise<AuthResult> {
  const existingAdmin = await User.exists({ role: 'admin' });
  if (existingAdmin) {
    throw ApiError.forbidden(
      'Setup has already been completed. Ask an administrator to create your account.',
    );
  }

  const emailTaken = await User.exists({ email: input.email });
  if (emailTaken) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    phone: input.phone,
    role: 'admin',
  });

  return { user, ...issueTokens(user) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+password +tokenVersion');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return { user, ...issueTokens(user) };
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  return { user, ...issueTokens(user) };
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<AuthResult> {
  const user = await User.findById(userId).select('+password +tokenVersion');
  if (!user) {
    throw ApiError.notFound('Account not found');
  }

  const isMatch = await user.comparePassword(input.currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = input.newPassword;
  user.tokenVersion += 1;
  await user.save();

  return { user, ...issueTokens(user) };
}

export async function getCurrentUser(userId: string): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Account not found');
  }
  return user;
}
