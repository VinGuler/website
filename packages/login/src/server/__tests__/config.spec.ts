import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAuthConfig } from '../config.js';

describe('createAuthConfig', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.JWT_SECRET;
    delete process.env.SALT_ROUNDS;
    delete process.env.EMAIL_HMAC_KEY;
    delete process.env.EMAIL_ENCRYPTION_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  afterEach(() => {
    Object.assign(process.env, savedEnv);
  });

  it('uses defaults when env vars are not set', () => {
    const config = createAuthConfig({
      cookieName: 'my_auth',
      csrfCookieName: 'my_csrf',
      appName: 'MyApp',
      appBaseUrl: 'http://localhost:3000',
      emailFrom: 'noreply@myapp.com',
    });

    expect(config.jwtSecret).toBe('dev-secret-change-me');
    expect(config.saltRounds).toBe(10);
    expect(config.cookieName).toBe('my_auth');
    expect(config.csrfCookieName).toBe('my_csrf');
    expect(config.appName).toBe('MyApp');
    expect(config.appBaseUrl).toBe('http://localhost:3000');
    expect(config.email.emailFrom).toBe('noreply@myapp.com');
    expect(config.email.smtpHost).toBe('localhost');
    expect(config.email.smtpPort).toBe(587);
    expect(config.tokenExpiry).toBe('24h');
    expect(config.resetTokenExpiryMs).toBe(3_600_000);
  });

  it('reads values from env vars', () => {
    process.env.JWT_SECRET = 'prod-secret';
    process.env.SALT_ROUNDS = '12';
    process.env.EMAIL_HMAC_KEY = 'prod-hmac';
    process.env.RESEND_API_KEY = 're_123';

    const config = createAuthConfig({
      cookieName: 'auth',
      csrfCookieName: 'csrf',
      appName: 'App',
      appBaseUrl: 'https://app.com',
      emailFrom: 'no-reply@app.com',
    });

    expect(config.jwtSecret).toBe('prod-secret');
    expect(config.saltRounds).toBe(12);
    expect(config.emailHmacKey).toBe('prod-hmac');
    expect(config.email.resendApiKey).toBe('re_123');
  });

  it('overrides work correctly', () => {
    const config = createAuthConfig({
      cookieName: 'auth',
      csrfCookieName: 'csrf',
      appName: 'App',
      appBaseUrl: 'https://app.com',
      emailFrom: 'no-reply@app.com',
      overrides: {
        saltRounds: 14,
        tokenExpiry: '1h',
      },
    });

    expect(config.saltRounds).toBe(14);
    expect(config.tokenExpiry).toBe('1h');
  });
});
