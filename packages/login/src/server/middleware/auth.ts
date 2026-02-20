import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRepository, JwtPayload } from '../types.js';
import type { AuthServerConfig } from '../config.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number; username: string };
  }
}

export function createRequireAuth(repo: AuthRepository, config: AuthServerConfig) {
  return async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const token = req.cookies?.[config.cookieName];

    if (!token) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      const tokenVersion = await repo.getUserTokenVersion(decoded.id);

      if (tokenVersion === null || tokenVersion !== decoded.tokenVersion) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      req.user = { id: decoded.id, username: decoded.username };
      next();
    } catch {
      res.status(401).json({ success: false, error: 'Not authenticated' });
    }
  };
}
