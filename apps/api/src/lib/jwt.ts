import jwt from 'jsonwebtoken';
import type { AdminRole, JwtPayload } from '@bos/shared-types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '60m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET / JWT_REFRESH_SECRET must be set');
}

export function signAccessToken(sub: string, email: string, role: AdminRole): string {
  return jwt.sign({ sub, email, role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(sub: string, jti: string): string {
  return jwt.sign({ sub, jti }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string; jti: string };
}

export function refreshTtlMs(): number {
  const match = /^(\d+)([smhd])$/.exec(REFRESH_TTL);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return value * multiplier;
}
