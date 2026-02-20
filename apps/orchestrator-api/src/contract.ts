import { z } from 'zod'

/**
 * Strict command contract for the orchestrator.
 * Every command from the outer loop (WhatsApp / webhook / CLI)
 * must conform to this schema before execution.
 */

export const PlaybookName = z.enum([
  'contract_guardian',
  'lint_check',
  'typecheck',
  'unit_tests',
  'full_ci',
])
export type PlaybookName = z.infer<typeof PlaybookName>

export const CommandSchema = z.object({
  /** Caller-supplied correlation ID (UUID v4) */
  correlation_id: z.string().uuid(),
  /** Which playbook to dispatch */
  playbook: PlaybookName,
  /** If true, no mutations (issues, PRs, deploys) */
  dry_run: z.boolean().default(true),
  /** Freeform args passed through to the workflow */
  args: z.record(z.string(), z.unknown()).default({}),
  /** Who requested this (WhatsApp number, API key ID, etc.) */
  requested_by: z.string().min(1),
})
export type Command = z.infer<typeof CommandSchema>

export const CommandStatus = z.enum([
  'pending',
  'dispatched',
  'running',
  'succeeded',
  'failed',
  'cancelled',
])
export type CommandStatus = z.infer<typeof CommandStatus>

export interface CommandRecord {
  id: string
  correlation_id: string
  playbook: PlaybookName
  status: CommandStatus
  dry_run: boolean
  requested_by: string
  args: Record<string, unknown>
  run_id: string | null
  run_url: string | null
  created_at: string
  updated_at: string
}
