/**
 * Base Payment Processor Abstract Class
 * Provides common functionality for all payment processors
 */

import { Decimal } from 'decimal.js';
import { logger } from '@/lib/logger';
import {
  IPaymentProcessor,
  PaymentProcessorType,
  PaymentIntent,
  PaymentMethod,
  PaymentStatus,
  CustomerInfo,
  RefundRequest,
  RefundResult,
  CreatePaymentIntentOptions,
  WebhookEvent,
  WebhookVerification,
  ProcessorConfig,
  ProcessorCapabilities,
  PaymentProcessorError,
} from '../types';

/**
 * Abstract base class that all payment processors extend
 */
export abstract class BasePaymentProcessor implements IPaymentProcessor {
  protected config?: ProcessorConfig;
  protected initialized = false;

  constructor(
    public readonly type: PaymentProcessorType,
    public readonly capabilities: ProcessorCapabilities
  ) {}

  /**
   * Initialize the processor with configuration
   */
  async initialize(config: ProcessorConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    this.initialized = true;
    
    logger.info(`Payment processor initialized`, {
      processor: this.type,
      environment: config.environment || 'production',
    });
  }

  /**
   * Ensure processor is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new PaymentProcessorError(
        `Payment processor ${this.type} not initialized`,
        this.type,
        'NOT_INITIALIZED'
      );
    }
  }

  /**
   * Validate configuration
   */
  protected validateConfig(config: ProcessorConfig): void {
    if (!config.apiKey) {
      throw new PaymentProcessorError(
        `API key required for ${this.type}`,
        this.type,
        'INVALID_CONFIG'
      );
    }
  }

  /**
   * Convert amount to processor-specific format
   * Most processors use minor units (cents) for USD, CAD
   */
  convertAmount(amount: Decimal, currency: string): number {
    const currencyLower = currency.toLowerCase();
    
    // Zero-decimal currencies (e.g., JPY, KRW)
    const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp'];
    if (zeroDecimalCurrencies.includes(currencyLower)) {
      return amount.toNumber();
    }
    
    // Standard currencies (cents)
    return amount.mul(100).toNumber();
  }

  /**
   * Format amount from processor format to Decimal
   */
  formatAmount(amount: number, currency: string): Decimal {
    const currencyLower = currency.toLowerCase();
    
    // Zero-decimal currencies
    const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp'];
    if (zeroDecimalCurrencies.includes(currencyLower)) {
      return new Decimal(amount);
    }
    
    // Standard currencies (from cents)
    return new Decimal(amount).div(100);
  }

  /**
   * Log processor operation
   */
  protected logOperation(operation: string, details?: Record<string, unknown>): void {
    logger.info(`Payment processor operation: ${operation}`, {
      processor: this.type,
      ...details,
    });
  }

  /**
   * Log processor error
   */
  protected logError(operation: string, error: Error, details?: Record<string, unknown>): void {
    logger.error(`Payment processor error: ${operation}`, error, {
      processor: this.type,
      ...details,
    });
  }

  /**
   * Abstract methods that must be implemented by each processor
   */
  abstract createPaymentIntent(options: CreatePaymentIntentOptions): Promise<PaymentIntent>;
  abstract retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;
  abstract confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;
  abstract cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;
  
  abstract createRefund(request: RefundRequest): Promise<RefundResult>;
  abstract retrieveRefund(refundId: string): Promise<RefundResult>;
  
  abstract createCustomer(customer: CustomerInfo): Promise<string>;
  abstract retrieveCustomer(customerId: string): Promise<CustomerInfo>;
  abstract updateCustomer(customerId: string, updates: Partial<CustomerInfo>): Promise<CustomerInfo>;
  
  abstract attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethod>;
  abstract detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;
  abstract listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  
  abstract verifyWebhook(payload: string, signature: string): Promise<WebhookVerification>;
  abstract processWebhook(event: WebhookEvent): Promise<void>;
}

/**
 * Helper function to map processor status to common status
 */
export function mapProcessorStatus(processorStatus: string, _processor: PaymentProcessorType): PaymentStatus {
  void _processor;
  const statusLower = processorStatus.toLowerCase();
  
  // Common mappings
  if (statusLower.includes('succeed') || statusLower === 'completed' || statusLower === 'paid') {
    return PaymentStatus.SUCCEEDED;
  }
  if (statusLower.includes('fail') || statusLower === 'declined') {
    return PaymentStatus.FAILED;
  }
  if (statusLower.includes('cancel')) {
    return PaymentStatus.CANCELLED;
  }
  if (statusLower.includes('refund')) {
    return PaymentStatus.REFUNDED;
  }
  if (statusLower.includes('process') || statusLower === 'requires_action') {
    return PaymentStatus.PROCESSING;
  }
  if (statusLower === 'pending' || statusLower === 'requires_payment_method') {
    return PaymentStatus.PENDING;
  }
  
  // Default to pending for unknown statuses
  return PaymentStatus.PENDING;
}
