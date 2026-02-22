/**
 * Firebase Cloud Messaging (FCM) Provider
 * 
 * Handles Android and Web push notifications using FCM HTTP API
 */

import { logger } from '@/lib/logger';

interface FCMConfig {
  serverKey: string;
  projectId?: string;
}

interface FCMPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: number;
  sound?: string;
  color?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  priority?: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface FCMBatchResponse {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

/**
 * FCM Provider for Android/Web Push Notifications
 */
export class FCMProvider {
  private config: FCMConfig;
  private fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';

  constructor(config: FCMConfig) {
    this.config = config;
  }

  /**
   * Send push notification to device
   */
  async send(deviceToken: string, payload: FCMPayload): Promise<FCMResponse> {
    try {
      const fcmPayload = this.buildPayload(payload);

      const response = await fetch(this.fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: deviceToken,
          ...fcmPayload,
        }),
      });

      const result = await response.json();

      if (result.success === 1) {
        logger.info('FCM notification sent', { 
          messageId: result.message_id,
          deviceToken: deviceToken.slice(0, 8)
        });
        
        return {
          success: true,
          messageId: result.message_id
        };
      } else {
        const error = result.error || 'Unknown error';
        logger.error('FCM notification failed', { error, result });
        
        return {
          success: false,
          error
        };
      }
    } catch (error) {
      logger.error('FCM send error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send to multiple devices (up to 500)
   */
  async sendBatch(deviceTokens: string[], payload: FCMPayload): Promise<FCMBatchResponse> {
    try {
      const fcmPayload = this.buildPayload(payload);

      // FCM supports up to 500 tokens per batch
      const chunks = this.chunkArray(deviceTokens, 500);
      
      let totalSuccess = 0;
      let totalFailed = 0;
      const allErrors: Array<{ index: number; error: string }> = [];

      for (const chunk of chunks) {
        const response = await fetch(this.fcmEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `key=${this.config.serverKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_ids: chunk,
            ...fcmPayload,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          totalSuccess += result.success;
        }
        
        if (result.failure) {
          totalFailed += result.failure;
        }

        if (result.results) {
          result.results.forEach((r: { error?: string }, idx: number) => {
            if (r.error) {
              allErrors.push({
                index: idx,
                error: r.error
              });
            }
          });
        }
      }

      return {
        success: totalSuccess,
        failed: totalFailed,
        errors: allErrors
      };
    } catch (error) {
      logger.error('FCM batch send error', { error });
      return {
        success: 0,
        failed: deviceTokens.length,
        errors: [{ index: -1, error: error instanceof Error ? error.message : 'Unknown error' }]
      };
    }
  }

  /**
   * Send to topic
   */
  async sendToTopic(topic: string, payload: FCMPayload): Promise<FCMResponse> {
    try {
      const fcmPayload = this.buildPayload(payload);

      const response = await fetch(this.fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `/topics/${topic}`,
          ...fcmPayload,
        }),
      });

      const result = await response.json();

      if (result.success === 1) {
        return {
          success: true,
          messageId: result.message_id
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send to device group
   */
  async sendToDeviceGroup(
    notificationKey: string, 
    payload: FCMPayload
  ): Promise<FCMResponse> {
    try {
      const fcmPayload = this.buildPayload(payload);

      const response = await fetch(this.fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: notificationKey,
          ...fcmPayload,
        }),
      });

      const result = await response.json();

      if (result.success === 1) {
        return {
          success: true,
          messageId: result.message_id
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build FCM payload
   */
  private buildPayload(payload: FCMPayload): Record<string, unknown> {
    const notification: Record<string, unknown> = {
      title: payload.title,
    };

    if (payload.body) {
      notification.body = payload.body;
    }

    if (payload.icon) {
      notification.icon = payload.icon;
    }

    if (payload.badge !== undefined) {
      notification.badge = payload.badge.toString();
    }

    if (payload.sound) {
      notification.sound = payload.sound;
    } else {
      notification.sound = 'default';
    }

    if (payload.color) {
      notification.color = payload.color;
    }

    if (payload.tag) {
      notification.tag = payload.tag;
    }

    // Android-specific
    const androidConfig: Record<string, unknown> = {
      priority: payload.priority || 'normal',
    };

    if (payload.ttl) {
      androidConfig.ttl = payload.ttl.toString() + 's';
    }

    // Web-specific
    const webpushConfig: Record<string, unknown> = {
      urgency: payload.priority || 'normal',
    };

    const result: Record<string, unknown> = {
      notification,
      android: androidConfig,
      webpush: webpushConfig,
    };

    // Custom data
    if (payload.data) {
      result.data = payload.data;
    }

    return result;
  }

  /**
   * Validate device token format
   */
  isValidToken(token: string): boolean {
    // FCM tokens are longer and can contain various characters
    return token.length >= 32 && token.length <= 400;
  }

  /**
   * Check FCM connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Send a test message to validate the key
      const response = await fetch(this.fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'VALIDATION_TOKEN',
          priority: 'normal',
        }),
      });

      // Will fail but validates auth
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Create FCM provider from environment
 */
export function createFCMProvider(): FCMProvider | null {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    logger.warn('FCM not configured - missing FCM_SERVER_KEY');
    return null;
  }

  return new FCMProvider({
    serverKey,
    projectId: process.env.FCM_PROJECT_ID,
  });
}

/**
 * Notification templates for common use cases
 */
export const FCMTemplates = {
  claimUpdate: (claimNumber: string, status: string): FCMPayload => ({
    title: `Claim ${claimNumber} Update`,
    body: `Your claim status has been changed to: ${status}`,
    priority: 'high',
    data: { type: 'claim_update', claimNumber, status },
    tag: `claim-${claimNumber}`
  }),

  duesReminder: (amount: string, dueDate: string): FCMPayload => ({
    title: 'Dues Payment Reminder',
    body: `Your dues of ${amount} are due on ${dueDate}`,
    priority: 'normal',
    data: { type: 'dues_reminder' }
  }),

  meetingReminder: (title: string, time: string): FCMPayload => ({
    title: 'Meeting Reminder',
    body: `${title} at ${time}`,
    priority: 'high',
    data: { type: 'meeting_reminder' }
  }),

  strikeVote: (deadline: string): FCMPayload => ({
    title: 'Strike Vote Required',
    body: `Your vote is needed by ${deadline}`,
    priority: 'high',
    data: { type: 'strike_vote' }
  }),

  general: (title: string, body: string): FCMPayload => ({
    title,
    body,
    priority: 'normal',
    data: { type: 'general' }
  })
};
