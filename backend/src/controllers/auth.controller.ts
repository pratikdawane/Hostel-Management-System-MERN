import type { CookieOptions, Request, Response } from 'express';
import { isProduction } from '../config/env.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as authService from '../services/auth.service.js';
import { REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '../services/token.service.js';
import type {
  RegisterAdminInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth.validator.js';
import type { UserDocument } from '../models/user.model.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/api/auth',
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions,
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
}

interface AuthResultLike {
  user: UserDocument;
  accessToken: string;
  refreshToken: string;
}

function sendAuthResponse(
  res: Response,
  statusCode: number,
  message: string,
  result: AuthResultLike,
): void {
  setRefreshCookie(res, result.refreshToken);
  res
    .status(statusCode)
    .json(
      new ApiResponse(statusCode, { user: result.user, accessToken: result.accessToken }, message),
    );
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterAdminInput;
  const result = await authService.registerFirstAdmin(input);
  sendAuthResponse(res, 201, 'Admin account created', result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  sendAuthResponse(res, 200, 'Logged in successfully', result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    throw ApiError.unauthorized('No active session');
  }
  const result = await authService.refreshSession(token);
  sendAuthResponse(res, 200, 'Session refreshed', result);
}

export function logout(_req: Request, res: Response): void {
  clearRefreshCookie(res);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json(new ApiResponse(200, { user }, 'Current user'));
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as ChangePasswordInput;
  const result = await authService.changePassword(req.user.id, input);
  sendAuthResponse(res, 200, 'Password changed successfully', result);
}
