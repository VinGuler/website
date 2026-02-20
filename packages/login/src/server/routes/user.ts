import { Router } from 'express';
import bcrypt from 'bcrypt';
import type { AuthRepository } from '../types.js';
import type { AuthServerConfig } from '../config.js';
import { createRequireAuth } from '../middleware/auth.js';
import { createEncryptionService } from '../services/encryption.js';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.length <= 1 ? '*' : local[0] + '***';
  return `${masked}@${domain}`;
}

export function userRouter(repo: AuthRepository, config: AuthServerConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(repo, config);
  const { encryptEmail, decryptEmail, hashEmail } = createEncryptionService(config);

  // GET /me/email — return masked email for authenticated user
  router.get('/me/email', requireAuth, async (req, res) => {
    const user = await repo.findUserById(req.user!.id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (!user.emailEncrypted) {
      res.json({ success: true, data: { maskedEmail: null } });
      return;
    }

    const email = decryptEmail(user.emailEncrypted);
    res.json({ success: true, data: { maskedEmail: maskEmail(email) } });
  });

  // PUT /email — update email (requires current password)
  router.put('/email', requireAuth, async (req, res) => {
    const { currentPassword, newEmail } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.length > 1000) {
      res.status(400).json({ success: false, error: 'Current password is required' });
      return;
    }

    if (!newEmail || typeof newEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      res.status(400).json({ success: false, error: 'A valid email address is required' });
      return;
    }

    const user = await repo.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    try {
      const emailHash = hashEmail(newEmail);
      const emailEncrypted = encryptEmail(newEmail.trim().toLowerCase());

      await repo.updateEmail(user.id, emailHash, emailEncrypted);

      const email = decryptEmail(emailEncrypted);
      res.json({ success: true, data: { maskedEmail: maskEmail(email) } });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'P2002') {
        res.status(409).json({ success: false, error: 'Email already registered' });
        return;
      }
      throw err;
    }
  });

  return router;
}
