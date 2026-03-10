/* ── WhatsApp Messaging Service ───────────────────────────
 *
 * High-level messaging functions for mobility workflows.
 * All messages are logged to the communications table.
 */

import type { MessageType } from '@nzila/mobility-core'
import type { WhatsAppProvider, WhatsAppSendResult } from './providers'

/* ── Types ────────────────────────────────────────────────── */

export interface MobilityMessage {
  clientId: string
  caseId?: string
  recipientPhone: string
  messageType: MessageType
  body: string
  templateName?: string
  templateParams?: Record<string, string>
}

export interface MessageResult {
  clientId: string
  caseId?: string
  messageType: MessageType
  sendResult: WhatsAppSendResult
}

export interface CommunicationLogger {
  log(entry: {
    orgId: string
    clientId: string
    caseId: string | null
    channel: 'whatsapp'
    direction: 'outbound'
    messageType: MessageType
    body: string
    externalId: string
  }): Promise<void>
}

/* ── Messaging Functions ──────────────────────────────────── */

/**
 * Send a mobility notification via WhatsApp.
 * Automatically logs the message to the communications table.
 */
export async function sendNotification(
  provider: WhatsAppProvider,
  message: MobilityMessage,
  orgId: string,
  logger: CommunicationLogger,
): Promise<MessageResult> {
  let sendResult: WhatsAppSendResult

  if (message.templateName && message.templateParams) {
    sendResult = await provider.sendTemplate(
      message.recipientPhone,
      message.templateName,
      message.templateParams,
    )
  } else {
    sendResult = await provider.sendMessage(message.recipientPhone, message.body)
  }

  await logger.log({
    orgId,
    clientId: message.clientId,
    caseId: message.caseId ?? null,
    channel: 'whatsapp',
    direction: 'outbound',
    messageType: message.messageType,
    body: message.body,
    externalId: sendResult.externalId,
  })

  return {
    clientId: message.clientId,
    caseId: message.caseId,
    messageType: message.messageType,
    sendResult,
  }
}

/**
 * Send a case status update to a client.
 */
export async function sendCaseStatusUpdate(
  provider: WhatsAppProvider,
  clientId: string,
  caseId: string,
  recipientPhone: string,
  statusMessage: string,
  orgId: string,
  logger: CommunicationLogger,
): Promise<MessageResult> {
  return sendNotification(
    provider,
    {
      clientId,
      caseId,
      recipientPhone,
      messageType: 'case_status',
      body: statusMessage,
    },
    orgId,
    logger,
  )
}

/**
 * Send a document request to a client.
 */
export async function sendDocumentRequest(
  provider: WhatsAppProvider,
  clientId: string,
  caseId: string,
  recipientPhone: string,
  documentList: string[],
  orgId: string,
  logger: CommunicationLogger,
): Promise<MessageResult> {
  const body = `Please provide the following documents:\n${documentList.map((d, i) => `${i + 1}. ${d}`).join('\n')}`

  return sendNotification(
    provider,
    {
      clientId,
      caseId,
      recipientPhone,
      messageType: 'document_request',
      body,
    },
    orgId,
    logger,
  )
}

/**
 * Send a renewal reminder.
 */
export async function sendRenewalReminder(
  provider: WhatsAppProvider,
  clientId: string,
  recipientPhone: string,
  reminderMessage: string,
  orgId: string,
  logger: CommunicationLogger,
): Promise<MessageResult> {
  return sendNotification(
    provider,
    {
      clientId,
      recipientPhone,
      messageType: 'renewal_reminder',
      body: reminderMessage,
    },
    orgId,
    logger,
  )
}
