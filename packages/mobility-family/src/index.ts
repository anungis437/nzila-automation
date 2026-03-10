/* ── @nzila/mobility-family ─────────────────────────────── */

export {
  buildFamilyGraph,
  DEFAULT_DEPENDENT_RULES,
  CARIBBEAN_CBI_RULES,
} from './graph'
export type {
  FamilyNode,
  FamilyGraph,
  DependentRules,
} from './graph'

export {
  generatePassportTimeline,
  generateAgeOutWarnings,
  buildTimelineSummary,
  TIMELINE_EVENT_TYPES,
} from './timeline'
export type {
  TimelineEvent,
  TimelineEventType,
  TimelineSummary,
} from './timeline'
