// ---------------------------------------------------------------------------
// SMS notification adapter — interfaces + stub
// ---------------------------------------------------------------------------

export interface SmsMessage {
  messageId: string
  recipientPhone: string
  body: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  sentAt?: string
}

export interface SmsAdapter {
  /** Send an SMS notification */
  send(recipientPhone: string, body: string): Promise<SmsMessage>
}

/** In-memory stub for tests and dev */
export function createStubSmsAdapter(): SmsAdapter {
  let counter = 0
  return {
    async send(recipientPhone, body) {
      counter++
      return {
        messageId: `sms_${counter}`,
        recipientPhone,
        body,
        status: 'delivered',
        sentAt: new Date().toISOString(),
      }
    },
  }
}
