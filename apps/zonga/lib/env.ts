/**
 * Environment validation — Zonga app.
 *
 * Validated at startup via instrumentation.ts.
 * Import this module to access typed env vars.
 */
import { validateEnv, type ValidatedEnv } from '@nzila/os-core/config'

export const env: ValidatedEnv<'zonga'> = validateEnv('zonga')
