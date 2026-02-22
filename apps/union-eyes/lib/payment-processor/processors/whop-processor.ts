/**
 * Whop Payment Processor Implementation
 * Secondary processor for marketplace membership payments
 * 
 * Note: Whop is primarily for marketplace subscriptions and has limited
 * direct payment processing capabilities compared to Stripe
 */

import { BasePaymentProcessor } from './base-processor';
import {
  PaymentProcessorType,
  PaymentIntent,
  PaymentMethod,
  PaymentMethodType,
  CustomerInfo,
  RefundRequest,
  RefundResult,
  CreatePaymentIntentOptions,
  WebhookEvent,
  WebhookEventType,
  WebhookVerification,
  ProcessorConfig,
  PaymentIntentError,
  RefundError,
  CustomerError,
  PaymentProcessorError,
} from '../types';

/**
 * Whop processor - Limited implementation
 * Primarily used for webhook processing of marketplace payments
 */
export class WhopProcessor extends BasePaymentProcessor {
  constructor() {
    super(PaymentProcessorType.WHOP, {
      supportsRecurringPayments: true,  // Via Whop subscriptions
      supportsRefunds: false,           // No direct refund API
      supportsPartialRefunds: false,
      supportsCustomers: true,          // Managed via Whop
      supportsPaymentMethods: false,    // Managed via Whop
      supportsWebhooks: true,           // Primary use case
      supportedCurrencies: ['usd'],
      supportedPaymentMethods: [
        PaymentMethodType.CREDIT_CARD,
        PaymentMethodType.DEBIT_CARD,
      ],
    });
  }

  async initialize(config: ProcessorConfig): Promise<void> {
    await super.initialize(config);
    
    // Whop doesn&apos;t require SDK initialization
    // Webhooks are handled via @whop-apps/sdk
  }

  /**
   * Whop payment intents are not directly created
   * They are managed through Whop's checkout flow
   */
  async createPaymentIntent(_options: CreatePaymentIntentOptions): Promise<PaymentIntent> {
    void _options;
    throw new PaymentIntentError(
      'Whop does not support direct payment intent creation. Use Whop checkout flow.',
      this.type
    );
  }

  async retrievePaymentIntent(_paymentIntentId: string): Promise<PaymentIntent> {
    void _paymentIntentId;
    throw new PaymentIntentError(
      'Whop payment intent retrieval not supported. Access via webhook events.',
      this.type
    );
  }

  async confirmPaymentIntent(_paymentIntentId: string): Promise<PaymentIntent> {
    void _paymentIntentId;
    throw new PaymentIntentError(
      'Whop payment confirmation is handled automatically via checkout.',
      this.type
    );
  }

  async cancelPaymentIntent(_paymentIntentId: string): Promise<PaymentIntent> {
    void _paymentIntentId;
    throw new PaymentIntentError(
      'Whop payment cancellation not supported via API.',
      this.type
    );
  }

  /**
   * Whop refunds are handled through Whop dashboard
   */
  async createRefund(_request: RefundRequest): Promise<RefundResult> {
    void _request;
    throw new RefundError(
      'Whop refunds must be processed through Whop dashboard.',
      this.type
    );
  }

  async retrieveRefund(_refundId: string): Promise<RefundResult> {
    void _refundId;
    throw new RefundError(
      'Whop refund retrieval not supported via API.',
      this.type
    );
  }

  /**
   * Whop customers are managed through Whop platform
   */
  async createCustomer(_customer: CustomerInfo): Promise<string> {
    void _customer;
    throw new CustomerError(
      'Whop customers are created automatically during checkout.',
      this.type
    );
  }

  async retrieveCustomer(_customerId: string): Promise<CustomerInfo> {
    void _customerId;
    throw new CustomerError(
      'Whop customer retrieval not supported. Access via webhook data.',
      this.type
    );
  }

  async updateCustomer(_customerId: string, _updates: Partial<CustomerInfo>): Promise<CustomerInfo> {
    void _customerId;
    void _updates;
    throw new CustomerError(
      'Whop customer updates must be done through Whop dashboard.',
      this.type
    );
  }

  /**
   * Whop payment methods are managed through Whop platform
   */
  async attachPaymentMethod(_paymentMethodId: string, _customerId: string): Promise<PaymentMethod> {
    void _paymentMethodId;
    void _customerId;
    throw new PaymentProcessorError(
      'Whop payment methods are managed through Whop platform.',
      this.type
    );
  }

  async detachPaymentMethod(_paymentMethodId: string): Promise<PaymentMethod> {
    void _paymentMethodId;
    throw new PaymentProcessorError(
      'Whop payment methods are managed through Whop platform.',
      this.type
    );
  }

  async listPaymentMethods(_customerId: string): Promise<PaymentMethod[]> {
    void _customerId;
    throw new PaymentProcessorError(
      'Whop payment methods are managed through Whop platform.',
      this.type
    );
  }

  /**
   * Verify Whop webhook
   * Uses @whop-apps/sdk for verification
   */
  async verifyWebhook(payload: string, _signature: string): Promise<WebhookVerification> {
    void _signature;
    try {
      // Whop webhook verification is handled by @whop-apps/sdk
      // in the webhook route handler
      // This method is a placeholder for consistency
      
      this.logOperation('verifyWebhook', { payloadLength: payload.length });
      
      // Parse the webhook payload
      const webhookData = JSON.parse(payload);
      
      return {
        verified: true,
        event: {
          id: webhookData.id || 'whop-webhook',
          type: this.mapWhopEventType(webhookData.action),
          processor: this.type,
          data: webhookData.data,
          createdAt: new Date(),
          rawEvent: webhookData,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('verifyWebhook', error instanceof Error ? error : new Error(errorMessage));
      return {
        verified: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process webhook event
   */
  async processWebhook(event: WebhookEvent): Promise<void> {
    this.logOperation('processWebhook', { eventType: event.type, eventId: event.id });
    
    // Whop webhook processing is handled in the webhook route
    // This method is a placeholder for any processor-specific logic
  }

  /**
   * Map Whop event actions to common event types
   */
  private mapWhopEventType(action: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'payment.succeeded': WebhookEventType.PAYMENT_SUCCEEDED,
      'payment.failed': WebhookEventType.PAYMENT_FAILED,
      'membership.went_valid': WebhookEventType.SUBSCRIPTION_CREATED,
      'membership.went_invalid': WebhookEventType.SUBSCRIPTION_CANCELLED,
      'membership.updated': WebhookEventType.SUBSCRIPTION_UPDATED,
    };
    
    return eventMap[action] || WebhookEventType.PAYMENT_SUCCEEDED;
  }
}
