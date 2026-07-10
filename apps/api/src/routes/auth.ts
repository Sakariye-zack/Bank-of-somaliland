import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { pool } from '../db/pool';
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshTtlMs } from '../lib/jwt';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const REFRESH_COOKIE = 'bos_refresh';

function setRefreshCookie(res: import('express').Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshTtlMs(),
    path: '/auth',
  });
}

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Email and password are required.' } });
  }
  const { email, password } = parsed.data;

  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active FROM admin_users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  }

  const accessToken = signAccessToken(user.id, user.email, user.role);
  const refreshTokenRaw = crypto.randomUUID() + crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, refreshTokenRaw);

  await pool.query(
    `INSERT INTO admin_refresh_tokens (admin_user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)`,
    [user.id, hashToken(refreshToken), refreshTtlMs()]
  );

  setRefreshCookie(res, refreshToken);
  res.json({
    access_token: accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: { code: 'NO_REFRESH_TOKEN', message: 'Missing refresh token.' } });
  }

  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalid or expired.' } });
  }

  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT id FROM admin_refresh_tokens
     WHERE admin_user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > now()`,
    [payload.sub, tokenHash]
  );
  if (rows.length === 0) {
    return res.status(401).json({ error: { code: 'REFRESH_TOKEN_REVOKED', message: 'Refresh token no longer valid.' } });
  }

  // Rotate: revoke the used token, issue a new one.
  await pool.query('UPDATE admin_refresh_tokens SET revoked_at = now() WHERE id = $1', [rows[0].id]);

  const userRes = await pool.query(
    'SELECT id, email, role, is_active FROM admin_users WHERE id = $1',
    [payload.sub]
  );
  const user = userRes.rows[0];
  if (!user || !user.is_active) {
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    return res.status(401).json({ error: { code: 'USER_INACTIVE', message: 'Account is no longer active.' } });
  }

  const newRefreshRaw = crypto.randomUUID() + crypto.randomUUID();
  const newRefreshToken = signRefreshToken(user.id, newRefreshRaw);
  await pool.query(
    `INSERT INTO admin_refresh_tokens (admin_user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)`,
    [user.id, hashToken(newRefreshToken), refreshTtlMs()]
  );
  setRefreshCookie(res, newRefreshToken);

  const accessToken = signAccessToken(user.id, user.email, user.role);
  res.json({ access_token: accessToken });
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await pool.query(
      'UPDATE admin_refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [hashToken(token)]
    );
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  res.status(204).send();
});
