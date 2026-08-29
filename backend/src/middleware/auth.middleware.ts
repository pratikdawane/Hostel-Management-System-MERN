import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/token.service.js';
import { User } from '../models/user.model.js';
import type { Role } from '../constants/roles.js';

export async function protect(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = header.slice(7);

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired session');
    }

    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or inactive');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw ApiError.unauthorized('Session expired, please log in again');
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
