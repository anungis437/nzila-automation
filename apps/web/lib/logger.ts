/**
 * Structured logger — Web (marketing) app.
 *
 * Wraps @nzila/os-core/telemetry createLogger for server-side logging.
 */
import { createLogger } from '@nzila/os-core/telemetry'

export const logger = createLogger('web')
