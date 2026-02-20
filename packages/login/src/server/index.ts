// Config
export type { AuthServerConfig, EmailConfig, CreateAuthConfigOptions } from './config.js';
export { createAuthConfig } from './config.js';

// Types
export type {
  JwtPayload,
  AuthUser,
  CreateUserData,
  PasswordResetTokenRecord,
  AuthRepository,
} from './types.js';

// Routes
export { authRouter, validatePassword } from './routes/auth.js';
export { userRouter } from './routes/user.js';

// Middleware
export { createRequireAuth } from './middleware/auth.js';
export type { CsrfMiddleware } from './middleware/csrf.js';
export { createCsrfMiddleware } from './middleware/csrf.js';
export type { RateLimiters } from './middleware/rateLimit.js';
export { createRateLimiters } from './middleware/rateLimit.js';

// Services
export type { EncryptionService } from './services/encryption.js';
export { createEncryptionService } from './services/encryption.js';
export type { EmailService } from './services/email.js';
export { createEmailService } from './services/email.js';
