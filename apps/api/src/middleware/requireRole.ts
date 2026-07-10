import type { NextFunction, Request, Response } from 'express';
import type { AdminRole, JwtPayload } from '@bos/shared-types';
import { verifyAccessToken } from '../lib/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Missing token.' } });
    }

    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired.' } });
    }

    if (!allowedRoles.includes(payload.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Role not permitted for this action.' } });
    }

    req.user = payload;
    next();
  };
}
