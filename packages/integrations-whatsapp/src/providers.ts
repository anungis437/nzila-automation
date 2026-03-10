/* ── WhatsApp Provider Abstraction ────────────────────────
 *
 * Support for multiple WhatsApp providers:
 *   - Twilio
 *   - WhatsApp Business API (Cloud API)
 *   - OpenClaw runtime
 *
 * All messages are logged to the communications table.
 */

import type { MessageType } from '@nzila/mobility-core'

/* ── Provider Interface ───────────────────────────────────── */

export interface WhatsAppProvider {
  readonly name: 'twilio' | 'whatsapp_business_api' | 'openclaw'
  sendMessage(to: string, body: string, templateId?: string): Promise<WhatsAppSendResult>
  sendTemplate(to: string, templateName: string, params: Record<string, string>): Promise<WhatsAppSendResult>
}

export interface WhatsAppSendResult {
  externalId: string
  status: 'sent' | 'queued' | 'failed'
  timestamp: Date
}

/* ── Twilio Provider ──────────────────────────────────────── */

export interface TwilioConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export function createTwilioProvider(config: TwilioConfig): WhatsAppProvider {
  return {
    name: 'twilio',
    async sendMessage(to, body) {
      // Integration point: calls Twilio Messages API
      // POST https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json
      void config
      return {
        externalId: `twilio_${Date.now()}`,
        status: 'queued',
        timestamp: new Date(),
      }
    },
    async sendTemplate(to, templateName, params) {
      void config
      return {
        externalId: `twilio_tpl_${Date.now()}`,
        status: 'queued',
        timestamp: new Date(),
      }
    },
  }
}

/* ── WhatsApp Business API Provider ───────────────────────── */

export interface WhatsAppBusinessConfig {
  phoneNumberId: string
  accessToken: string
}

export function createWhatsAppBusinessProvider(config: WhatsAppBusinessConfig): WhatsAppProvider {
  return {
    name: 'whatsapp_business_api',
    async sendMessage(to, body) {
      // Integration point: POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
      void config
      return {
        externalId: `waba_${Date.now()}`,
        status: 'queued',
        timestamp: new Date(),
      }
    },
    async sendTemplate(to, templateName, params) {
      void config
      return {
        externalId: `waba_tpl_${Date.now()}`,
        status: 'queued',
        timestamp: new Date(),
      }
    },
  }
}

/* ── OpenClaw Provider ────────────────────────────────────── */

export interface OpenClawConfig {
  apiUrl: string
  apiKey: string
}

export function createOpenClawProvider(config: OpenClawConfig): WhatsAppProvider {
  return {
    name: 'openclaw',
    async sendMessage(to, body) {
      void config
      return {
        externalId: `oc_${Date.now()}`,
        status: 'queued',
        timestamp: new Date(),
      }
    },
    async sendTemplate(to, templateName, params) {
      void config
      return {
        externalId: `oc_tpl_${Date.now()}`,
        status: 'queued',
        timestamp: new Date(),
      }
    },
  }
}
