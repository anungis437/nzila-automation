/**
 * Legacy wrapper for payment processor placeholders.
 *
 * These exports now point to the real processor implementations.
 */

export { PayPalProcessor } from './paypal-processor';
export { SquareProcessor } from './square-processor';

// Stub ManualProcessor - placeholder for manual/offline payment processing
import { BasePaymentProcessor } from './base-processor';
import {
  PaymentProcessorType,
  type ProcessorConfig,
  type CreatePaymentIntentOptions,
  type PaymentIntent,
  type RefundRequest,
  type RefundResult,
  type CustomerInfo,
  type PaymentMethod,
  type WebhookVerification,
  type WebhookEvent,
} from '../types';
import { Decimal } from 'decimal.js';

export class ManualProcessor extends BasePaymentProcessor {
  constructor() {
    super(PaymentProcessorType.MANUAL, {
      supportsRecurringPayments: false,
      supportsRefunds: true,
      supportsPartialRefunds: false,
      supportsCustomers: false,
      supportsPaymentMethods: false,
      supportsWebhooks: false,
      supportedCurrencies: ['USD', 'CAD'],
      supportedPaymentMethods: [],
    });
  }

  async initialize(_config: ProcessorConfig): Promise<void> { /* no-op */ }
  async createPaymentIntent(_options: CreatePaymentIntentOptions): Promise<PaymentIntent> { throw new Error('ManualProcessor: not implemented'); }
  async retrievePaymentIntent(_id: string): Promise<PaymentIntent> { throw new Error('ManualProcessor: not implemented'); }
  async confirmPaymentIntent(_id: string): Promise<PaymentIntent> { throw new Error('ManualProcessor: not implemented'); }
  async cancelPaymentIntent(_id: string): Promise<PaymentIntent> { throw new Error('ManualProcessor: not implemented'); }
  async createRefund(_request: RefundRequest): Promise<RefundResult> { throw new Error('ManualProcessor: not implemented'); }
  async retrieveRefund(_id: string): Promise<RefundResult> { throw new Error('ManualProcessor: not implemented'); }
  async createCustomer(_customer: CustomerInfo): Promise<string> { throw new Error('ManualProcessor: not implemented'); }
  async retrieveCustomer(_id: string): Promise<CustomerInfo> { throw new Error('ManualProcessor: not implemented'); }
  async updateCustomer(_id: string, _updates: Partial<CustomerInfo>): Promise<CustomerInfo> { throw new Error('ManualProcessor: not implemented'); }
  async attachPaymentMethod(_methodId: string, _customerId: string): Promise<PaymentMethod> { throw new Error('ManualProcessor: not implemented'); }
  async detachPaymentMethod(_methodId: string): Promise<PaymentMethod> { throw new Error('ManualProcessor: not implemented'); }
  async listPaymentMethods(_customerId: string): Promise<PaymentMethod[]> { throw new Error('ManualProcessor: not implemented'); }
  async verifyWebhook(_payload: string, _signature: string): Promise<WebhookVerification> { return { verified: false }; }
  async processWebhook(_event: WebhookEvent): Promise<void> { /* no-op */ }
  convertAmount(_amount: Decimal, _currency: string): number { return 0; }
  formatAmount(_amount: number, _currency: string): Decimal { return new Decimal(0); }
}
