import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the template root before any tests import the server
config({ path: resolve(__dirname, '../../.env') });

// Ensure email service uses fetch (mocked in tests) instead of SMTP
process.env.RESEND_API_KEY ??= 'test-fake-key';

// Speed up bcrypt hashing in tests (default 10 rounds is intentionally slow)
process.env.SALT_ROUNDS ??= '1';
