import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { AuthServerConfig } from '../config.js';

export interface EncryptionService {
  /** AES-256-GCM encrypt an email address. Returns hex-encoded iv+tag+ciphertext. */
  encryptEmail(plain: string): string;
  /** Decrypt a previously encrypted email. */
  decryptEmail(encoded: string): string;
  /** HMAC-SHA256 of lowercased+trimmed email — used for unique lookups. */
  hashEmail(plain: string): string;
}

export function createEncryptionService(config: AuthServerConfig): EncryptionService {
  const encryptionKey = config.emailEncryptionKey;
  const hmacKey = config.emailHmacKey;

  function encryptEmail(plain: string): string {
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('hex');
  }

  function decryptEmail(encoded: string): string {
    const key = Buffer.from(encryptionKey, 'hex');
    const buf = Buffer.from(encoded, 'hex');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  }

  function hashEmail(plain: string): string {
    return createHmac('sha256', hmacKey).update(plain.trim().toLowerCase()).digest('hex');
  }

  return { encryptEmail, decryptEmail, hashEmail };
}
