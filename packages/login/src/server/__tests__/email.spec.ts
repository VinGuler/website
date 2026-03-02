import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEmailService } from '../services/email.js';
import { createTestConfig } from './helpers.js';

// Mock nodemailer
vi.mock('nodemailer', () => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
  return {
    default: {
      createTransport: vi.fn(() => ({ sendMail })),
    },
  };
});

describe('createEmailService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('uses Resend API when resendApiKey is configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch;

    const config = createTestConfig({
      email: {
        resendApiKey: 'test-resend-key',
        emailFrom: 'test@example.com',
      },
    });
    const { sendPasswordResetEmail } = createEmailService(config);

    await sendPasswordResetEmail('user@example.com', 'https://example.com/reset?token=abc');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-resend-key');
    const body = JSON.parse(options.body);
    expect(body.to).toBe('user@example.com');
    expect(body.from).toBe('test@example.com');
    expect(body.text).toContain('https://example.com/reset?token=abc');
  });

  it('throws on Resend API error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => 'fail' });

    const config = createTestConfig({
      email: {
        resendApiKey: 'test-resend-key',
        emailFrom: 'test@example.com',
      },
    });
    const { sendPasswordResetEmail } = createEmailService(config);

    await expect(
      sendPasswordResetEmail('user@example.com', 'https://example.com/reset')
    ).rejects.toThrow('Resend API error 500');
  });

  it('uses SMTP (nodemailer) when no resendApiKey', async () => {
    const nodemailer = await import('nodemailer');
    const config = createTestConfig();
    const { sendPasswordResetEmail } = createEmailService(config);

    await sendPasswordResetEmail('user@example.com', 'https://example.com/reset?token=abc');

    expect(nodemailer.default.createTransport).toHaveBeenCalledOnce();
    const transport = (nodemailer.default.createTransport as ReturnType<typeof vi.fn>).mock
      .results[0].value;
    expect(transport.sendMail).toHaveBeenCalledOnce();
    const mailOptions = transport.sendMail.mock.calls[0][0];
    expect(mailOptions.to).toBe('user@example.com');
    expect(mailOptions.from).toBe('test@example.com');
    expect(mailOptions.text).toContain('https://example.com/reset?token=abc');
  });
});
