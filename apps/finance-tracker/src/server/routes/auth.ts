import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@workspace/database';
import { JWT_SECRET, SALT_ROUNDS, TOKEN_EXPIRY, COOKIE_NAME } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import type { JwtPayload } from '../types.js';
import { type Response } from 'express';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

function setCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function authRouter(prisma: PrismaClient): Router {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { username, displayName, password } = req.body;

      // Validation
      if (!username || !USERNAME_REGEX.test(username)) {
        res.status(400).json({
          success: false,
          error: 'Username must be 3-30 characters, alphanumeric and underscores only',
        });
        return;
      }

      const trimmedDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
      if (!trimmedDisplayName || trimmedDisplayName.length > 50) {
        res.status(400).json({
          success: false,
          error: 'Display name must be 1-50 characters',
        });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user, workspace, and ownership in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            displayName: trimmedDisplayName,
            passwordHash,
          },
        });

        const workspace = await tx.workspace.create({
          data: { balance: 0 },
        });

        await tx.workspaceUser.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            permission: 'OWNER',
          },
        });

        return user;
      });

      const token = signToken({ id: result.id, username: result.username });
      setCookie(res, token);

      res.json({
        success: true,
        data: {
          id: result.id,
          username: result.username,
          displayName: result.displayName,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        res.status(409).json({ success: false, error: 'Username already taken' });
        return;
      }
      throw err;
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const token = signToken({ id: user.id, username: user.username });
    setCookie(res, token);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  });

  // POST /api/auth/logout
  router.post('/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  });

  // GET /api/auth/me
  router.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, displayName: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Re-sign JWT for sliding expiry
    const token = signToken({ id: user.id, username: user.username });
    setCookie(res, token);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  });

  return router;
}
