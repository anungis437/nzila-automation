// ---------------------------------------------------------------------------
// Mobile money adapter — interfaces + stub
// ---------------------------------------------------------------------------

export interface MobileMoneyTransfer {
  transactionId: string
  recipientPhone: string
  amountCents: number
  currency: string
  provider: string
  status: 'pending' | 'completed' | 'failed'
  reference: string
  createdAt: string
  completedAt?: string
}

export interface MobileMoneyAdapter {
  /** Initiate a mobile money transfer */
  initiateTransfer(params: {
    recipientPhone: string
    amountCents: number
    currency: string
    reference: string
  }): Promise<MobileMoneyTransfer>

  /** Check the status of a transfer */
  getTransferStatus(transactionId: string): Promise<MobileMoneyTransfer>
}

/** In-memory stub for tests and dev */
export function createStubMobileMoneyAdapter(): MobileMoneyAdapter {
  const store = new Map<string, MobileMoneyTransfer>()
  let counter = 0

  return {
    async initiateTransfer(params) {
      counter++
      const txn: MobileMoneyTransfer = {
        transactionId: `txn_${counter}`,
        recipientPhone: params.recipientPhone,
        amountCents: params.amountCents,
        currency: params.currency,
        provider: 'stub',
        status: 'completed',
        reference: params.reference,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
      store.set(txn.transactionId, txn)
      return txn
    },
    async getTransferStatus(transactionId) {
      const txn = store.get(transactionId)
      if (!txn) throw new Error(`Transaction ${transactionId} not found`)
      return txn
    },
  }
}
