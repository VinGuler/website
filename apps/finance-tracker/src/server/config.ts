if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

if (process.env.NODE_ENV === 'production' && !process.env.EMAIL_HMAC_KEY) {
  throw new Error('EMAIL_HMAC_KEY environment variable is required in production');
}

if (process.env.NODE_ENV === 'production' && !process.env.EMAIL_ENCRYPTION_KEY) {
  throw new Error('EMAIL_ENCRYPTION_KEY environment variable is required in production');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
export const TOKEN_EXPIRY = '24h';
export const COOKIE_NAME = 'ft_token';

// Email encryption — 32-byte hex key (64 hex chars). The dev default is for local use only.
export const EMAIL_HMAC_KEY = process.env.EMAIL_HMAC_KEY || 'dev-hmac-key-change-me-in-production';
export const EMAIL_ENCRYPTION_KEY =
  process.env.EMAIL_ENCRYPTION_KEY ||
  '0000000000000000000000000000000000000000000000000000000000000000';

// Resend HTTP API (preferred — avoids SMTP port-blocking on Railway)
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// SMTP fallback (used only when RESEND_API_KEY is not set)
export const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@finance-tracker.local';

export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5174';

// Reset token valid for 1 hour
export const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
