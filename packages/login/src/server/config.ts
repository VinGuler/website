export interface EmailConfig {
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  emailFrom: string;
}

export interface AuthServerConfig {
  jwtSecret: string;
  tokenExpiry: string;
  saltRounds: number;
  cookieName: string;
  csrfCookieName: string;
  emailHmacKey: string;
  /** AES-256-GCM key as 64 hex chars (32 bytes). */
  emailEncryptionKey: string;
  resetTokenExpiryMs: number;
  /** Used in password reset email subject lines. */
  appName: string;
  /** Base URL for generating password reset links. */
  appBaseUrl: string;
  email: EmailConfig;
}

export interface CreateAuthConfigOptions {
  cookieName: string;
  csrfCookieName: string;
  appName: string;
  appBaseUrl: string;
  emailFrom: string;
  /** Override any other defaults. */
  overrides?: Partial<Omit<AuthServerConfig, 'email'>>;
}

/**
 * Builds an AuthServerConfig by reading environment variables with safe
 * defaults. Apps must supply the required cookie names, app identity, and
 * email sender; secrets are read from env vars.
 */
export function createAuthConfig(options: CreateAuthConfigOptions): AuthServerConfig {
  const { cookieName, csrfCookieName, appName, appBaseUrl, emailFrom, overrides } = options;

  return {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    tokenExpiry: '24h',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
    emailHmacKey: process.env.EMAIL_HMAC_KEY || 'dev-hmac-key-change-me-in-production',
    emailEncryptionKey:
      process.env.EMAIL_ENCRYPTION_KEY ||
      '0000000000000000000000000000000000000000000000000000000000000000',
    resetTokenExpiryMs: 60 * 60 * 1000,
    cookieName,
    csrfCookieName,
    appName,
    appBaseUrl,
    email: {
      resendApiKey: process.env.RESEND_API_KEY || undefined,
      smtpHost: process.env.SMTP_HOST || 'localhost',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER || undefined,
      smtpPass: process.env.SMTP_PASS || undefined,
      emailFrom,
    },
    ...overrides,
  };
}
