/* ── @nzila/integrations-whatsapp ──────────────────────── */

// Providers
export {
  createTwilioProvider,
  createWhatsAppBusinessProvider,
  createOpenClawProvider,
} from './providers'
export type {
  WhatsAppProvider,
  WhatsAppSendResult,
  TwilioConfig,
  WhatsAppBusinessConfig,
  OpenClawConfig,
} from './providers'

// Messaging
export {
  sendNotification,
  sendCaseStatusUpdate,
  sendDocumentRequest,
  sendRenewalReminder,
} from './messaging'
export type { MobilityMessage, MessageResult, CommunicationLogger } from './messaging'
