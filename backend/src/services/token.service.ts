import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../constants/roles.js';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  tokenVersion: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}

const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessTokenOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

type DurationUnit = 's' | 'm' | 'h' | 'd';

const DURATION_UNIT_MS: Record<DurationUnit, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Parses simple durations like "15m" or "7d" (the only formats used in .env.example). */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration "${value}". Expected a format like "15m" or "7d".`);
  }
  const amount = Number(match[1]);
  const unit = match[2] as DurationUnit;
  return amount * DURATION_UNIT_MS[unit];
}

export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
