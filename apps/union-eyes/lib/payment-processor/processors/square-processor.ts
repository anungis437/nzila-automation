/**
 * Square Payment Processor Implementation
 * Integrates Square Payments API for in-person and online payments
 * 
 * @see https://developer.squareup.com/docs/
 * @requires square
 */

import { BasePaymentProcessor } from './base-processor';
import {
  PaymentProcessorType,
  PaymentIntent,
  PaymentMethod,
  PaymentMethodType,
  PaymentStatus,
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
  WebhookVerificationError,
} from '../types';
import { logger } from '@/lib/logger';

/**
 * Square SDK Types (REST-backed implementation)
 * Square SDK is available for future migration to official client usage.
 */
interface SquarePayment {
  id: string;
  status: 'APPROVED' | 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  amount_money: {
    amount: number; // In smallest currency unit (cents)
    currency: string;
  };
  created_at: string;
  updated_at: string;
  customer_id?: string;
  source_type?: string;
  card_details?: {
    card: {
      last_4?: string;
      card_brand?: string;
      exp_month?: number;
      exp_year?: number;
    };
  };
}

interface SquareRefund {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  amount_money: {
    amount: number;
    currency: string;
  };
  created_at: string;
  payment_id: string;
}

interface SquareCustomer {
  id: string;
  email_address?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string; // city
    administrative_district_level_1?: string; // state
    postal_code?: string;
    country?: string;
  };
  created_at: string;
}

interface SquareCard {
  id: string;
  card_brand: string;
  last_4: string;
  exp_month: number;
  exp_year: number;
  customer_id?: string;
}

export class SquareProcessor extends BasePaymentProcessor {
  private accessToken?: string;
  private environment: 'sandbox' | 'production' = 'production';
  private applicationId?: string;

  constructor() {
    super(PaymentProcessorType.SQUARE, {
      supportsRecurringPayments: true,
      supportsRefunds: true,
      supportsPartialRefunds: true,
      supportsCustomers: true,
      supportsPaymentMethods: true,
      supportsWebhooks: true,
      supportedCurrencies: ['usd', 'cad', 'gbp', 'aud', 'jpy', 'eur'],
      supportedPaymentMethods: [
        PaymentMethodType.CREDIT_CARD,
        PaymentMethodType.DEBIT_CARD,
      ],
    });
  }

  async initialize(config: ProcessorConfig): Promise<void> {
    await super.initialize(config);
    
    this.accessToken = config.apiKey;
    this.environment = config.environment === 'test' ? 'sandbox' : 'production';
    this.applicationId = config.metadata?.applicationId as string;
    
    if (!this.applicationId) {
      throw new PaymentIntentError(
        'Square application ID required in config.metadata.applicationId',
        this.type
      );
    }
    
    logger.info('Square processor initialized', {
      environment: this.environment,
      applicationId: this.applicationId?.substring(0, 8) + '...',
    });
  }

  /**
   * Get Square API base URL
   */
  private getBaseUrl(): string {
    return this.environment === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';
  }

