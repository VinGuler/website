import nodemailer from 'nodemailer';
import type { AuthServerConfig } from '../config.js';

export interface EmailService {
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
}

export function createEmailService(config: AuthServerConfig): EmailService {
  const { email, appName } = config;

  async function sendViaResend(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: email.emailFrom, to, subject, text, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }
  }

  async function sendViaSmtp(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    const transport = nodemailer.createTransport({
      host: email.smtpHost,
      port: email.smtpPort,
      secure: email.smtpPort === 465,
      auth: email.smtpUser ? { user: email.smtpUser, pass: email.smtpPass } : undefined,
      connectionTimeout: 5000,
      socketTimeout: 10000,
    });
    await transport.sendMail({ from: email.emailFrom, to, subject, text, html });
  }

  async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = `Reset your ${appName} password`;
    const text = `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.`;
    const html = `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request a password reset, you can safely ignore this email.</p>`;

    if (email.resendApiKey) {
      await sendViaResend(to, subject, text, html);
    } else {
      await sendViaSmtp(to, subject, text, html);
    }
  }

  return { sendPasswordResetEmail };
}
