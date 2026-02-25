/**
 * @nzila/commerce-services — Barrel Export
 *
 * @module @nzila/commerce-services
 */
export {
  createQuoteService,
} from './quote-service'

export type {
  CreateQuoteInput,
  QuoteLineInput,
  QuoteEntity,
  QuoteLineEntity,
  PricedQuote,
  PricedLine,
  QuoteServiceResult,
  QuoteRepository,
} from './quote-service'

export {
  createOrderService,
} from './order-service'

export type {
  CreateOrderInput,
  OrderLineInput,
  OrderEntity,
  OrderLineEntity,
  OrderServiceResult,
  OrderRepository,
} from './order-service'

export {
  createInvoiceService,
} from './invoice-service'

export type {
  CreateInvoiceInput,
  InvoiceLineInput,
  InvoiceEntity,
  InvoiceLineEntity,
  RecordPaymentInput,
  InvoiceServiceResult,
  InvoiceRepository,
} from './invoice-service'

// ── Sagas ──────────────────────────────────────────────────────────────────
export {
  createQuoteToOrderSaga,
  createOrderToInvoiceSaga,
} from './sagas'

export type {
  QuoteToOrderData,
  QuoteToOrderPorts,
  OrderToInvoiceData,
  OrderToInvoicePorts,
} from './sagas'
