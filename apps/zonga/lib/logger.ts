/**
 * Structured logger — Zonga app.
 *
 * Wraps @nzila/os-core/telemetry createLogger for all server-side logging.
 * Use this instead of console.* everywhere in the app.
 */
import { createLogger } from '@nzila/os-core/telemetry'

export const logger = createLogger('zonga')
