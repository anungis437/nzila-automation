/* ── Outlook Integration ──────────────────────────────────
 *
 * Track case communication threads via Microsoft Graph.
 * Logs advisor-client emails and document requests.
 */

/* ── Types ────────────────────────────────────────────────── */

export interface EmailMessage {
  messageId: string
  subject: string
  from: string
  to: string[]
  bodyPreview: string
  receivedAt: Date
  conversationId: string
}

export interface EmailLogEntry {
  caseId: string
  messageId: string
  subject: string
  direction: 'inbound' | 'outbound'
  createdAt: Date
}

/* ── Graph Mail Client Interface ──────────────────────────── */

export interface GraphMailClient {
  getMessages(userId: string, opts?: { top?: number; filter?: string }): Promise<EmailMessage[]>
  getMessage(userId: string, messageId: string): Promise<EmailMessage>
}

/* ── Functions ────────────────────────────────────────────── */

/**
 * Log an email message to a mobility case.
 * Extracts case reference from subject or conversation metadata.
 */
export async function logEmailToCase(
  mail: GraphMailClient,
  userId: string,
  messageId: string,
  caseId: string,
  persist: (entry: EmailLogEntry) => Promise<void>,
): Promise<EmailLogEntry> {
  const message = await mail.getMessage(userId, messageId)

  const entry: EmailLogEntry = {
    caseId,
    messageId: message.messageId,
    subject: message.subject,
    direction: 'inbound', // caller can override
    createdAt: message.receivedAt,
  }

  await persist(entry)
  return entry
}
