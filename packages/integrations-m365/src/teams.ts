/* ── Teams Integration ────────────────────────────────────
 *
 * Case collaboration channels via Microsoft Graph.
 * Channel naming: case-{caseId}
 */

/* ── Types ────────────────────────────────────────────────── */

export interface TeamsChannel {
  channelId: string
  displayName: string
  webUrl: string
}

/* ── Graph Teams Client Interface ─────────────────────────── */

export interface GraphTeamsClient {
  createChannel(teamId: string, displayName: string, description?: string): Promise<TeamsChannel>
  getChannel(teamId: string, channelId: string): Promise<TeamsChannel>
}

/* ── Functions ────────────────────────────────────────────── */

/**
 * Create a dedicated Teams channel for case collaboration.
 * Channel name follows convention: case-{caseId}
 */
export async function createCaseChannel(
  teams: GraphTeamsClient,
  teamId: string,
  caseId: string,
  description?: string,
): Promise<TeamsChannel> {
  const displayName = `case-${caseId}`
  return teams.createChannel(teamId, displayName, description ?? `Collaboration channel for case ${caseId}`)
}
