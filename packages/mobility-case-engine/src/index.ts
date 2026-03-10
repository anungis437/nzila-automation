/* ── @nzila/mobility-case-engine ────────────────────────── */

export {
  initCase,
  canTransition,
  getNextLifecycleState,
  advanceCase,
  addTask,
  completeTask,
  addDeadline,
  generateTasksForState,
  CASE_LIFECYCLE,
} from './lifecycle'
export type {
  CaseLifecycleState,
  CaseState,
  CaseMilestone,
  CaseTaskItem,
  CaseDeadline,
  CaseTransitionRecord,
} from './lifecycle'
