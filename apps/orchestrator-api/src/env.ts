/**
 * Environment validation — Orchestrator API.
 *
 * Validated at startup before the Fastify server binds.
 * Import this module to access typed env vars.
 */
import { validateEnv, type ValidatedEnv } from '@nzila/os-core/config'

export const env: ValidatedEnv<'orchestrator-api'> = validateEnv('orchestrator-api')