  /**
   * Make authenticated request to Square API
   */
  private async squareRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18', // Latest API version
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.errors?.[0]?.detail || response.statusText;
      throw new Error(`Square API error: ${errorMessage}`);
    }

    return data;
  }

  /**
   * Create a payment intent (Square Payment)
   */
  async createPaymentIntent(options: CreatePaymentIntentOptions): Promise<PaymentIntent> {
    try {
      this.logOperation('createPaymentIntent', { 
        amount: options.amount.toString(), 
        currency: options.currency 
      });

      const amount = this.convertAmount(options.amount, options.currency);
      const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const paymentData = {
        idempotency_key: idempotencyKey,
        amount_money: {
          amount,
          currency: options.currency.toUpperCase(),
        },
        source_id: options.paymentMethodId || 'CASH', // Default to CASH if no source
        customer_id: options.customerId,
        note: options.description,
        reference_id: options.metadata?.referenceId as string,
        autocomplete: options.confirm !== false,
      };

      const response = await this.squareRequest<{ payment: SquarePayment }>(
        '/v2/payments',
        {
          method: 'POST',
          body: JSON.stringify(paymentData),
        }
      );

      return this.mapSquarePaymentToPaymentIntent(response.payment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('createPaymentIntent', error instanceof Error ? error : new Error(errorMessage));
      throw new PaymentIntentError(
        `Failed to create Square payment: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      this.logOperation('retrievePaymentIntent', { paymentIntentId });

      const response = await this.squareRequest<{ payment: SquarePayment }>(
        `/v2/payments/${paymentIntentId}`
      );

      return this.mapSquarePaymentToPaymentIntent(response.payment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('retrievePaymentIntent', error instanceof Error ? error : new Error(errorMessage), { paymentIntentId });
      throw new PaymentIntentError(
        `Failed to retrieve Square payment: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Confirm a payment intent (Complete Square Payment)
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      this.logOperation('confirmPaymentIntent', { paymentIntentId });

      // Square payments are typically auto-completed on creation
      // This method completes a payment if it was created with autocomplete: false
      const response = await this.squareRequest<{ payment: SquarePayment }>(
        `/v2/payments/${paymentIntentId}/complete`,
        { method: 'POST' }
      );

      return this.mapSquarePaymentToPaymentIntent(response.payment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('confirmPaymentIntent', error instanceof Error ? error : new Error(errorMessage), { paymentIntentId });
      throw new PaymentIntentError(
        `Failed to complete Square payment: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      this.logOperation('cancelPaymentIntent', { paymentIntentId });

      // Square doesn&apos;t support direct cancellation, but we can try to cancel
      const response = await this.squareRequest<{ payment: SquarePayment }>(
        `/v2/payments/${paymentIntentId}/cancel`,
        { method: 'POST' }
      );

      return this.mapSquarePaymentToPaymentIntent(response.payment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('cancelPaymentIntent', error instanceof Error ? error : new Error(errorMessage), { paymentIntentId });
      throw new PaymentIntentError(
        `Failed to cancel Square payment: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Create a refund
   */
  async createRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      this.logOperation('createRefund', { 
        paymentIntentId: request.paymentIntentId,
        amount: request.amount?.toString(),
      });

      // First get the payment to determine currency
      const payment = await this.retrievePaymentIntent(request.paymentIntentId);
      const idempotencyKey = `refund_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const refundData: Record<string, unknown> = {
        idempotency_key: idempotencyKey,
        payment_id: request.paymentIntentId,
      };

      if (request.amount) {
        refundData.amount_money = {
          amount: this.convertAmount(request.amount, payment.currency),
          currency: payment.currency.toUpperCase(),
        };
      }

      if (request.reason) {
        refundData.reason = request.reason;
      }

      const response = await this.squareRequest<{ refund: SquareRefund }>(
        '/v2/refunds',
        {
          method: 'POST',
          body: JSON.stringify(refundData),
        }
      );

      return {
        id: response.refund.id,
        amount: this.formatAmount(response.refund.amount_money.amount, response.refund.amount_money.currency),
        currency: response.refund.amount_money.currency.toLowerCase(),
        status: this.mapSquareRefundStatus(response.refund.status),
        paymentIntentId: request.paymentIntentId,
        reason: request.reason,
        createdAt: new Date(response.refund.created_at),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('createRefund', error instanceof Error ? error : new Error(errorMessage), { paymentIntentId: request.paymentIntentId });
      throw new RefundError(
        `Failed to create Square refund: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Retrieve a refund
   */
  async retrieveRefund(refundId: string): Promise<RefundResult> {
    try {
      this.logOperation('retrieveRefund', { refundId });

      const response = await this.squareRequest<{ refund: SquareRefund }>(
        `/v2/refunds/${refundId}`
      );

      return {
        id: response.refund.id,
        amount: this.formatAmount(response.refund.amount_money.amount, response.refund.amount_money.currency),
        currency: response.refund.amount_money.currency.toLowerCase(),
        status: this.mapSquareRefundStatus(response.refund.status),
        paymentIntentId: response.refund.payment_id,
        createdAt: new Date(response.refund.created_at),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('retrieveRefund', error instanceof Error ? error : new Error(errorMessage), { refundId });
      throw new RefundError(
        `Failed to retrieve Square refund: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customer: CustomerInfo): Promise<string> {
    try {
      this.logOperation('createCustomer', { email: customer.email });

      const customerData: Record<string, unknown> = {
        email_address: customer.email,
      };

      if (customer.name) {
        const names = customer.name.split(' ');
        customerData.given_name = names[0];
        if (names.length > 1) {
          customerData.family_name = names.slice(1).join(' ');
        }
      }

      if (customer.phone) {
        customerData.phone_number = customer.phone;
      }

      if (customer.address) {
        customerData.address = {
          address_line_1: customer.address.line1,
          address_line_2: customer.address.line2,
          locality: customer.address.city,
          administrative_district_level_1: customer.address.state,
          postal_code: customer.address.postalCode,
          country: customer.address.country,
        };
      }

      const idempotencyKey = `cust_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      customerData.idempotency_key = idempotencyKey;

      const response = await this.squareRequest<{ customer: SquareCustomer }>(
        '/v2/customers',
        {
          method: 'POST',
          body: JSON.stringify(customerData),
        }
      );

      return response.customer.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('createCustomer', error instanceof Error ? error : new Error(errorMessage), { email: customer.email });
      throw new CustomerError(
        `Failed to create Square customer: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Retrieve a customer
   */
  async retrieveCustomer(customerId: string): Promise<CustomerInfo> {
    try {
      this.logOperation('retrieveCustomer', { customerId });

      const response = await this.squareRequest<{ customer: SquareCustomer }>(
        `/v2/customers/${customerId}`
      );

      const customer = response.customer;
      const name = [customer.given_name, customer.family_name]
        .filter(Boolean)
        .join(' ');

      return {
        id: customer.id,
        email: customer.email_address || '',
        name: name || undefined,
        phone: customer.phone_number,
        address: customer.address ? {
          line1: customer.address.address_line_1,
          line2: customer.address.address_line_2,
          city: customer.address.locality,
          state: customer.address.administrative_district_level_1,
          postalCode: customer.address.postal_code,
          country: customer.address.country,
        } : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('retrieveCustomer', error instanceof Error ? error : new Error(errorMessage), { customerId });
      throw new CustomerError(
        `Failed to retrieve Square customer: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Update a customer
   */
  async updateCustomer(customerId: string, updates: Partial<CustomerInfo>): Promise<CustomerInfo> {
    try {
      this.logOperation('updateCustomer', { customerId });

      const updateData: Record<string, unknown> = {};

      if (updates.email) updateData.email_address = updates.email;
      if (updates.phone) updateData.phone_number = updates.phone;
      
      if (updates.name) {
        const names = updates.name.split(' ');
        updateData.given_name = names[0];
        if (names.length > 1) {
          updateData.family_name = names.slice(1).join(' ');
        }
      }

      if (updates.address) {
        updateData.address = {
          address_line_1: updates.address.line1,
          address_line_2: updates.address.line2,
          locality: updates.address.city,
          administrative_district_level_1: updates.address.state,
          postal_code: updates.address.postalCode,
          country: updates.address.country,
        };
      }

      await this.squareRequest<{ customer: SquareCustomer }>(
        `/v2/customers/${customerId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      return this.retrieveCustomer(customerId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('updateCustomer', error instanceof Error ? error : new Error(errorMessage), { customerId });
      throw new CustomerError(
        `Failed to update Square customer: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Attach a payment method to a customer (Create Card on File)
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethod> {
    try {
      this.logOperation('attachPaymentMethod', { paymentMethodId, customerId });

      const idempotencyKey = `card_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const cardData = {
        idempotency_key: idempotencyKey,
        source_id: paymentMethodId,
        customer_id: customerId,
      };

      const response = await this.squareRequest<{ card: SquareCard }>(
        '/v2/cards',
        {
          method: 'POST',
          body: JSON.stringify(cardData),
        }
      );

      return this.mapSquareCardToPaymentMethod(response.card);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('attachPaymentMethod', error instanceof Error ? error : new Error(errorMessage), { paymentMethodId, customerId });
      throw new CustomerError(
        `Failed to attach Square card: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Detach a payment method from a customer (Disable Card)
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      this.logOperation('detachPaymentMethod', { paymentMethodId });

      // Square disables cards rather than deleting them
      const response = await this.squareRequest<{ card: SquareCard }>(
        `/v2/cards/${paymentMethodId}/disable`,
        { method: 'POST' }
      );

      return this.mapSquareCardToPaymentMethod(response.card);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('detachPaymentMethod', error instanceof Error ? error : new Error(errorMessage), { paymentMethodId });
      throw new CustomerError(
        `Failed to detach Square card: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      this.logOperation('listPaymentMethods', { customerId });

      const response = await this.squareRequest<{ cards: SquareCard[] }>(
        `/v2/cards?customer_id=${customerId}`
      );

      return (response.cards || []).map(card => this.mapSquareCardToPaymentMethod(card));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logError('listPaymentMethods', error instanceof Error ? error : new Error(errorMessage), { customerId });
      throw new CustomerError(
        `Failed to list Square cards: ${errorMessage}`,
        this.type,
        error
      );
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(payload: string, signature: string): Promise<WebhookVerification> {
    try {
      if (!this.config?.webhookSecret) {
        throw new WebhookVerificationError(
          'Square webhook signature key not configured',
          this.type
        );
      }

      // Square uses HMAC-SHA256 for webhook verification
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
      hmac.update(payload);
      const calculatedSignature = hmac.digest('base64');

      const verified = calculatedSignature === signature;

      if (verified) {
        const webhookEvent = JSON.parse(payload);
        
        return {
          verified: true,
          event: {
            id: webhookEvent.event_id || webhookEvent.merchant_id,
            type: this.mapSquareEventType(webhookEvent.type),
            processor: this.type,
            data: webhookEvent.data,
            createdAt: new Date(webhookEvent.created_at),
            rawEvent: webhookEvent,
          },
        };
      }

      return {
        verified: false,
        error: 'Signature verification failed',
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
    
    // Webhook processing logic handled by webhook route handlers
  }

  /**
   * Map Square payment to payment intent
   */
  private mapSquarePaymentToPaymentIntent(payment: SquarePayment): PaymentIntent {
    return {
      id: payment.id,
      amount: this.formatAmount(payment.amount_money.amount, payment.amount_money.currency),
      currency: payment.amount_money.currency.toLowerCase(),
      status: this.mapSquarePaymentStatus(payment.status),
      customerId: payment.customer_id,
      paymentMethodId: payment.card_details?.card.last_4 
        ? `card_${payment.card_details.card.last_4}` 
        : undefined,
      metadata: { 
        squarePaymentId: payment.id,
        sourceType: payment.source_type,
      },
      createdAt: new Date(payment.created_at),
      processorType: this.type,
      processorPaymentId: payment.id,
    };
  }

  /**
   * Map Square card to payment method
   */
  private mapSquareCardToPaymentMethod(card: SquareCard): PaymentMethod {
    return {
      id: card.id,
      type: PaymentMethodType.CREDIT_CARD,
      processor: this.type,
      processorMethodId: card.id,
      customerId: card.customer_id,
      last4: card.last_4,
      brand: card.card_brand,
      expiryMonth: card.exp_month,
      expiryYear: card.exp_year,
      createdAt: new Date(),
    };
  }

  /**
   * Map Square payment status to payment status
   */
  private mapSquarePaymentStatus(status: SquarePayment['status']): PaymentStatus {
    const statusMap = {
      'APPROVED': PaymentStatus.PROCESSING,
      'PENDING': PaymentStatus.PENDING,
      'COMPLETED': PaymentStatus.SUCCEEDED,
      'CANCELED': PaymentStatus.CANCELLED,
      'FAILED': PaymentStatus.FAILED,
    } as const;
    
    return statusMap[status] ?? PaymentStatus.PENDING;
  }

  /**
   * Map Square refund status to payment status
   */
  private mapSquareRefundStatus(status: SquareRefund['status']): PaymentStatus {
    const statusMap = {
      'PENDING': PaymentStatus.PROCESSING,
      'COMPLETED': PaymentStatus.REFUNDED,
      'REJECTED': PaymentStatus.FAILED,
      'FAILED': PaymentStatus.FAILED,
    } as const;
    
    return statusMap[status] ?? PaymentStatus.PROCESSING;
  }

  /**
   * Map Square event types to common event types
   */
  private mapSquareEventType(squareEventType: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'payment.created': WebhookEventType.PAYMENT_SUCCEEDED,
      'payment.updated': WebhookEventType.PAYMENT_SUCCEEDED,
      'refund.created': WebhookEventType.PAYMENT_REFUNDED,
      'refund.updated': WebhookEventType.PAYMENT_REFUNDED,
      'subscription.created': WebhookEventType.SUBSCRIPTION_CREATED,
      'subscription.updated': WebhookEventType.SUBSCRIPTION_UPDATED,
      'subscription.deleted': WebhookEventType.SUBSCRIPTION_CANCELLED,
      'customer.created': WebhookEventType.CUSTOMER_CREATED,
      'customer.updated': WebhookEventType.CUSTOMER_UPDATED,
      'card.created': WebhookEventType.PAYMENT_METHOD_ATTACHED,
      'card.disabled': WebhookEventType.PAYMENT_METHOD_DETACHED,
    };
    
    return eventMap[squareEventType] || WebhookEventType.PAYMENT_SUCCEEDED;
  }
}
