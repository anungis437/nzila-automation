-- Migration: Add Payment Processor Support
-- Description: Add processor type and processor-specific IDs to payment tables
-- Date: 2026-02-12

-- Create payment processor enum
CREATE TYPE payment_processor AS ENUM (
  'stripe',
  'whop',
  'paypal',
  'square',
  'manual'
);

-- Add processor columns to dues_transactions
ALTER TABLE dues_transactions
  ADD COLUMN processor_type payment_processor,
  ADD COLUMN processor_payment_id VARCHAR(255),
  ADD COLUMN processor_customer_id VARCHAR(255);

-- Add index for processor lookups
CREATE INDEX idx_dues_transactions_processor_payment ON dues_transactions(processor_type, processor_payment_id);

-- Add processor columns to payments table
ALTER TABLE payments
  ADD COLUMN processor_type payment_processor,
  ADD COLUMN processor_customer_id VARCHAR(255);

-- Add index for processor lookups on payments
CREATE INDEX idx_payments_processor ON payments(processor_type);

-- Add processor columns to payment_methods table
ALTER TABLE payment_methods
  ADD COLUMN processor_type payment_processor,
  ADD COLUMN processor_method_id VARCHAR(255);

-- Add index for processor lookups on payment_methods
CREATE INDEX idx_payment_methods_processor ON payment_methods(processor_type, processor_method_id);

-- Migrate existing Stripe data in dues_transactions
UPDATE dues_transactions
SET 
  processor_type = 'stripe',
  processor_payment_id = payment_reference
WHERE 
  payment_method = 'stripe'
  AND payment_reference IS NOT NULL
  AND payment_reference LIKE 'pi_%';

-- Migrate existing Stripe data in payments
UPDATE payments
SET processor_type = 'stripe'
WHERE method = 'stripe';

-- Migrate existing Stripe data in payment_methods
UPDATE payment_methods
SET 
  processor_type = 'stripe',
  processor_method_id = stripe_payment_method_id
WHERE stripe_payment_method_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN dues_transactions.processor_type IS 'Payment processor used for this transaction (stripe, whop, paypal, square, manual)';
COMMENT ON COLUMN dues_transactions.processor_payment_id IS 'Payment ID from the processor (e.g., Stripe payment_intent ID)';
COMMENT ON COLUMN dues_transactions.processor_customer_id IS 'Customer ID from the processor';

COMMENT ON COLUMN payments.processor_type IS 'Payment processor used for this payment';
COMMENT ON COLUMN payments.processor_customer_id IS 'Customer ID from the processor';

COMMENT ON COLUMN payment_methods.processor_type IS 'Payment processor that manages this payment method';
COMMENT ON COLUMN payment_methods.processor_method_id IS 'Payment method ID from the processor';
