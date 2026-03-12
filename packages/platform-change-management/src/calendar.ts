/**
 * @nzila/platform-change-management — Change calendar
 *
 * Provides calendar-aware scheduling for change windows.
 * Supports freeze periods, restricted deploy windows, and conflict detection.
 *
 * Calendar policy may be stored in ops/change-management/calendar-policy.yml.
 *
 * @module @nzila/platform-change-management/calendar
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { calendarPolicySchema } from './schemas'
import { loadAllChanges, getChangeRecordsDir } from './service'
import { windowsOverlap, isWithinWindow } from './utils'
import type { ChangeRecord, Environment, CalendarPolicy, WindowConflict, FreezePeriod } from './types'

// ── Calendar Policy Loading ─────────────────────────────────────────────────

const DEFAULT_POLICY_PATH = 'ops/change-management/calendar-policy.yml'

/**
 * Load calendar policy from YAML. Returns a default empty policy if file not found.
 */
export function loadCalendarPolicy(baseDir?: string): CalendarPolicy {
  // Resolve repo root
  let repoRoot = baseDir ?? resolve(import.meta.dirname ?? __dirname, '..', '..', '..')
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(repoRoot, 'pnpm-workspace.yaml'))) break
    repoRoot = resolve(repoRoot, '..')
  }

  const policyPath = join(repoRoot, DEFAULT_POLICY_PATH)
  if (!existsSync(policyPath)) {
    return { freeze_periods: [] }
  }

  try {
    const raw = parseYaml(readFileSync(policyPath, 'utf-8'))
    return calendarPolicySchema.parse(raw)
  } catch (err) {
    console.warn('[change-management] Failed to parse calendar policy:', err)
    return { freeze_periods: [] }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * List upcoming changes (status APPROVED or SCHEDULED) sorted by window start.
 */
export function listUpcomingChanges(opts?: { baseDir?: string }): ChangeRecord[] {
  const now = new Date()
  return loadAllChanges(opts)
    .filter(
      (c) =>
        (c.status === 'APPROVED' || c.status === 'SCHEDULED') &&
        new Date(c.implementation_window_end) >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.implementation_window_start).getTime() -
        new Date(b.implementation_window_start).getTime(),
    )
}

/**
 * List upcoming changes filtered by environment.
 */
export function listChangesForEnvironment(
  env: Environment,
  opts?: { baseDir?: string },
): ChangeRecord[] {
  return listUpcomingChanges(opts).filter((c) => c.environment === env)
}

/**
 * Detect scheduling conflicts for a given environment and window.
 */
export function detectWindowConflicts(
  env: Environment,
  window: { start: string; end: string },
  opts?: { baseDir?: string },
): WindowConflict[] {
  const scheduled = loadAllChanges(opts).filter(
    (c) =>
      c.environment === env &&
      (c.status === 'APPROVED' || c.status === 'SCHEDULED' || c.status === 'IMPLEMENTING'),
  )

  return scheduled
    .filter((c) =>
      windowsOverlap(window, {
        start: c.implementation_window_start,
        end: c.implementation_window_end,
      }),
    )
    .map((c) => {
      const overlapStart = new Date(
        Math.max(new Date(window.start).getTime(), new Date(c.implementation_window_start).getTime()),
      ).toISOString()
      const overlapEnd = new Date(
        Math.min(new Date(window.end).getTime(), new Date(c.implementation_window_end).getTime()),
      ).toISOString()

      return {
        conflicting_change_id: c.change_id,
        conflicting_title: c.title,
        overlap_start: overlapStart,
        overlap_end: overlapEnd,
      }
    })
}

/**
 * Check if the current time is within a change record's approved window.
 */
export function isWithinApprovedWindow(
  change: ChangeRecord,
  now: Date = new Date(),
): boolean {
  return isWithinWindow(now, {
    start: change.implementation_window_start,
    end: change.implementation_window_end,
  })
}

/**
 * Check if a window falls within a freeze period for a given environment.
 */
export function isInFreezePeriod(
  env: Environment,
  window: { start: string; end: string },
  policy?: CalendarPolicy,
): FreezePeriod | null {
  const cal = policy ?? loadCalendarPolicy()

  for (const freeze of cal.freeze_periods) {
    if (!freeze.environments.includes(env)) continue
    if (windowsOverlap(window, { start: freeze.start, end: freeze.end })) {
      return freeze
    }
  }

  return null
}
