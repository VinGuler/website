import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } from '../config.js';

function createTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 5000,
    socketTimeout: 10000,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Reset your Finance Tracker password',
    text: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.`,
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request a password reset, you can safely ignore this email.</p>`,
  });
}
