/* ── @nzila/mobility-ai ───────────────────────────────── */

// Copilot
export {
  generateClientSummary,
  generateProgramComparison,
  generateCaseMemo,
  generateDocumentRequestList,
  explainRiskFlags,
  AI_OUTPUT_TYPES,
} from './copilot'
export type {
  AiOutputType,
  CopilotRequest,
  CopilotContext,
  CopilotResponse,
} from './copilot'

// Governance
export {
  validateAiOutput,
  isProhibitedAction,
  canAutoApprove,
  DEFAULT_AI_GOVERNANCE,
} from './governance'
export type { AiGovernancePolicy, GovernanceViolation } from './governance'
