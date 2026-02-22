import { logger } from '@/lib/logger';
/**
 * Email Service
 * Simple email wrapper service
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string }> {
  // This is a stub - implement with your email provider
  logger.info('Sending email', { to: options.to, subject: options.subject });
  return { success: true, id: 'stub-email-id' };
}
