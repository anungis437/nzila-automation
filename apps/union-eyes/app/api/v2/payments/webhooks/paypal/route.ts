// @ts-nocheck
/**
 * POST /api/payments/webhooks/paypal
 * Migrated to withApi() framework
 */
import { logger } from '@/lib/logger';
import { PaymentService } from '@/lib/services/payment-service';
import { withApi, ApiError } from '@/lib/api/framework';

export const POST = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Payments'],
      summary: 'POST paypal',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        if (!clientId || !clientSecret || !webhookId) {
          logger.error('PayPal webhook configuration missing');
          throw ApiError.internal('PayPal webhook not configured');
        }
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com';
        const payload = await request.text();
        const verified = await verifyPayPalWebhook(
          payload,
          request.headers,
          baseUrl,
          clientId,
          clientSecret,
          webhookId
        );
        if (!verified) {
          logger.error('PayPal webhook signature invalid');
          throw ApiError.badRequest('Invalid PayPal signature');
        }
        const event = JSON.parse(payload);
        const eventType = event.event_type;
        const resource = event.resource || {};
        logger.info('PayPal webhook received', {
          eventId: event.id,
          eventType,
        });
        const transactionId = getTransactionIdFromPayPalEvent(resource);
        switch (eventType) {
          case 'PAYMENT.CAPTURE.COMPLETED':
            if (transactionId) {
              await PaymentService.handlePaymentSuccess({
                transactionId,
                processorPaymentId: resource.id,
                processorType: 'paypal',
                amount: resource?.amount?.value || '0.00',
                paymentMethod: 'paypal',
              });
            } else {
              logger.warn('PayPal payment completed without transaction id', { eventId: event.id });
            }
            break;
          case 'PAYMENT.CAPTURE.DENIED':
          case 'PAYMENT.CAPTURE.FAILED':
            if (transactionId) {
              await PaymentService.handlePaymentFailure({
                transactionId,
                processorPaymentId: resource.id,
                processorType: 'paypal',
                errorMessage: resource?.status || 'PayPal payment failed',
                errorCode: resource?.status_details?.reason || 'PAYPAL_FAILED',
              });
            } else {
              logger.warn('PayPal payment failed without transaction id', { eventId: event.id });
            }
            break;
          case 'PAYMENT.CAPTURE.REFUNDED':
            logger.info('PayPal refund received', { eventId: event.id, resourceId: resource.id });
            break;
          default:
            logger.info('Unhandled PayPal webhook event', { eventType });
        }
        return NextResponse.json({ received: true }, { status: 200 });
  },
);
