import { describe, it, expect } from 'vitest';
import { createEncryptionService } from '../services/encryption.js';
import { createTestConfig } from './helpers.js';

describe('createEncryptionService', () => {
  const config = createTestConfig();
  const { encryptEmail, decryptEmail, hashEmail } = createEncryptionService(config);

  it('encrypt/decrypt round-trip produces original email', () => {
    const email = 'alice@example.com';
    const encrypted = encryptEmail(email);
    expect(decryptEmail(encrypted)).toBe(email);
  });

  it('different plaintexts produce different ciphertexts', () => {
    const a = encryptEmail('alice@example.com');
    const b = encryptEmail('bob@example.com');
    expect(a).not.toBe(b);
  });

  it('same plaintext produces different ciphertexts (random IV)', () => {
    const a = encryptEmail('alice@example.com');
    const b = encryptEmail('alice@example.com');
    expect(a).not.toBe(b);
  });

  it('hashEmail is deterministic for same input', () => {
    const a = hashEmail('alice@example.com');
    const b = hashEmail('alice@example.com');
    expect(a).toBe(b);
  });

  it('hashEmail normalizes (trim + lowercase)', () => {
    const a = hashEmail('  Alice@Example.COM  ');
    const b = hashEmail('alice@example.com');
    expect(a).toBe(b);
  });

  it('tampered ciphertext throws on decrypt', () => {
    const encrypted = encryptEmail('alice@example.com');
    // Flip a byte in the ciphertext portion (past iv+tag = 56 hex chars)
    const tampered =
      encrypted.substring(0, 58) + (encrypted[58] === '0' ? '1' : '0') + encrypted.substring(59);
    expect(() => decryptEmail(tampered)).toThrow();
  });
});
