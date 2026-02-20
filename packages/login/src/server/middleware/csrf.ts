import crypto from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';
import type { AuthServerConfig } from '../config.js';

const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface CsrfMiddleware {
  /**
   * Sets a CSRF token cookie if one isn't already present. The cookie is
   * readable by client JS (not httpOnly) so the SPA can send it back in a
   * header on state-changing requests.
   */
  setCsrfCookie: (req: Request, res: Response, next: NextFunction) => void;
  /**
   * Double-submit cookie CSRF protection. Validates that the X-CSRF-Token
   * header matches the CSRF cookie on all non-safe requests to /api/*.
   */
  csrfProtection: (req: Request, res: Response, next: NextFunction) => void;
}

export function createCsrfMiddleware(config: AuthServerConfig): CsrfMiddleware {
  const csrfCookie = config.csrfCookieName;

  function setCsrfCookie(req: Request, res: Response, next: NextFunction): void {
    if (!req.cookies[csrfCookie]) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(csrfCookie, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }
    next();
  }

  function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    if (!req.path.startsWith('/api/')) {
      next();
      return;
    }

    const cookieToken = req.cookies[csrfCookie];
    const headerToken = req.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      res.status(403).json({ success: false, error: 'Invalid CSRF token' });
      return;
    }

    next();
  }

  return { setCsrfCookie, csrfProtection };
}
