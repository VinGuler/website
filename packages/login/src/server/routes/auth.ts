import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import type { AuthRepository, JwtPayload } from '../types.js';
import type { AuthServerConfig } from '../config.js';
import { createRequireAuth } from '../middleware/auth.js';
import { createRateLimiters } from '../middleware/rateLimit.js';
import { createEncryptionService } from '../services/encryption.js';
import { createEmailService } from '../services/email.js';
import { type Response } from 'express';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setCookie(res: Response, token: string, cookieName: string): void {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function signToken(payload: JwtPayload, config: AuthServerConfig): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.tokenExpiry as jwt.SignOptions['expiresIn'],
  });
}

/** Returns an error message if the password is invalid, null if valid. */
export function validatePassword(p: string): string | null {
  if (!p || typeof p !== 'string') {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
  }
  // bcrypt silently truncates at 72 bytes; cap well below to avoid silent identity collisions.
  if (p.length > 1000) {
    return 'Password is too long';
  }
  if (p.length < 8) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
  }
  if (!/[A-Z]/.test(p)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
  }
  if (!/[a-z]/.test(p)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
  }
  if (!/[0-9]/.test(p)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
  }
  return null;
}

export function authRouter(repo: AuthRepository, config: AuthServerConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(repo, config);
  const { loginLimiter, registerLimiter, forgotPasswordLimiter, resetPasswordLimiter } =
    createRateLimiters();
  const { encryptEmail, hashEmail, decryptEmail } = createEncryptionService(config);
  const { sendPasswordResetEmail } = createEmailService(config);

  // POST /register
  router.post('/register', registerLimiter, async (req, res) => {
    try {
      const { username, displayName, password, email } = req.body;

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

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ success: false, error: passwordError });
        return;
      }

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        res.status(400).json({ success: false, error: 'A valid email address is required' });
        return;
      }

      const emailHash = hashEmail(email);
      const emailEncrypted = encryptEmail(email.trim().toLowerCase());
      const passwordHash = await bcrypt.hash(password, config.saltRounds);

      const result = await repo.createUser({
        username,
        displayName: trimmedDisplayName,
        passwordHash,
        emailHash,
        emailEncrypted,
      });

      const token = signToken(
        { id: result.id, username: result.username, tokenVersion: result.tokenVersion },
        config
      );
      setCookie(res, token, config.cookieName);

      res.json({
        success: true,
        data: {
          id: result.id,
          username: result.username,
          displayName: result.displayName,
        },
      });
    } catch (err: unknown) {
      const e = err as { code?: string; meta?: { target?: string[] | string } };
      if (e?.code === 'P2002') {
        const target = e?.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(',') : String(target ?? '');
        const field = targetStr.includes('email_hash')
          ? 'Email already registered'
          : 'Username already taken';
        res.status(409).json({ success: false, error: field });
        return;
      }
      throw err;
    }
  });

  // POST /login
  router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }

    if (password.length > 1000) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const user = await repo.findUserByUsername(username);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const token = signToken(
      { id: user.id, username: user.username, tokenVersion: user.tokenVersion },
      config
    );
    setCookie(res, token, config.cookieName);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  });

  // POST /logout — invalidate all sessions by incrementing tokenVersion
  router.post('/logout', requireAuth, async (req, res) => {
    await repo.incrementTokenVersion(req.user!.id);
    res.clearCookie(config.cookieName, { path: '/' });
    res.json({ success: true });
  });

  // GET /me — return current user
  router.get('/me', requireAuth, async (req, res) => {
    const user = await repo.findUserById(req.user!.id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  });

  // POST /forgot-password — always 200 to prevent username enumeration
  router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ success: false, error: 'Username is required' });
      return;
    }

    const user = await repo.findUserByUsername(username);
    if (!user) {
      res.json({ success: true });
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + config.resetTokenExpiryMs);

    await repo.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

    if (!user.emailEncrypted) {
      console.warn(`[forgot-password] user ${user.id} has no email on record`);
      res.json({ success: true });
      return;
    }

    const email = decryptEmail(user.emailEncrypted);
    const resetUrl = `${config.appBaseUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
      console.info(`[forgot-password] reset email sent to user ${user.id}`);
    } catch (err) {
      console.error('[forgot-password] failed to send reset email:', err);
    }

    res.json({ success: true });
  });

  // POST /reset-password — validate token, update password
  router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Reset token is required' });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400).json({ success: false, error: passwordError });
      return;
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await repo.findValidResetToken(tokenHash);

    if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, config.saltRounds);

    await repo.markResetTokenUsed(record.id);
    await repo.updatePasswordAndInvalidateSessions(record.userId, passwordHash);

    res.json({ success: true });
  });

  return router;
}
