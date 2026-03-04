/**
 * @nzila/platform-procurement-proof — Procurement Section Schema
 *
 * Zod schema for validating every section output in a procurement pack.
 * All sections must conform to a standardized envelope before being
 * included in the signed ZIP bundle.
 *
 * @module @nzila/platform-procurement-proof/schemas/section.schema
 */
import { z } from 'zod'

/**
 * Standard procurement section envelope.
 *
 * Every section in a procurement pack must include:
 *   - section: identifier (e.g. "integration_health")
 *   - status: "ok" | "not_available"
 *   - collectedAt: ISO 8601 UTC timestamp (no milliseconds)
 *   - source: collector module path
 *   - data: arbitrary payload
 */
export const ProcurementSectionSchema = z.object({
  section: z.string(),
  status: z.enum(['ok', 'not_available']),
  collectedAt: z.string().regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    'Timestamp must be ISO 8601 UTC without milliseconds',
  ),
  source: z.string(),
  data: z.any(),
})

export type ProcurementSection = z.infer<typeof ProcurementSectionSchema>

/**
 * Validate a section envelope. Throws on invalid input.
 */
export function validateSection(section: unknown): ProcurementSection {
  return ProcurementSectionSchema.parse(section)
}

/**
 * Safe-validate a section envelope. Returns result without throwing.
 */
export function safeValidateSection(
  section: unknown,
): z.SafeParseReturnType<unknown, ProcurementSection> {
  return ProcurementSectionSchema.safeParse(section)
}
