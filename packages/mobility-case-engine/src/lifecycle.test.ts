import { describe, it, expect } from 'vitest'
import {
  initCase,
  canTransition,
  getNextLifecycleState,
  advanceCase,
  addTask,
  completeTask,
  addDeadline,
  CASE_LIFECYCLE,
} from './lifecycle'

describe('initCase', () => {
  it('creates a case at the lead stage', () => {
    const state = initCase('case-1', 'advisor-1')

    expect(state.caseId).toBe('case-1')
    expect(state.lifecycle).toBe('lead')
    expect(state.caseStatus).toBe('draft')
    expect(state.caseStage).toBe('pre_engagement')
    expect(state.assignedAdvisorId).toBe('advisor-1')
    expect(state.milestones).toHaveLength(CASE_LIFECYCLE.length)
    expect(state.pendingTasks).toHaveLength(0)
    expect(state.deadlines).toHaveLength(0)
    expect(state.history).toHaveLength(0)
  })
})

describe('canTransition', () => {
  it('allows valid transition from lead to client_intake', () => {
    const result = canTransition('lead', 'client_intake')
    expect(result.allowed).toBe(true)
  })

  it('rejects invalid transition', () => {
    const result = canTransition('lead', 'approved')
    expect(result.allowed).toBe(false)
  })

  it('returns guard condition for guarded transitions', () => {
    const result = canTransition('client_intake', 'kyc_review')
    expect(result.allowed).toBe(true)
    expect(result.guard).toBe('profile_complete')
  })

  it('returns null guard for unguarded transitions', () => {
    const result = canTransition('lead', 'client_intake')
    expect(result.guard).toBeNull()
  })
})

describe('getNextLifecycleState', () => {
  it('returns next state in sequence', () => {
    expect(getNextLifecycleState('lead')).toBe('client_intake')
    expect(getNextLifecycleState('kyc_review')).toBe('program_selection')
    expect(getNextLifecycleState('approved')).toBe('citizenship_granted')
  })

  it('returns null for terminal state', () => {
    expect(getNextLifecycleState('renewal_monitoring')).toBeNull()
  })
})

describe('advanceCase', () => {
  it('advances case to next lifecycle state', () => {
    const initial = initCase('case-1', 'advisor-1')
    const next = advanceCase(initial, 'advisor-1', 'Moving to intake')

    expect(next.lifecycle).toBe('client_intake')
    expect(next.history).toHaveLength(1)
    expect(next.history[0].from).toBe('lead')
    expect(next.history[0].to).toBe('client_intake')
    expect(next.history[0].actorId).toBe('advisor-1')
    expect(next.history[0].notes).toBe('Moving to intake')
  })

  it('updates milestones on transition', () => {
    const initial = initCase('case-1', 'advisor-1')
    const next = advanceCase(initial, 'advisor-1')

    const leadMilestone = next.milestones.find(m => m.lifecycle === 'lead')
    expect(leadMilestone?.completedAt).toBeInstanceOf(Date)
  })
})

describe('addTask', () => {
  it('adds a pending task', () => {
    const state = initCase('case-1', 'advisor-1')
    const updated = addTask(state, {
      taskType: 'document_collection',
      description: 'Collect passport copy',
      assignedTo: 'advisor-1',
      dueDate: null,
      completed: false,
    })

    expect(updated.pendingTasks).toHaveLength(1)
    expect(updated.pendingTasks[0].taskType).toBe('document_collection')
  })
})

describe('completeTask', () => {
  it('marks a task as completed', () => {
    let state = initCase('case-1', 'advisor-1')
    state = addTask(state, {
      taskType: 'kyc_review',
      description: 'Review KYC',
      assignedTo: 'advisor-1',
      dueDate: null,
      completed: false,
    })

    const taskIndex = state.pendingTasks.findIndex(t => t.taskType === 'kyc_review')
    const updated = completeTask(state, taskIndex)
    const task = updated.pendingTasks.find(t => t.taskType === 'kyc_review')
    expect(task?.completed).toBe(true)
  })
})

describe('addDeadline', () => {
  it('adds a deadline to the case', () => {
    const state = initCase('case-1', 'advisor-1')
    const deadline = {
      description: 'Government submission deadline',
      date: new Date('2025-12-31'),
      critical: true,
    }

    const updated = addDeadline(state, deadline)
    expect(updated.deadlines).toHaveLength(1)
    expect(updated.deadlines[0].critical).toBe(true)
  })
})
