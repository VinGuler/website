import rateLimit from 'express-rate-limit';
import { type Request, type Response, type NextFunction } from 'express';

const isTest = process.env.NODE_ENV === 'test';

function noopMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}

function createLimiter(options: Parameters<typeof rateLimit>[0]) {
  return isTest ? noopMiddleware : rateLimit(options);
}

export interface RateLimiters {
  loginLimiter: (req: Request, res: Response, next: NextFunction) => void;
  registerLimiter: (req: Request, res: Response, next: NextFunction) => void;
  forgotPasswordLimiter: (req: Request, res: Response, next: NextFunction) => void;
  resetPasswordLimiter: (req: Request, res: Response, next: NextFunction) => void;
  userSearchLimiter: (req: Request, res: Response, next: NextFunction) => void;
}

export function createRateLimiters(): RateLimiters {
  return {
    // 5 attempts per 15 minutes per IP
    loginLimiter: createLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, error: 'Too many login attempts, please try again later' },
    }),

    // 3 per hour per IP
    registerLimiter: createLimiter({
      windowMs: 60 * 60 * 1000,
      limit: 3,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many registration attempts, please try again later',
      },
    }),

    // 3 per hour per IP
    forgotPasswordLimiter: createLimiter({
      windowMs: 60 * 60 * 1000,
      limit: 3,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many password reset requests, please try again later',
      },
    }),

    // 3 per hour per IP
    resetPasswordLimiter: createLimiter({
      windowMs: 60 * 60 * 1000,
      limit: 3,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many password reset attempts, please try again later',
      },
    }),

    // 20 per minute per IP
    userSearchLimiter: createLimiter({
      windowMs: 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, error: 'Too many search requests, please try again later' },
    }),
  };
}
