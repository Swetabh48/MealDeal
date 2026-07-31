/** Optional transactional email — no-ops unless SMTP env is configured */

import nodemailer from 'nodemailer';

export function mailConfigured(): boolean {
  return !!(process.env.EMAIL_SERVER || process.env.SMTP_HOST);
}

export async function sendAppEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!mailConfigured()) {
    return { sent: false, reason: 'Email not configured (set EMAIL_SERVER or SMTP_HOST)' };
  }

  const transporter = process.env.EMAIL_SERVER
    ? nodemailer.createTransport(process.env.EMAIL_SERVER)
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@mealdeal.app';

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || opts.text.replace(/\n/g, '<br/>'),
  });

  return { sent: true };
}
