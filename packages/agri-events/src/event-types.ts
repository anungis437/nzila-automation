export const AgriEventTypes = {
  // Lot lifecycle
  LOT_CREATED: 'agri.lot.created',
  LOT_INSPECTED: 'agri.lot.inspected',
  LOT_GRADED: 'agri.lot.graded',
  LOT_CERTIFIED: 'agri.lot.certified',
  LOT_REJECTED: 'agri.lot.rejected',

  // Batch lifecycle
  BATCH_CREATED: 'agri.batch.created',
  BATCH_ALLOCATED: 'agri.batch.allocated',

  // Shipment lifecycle
  SHIPMENT_PLANNED: 'agri.shipment.planned',
  SHIPMENT_MILESTONE: 'agri.shipment.milestone',
  SHIPMENT_CLOSED: 'agri.shipment.closed',

  // Payment lifecycle
  PAYMENT_PLAN_CREATED: 'agri.payment.plan.created',
  PAYMENT_EXECUTED: 'agri.payment.executed',

  // Certification
  CERTIFICATION_ISSUED: 'agri.certification.issued',
} as const

export type AgriEventType = (typeof AgriEventTypes)[keyof typeof AgriEventTypes]
