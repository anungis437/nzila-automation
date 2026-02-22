/**
 * Email Service for Union Claims
 * 
 * Handles sending transactional emails via Resend
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// Lazy initialize Resend client to avoid errors during build
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@unionclaims.com';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || 'support@unionclaims.com';

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

/**
 * Send an email via Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = REPLY_TO_EMAIL,
  attachments,
}: SendEmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Check if email service is configured
    const client = getResendClient();
    if (!client) {
      logger.warn('RESEND_API_KEY not configured - email not sent');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Send email
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: to.map(recipient => `${recipient.name} <${recipient.email}>`),
      subject,
      html,
      text: text || stripHtml(html), // Fallback to plain text version
      replyTo,
      attachments,
    });

    if (error) {
      logger.error('Error sending email', error instanceof Error ? error : new Error(error.message || 'Failed to send email'));
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    logger.error('Exception sending email', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simple HTML tag stripper for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get recipient list with validation
 */
export function getValidRecipients(recipients: EmailRecipient[]): EmailRecipient[] {
  return recipients.filter(recipient => {
    if (!isValidEmail(recipient.email)) {
      logger.warn('Invalid email address', { email: recipient.email });
      return false;
    }
    return true;
  });
}

