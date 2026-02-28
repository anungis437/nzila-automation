/**
 * Zonga — Release Detail Page (Server Component).
 *
 * Full release view: track listing, royalty splits, distribution
 * status, and publish action.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'

import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { PublishReleaseButton } from '@/components/dashboard/publish-release-button'

async function getReleaseDetail(releaseId: string) {
  try {
    const [row] = (await platformDb.execute(
      sql`SELECT
        org_id as id, metadata->>'title' as title,
        metadata->>'status' as status,
        metadata->>'type' as type,
        metadata->>'trackCount' as "trackCount",
        metadata->>'creatorName' as "creatorName",
        metadata->>'releaseDate' as "releaseDate",
        metadata->>'upc' as upc,
        metadata->'royaltySplits' as "royaltySplits",
        created_at as "createdAt"
      FROM audit_log
      WHERE org_id = ${releaseId} AND action LIKE 'release.%'
      ORDER BY created_at DESC
      LIMIT 1`,
    )) as unknown as [Record<string, unknown> | undefined]
    return row ?? null
  } catch (error) {
    logger.error('getReleaseDetail failed', { error, releaseId })
    return null
  }
}

async function getReleaseTracks(releaseId: string) {
  try {
    const result = (await platformDb.execute(
      sql`SELECT
        org_id as id,
        metadata->>'title' as title,
        metadata->>'genre' as genre,
        metadata->>'creatorName' as "creatorName",
        metadata->>'status' as status,
        metadata->>'language' as language,
        metadata->'collaborators' as collaborators
      FROM audit_log
      WHERE metadata->>'releaseId' = ${releaseId} AND action = 'content.created'
      ORDER BY created_at ASC`,
    )) as unknown as { rows: Array<Record<string, unknown>> }
    return result.rows ?? []
  } catch {
    return []
  }
}

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const release = await getReleaseDetail(id)
  if (!release) notFound()

  const tracks = await getReleaseTracks(id)

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-700',
    released: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-red-100 text-red-600',
  }

  const typeLabels: Record<string, string> = {
    single: '💿 Single',
    ep: '📀 EP',
    album: '💽 Album',
    compilation: '📚 Compilation',
  }

  const royaltySplits = Array.isArray(release.royaltySplits)
    ? (release.royaltySplits as Array<{
        creatorId: string
        displayName: string
        role: string
        sharePercent: number
      }>)
    : []

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="../releases"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy"
      >
        ← Back to Releases
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {typeLabels[release.type as string]?.slice(0, 2) ?? '💿'}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {release.title as string}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  statusColors[(release.status as string) ?? 'draft'] ??
                  statusColors.draft
                }`}
              >
                {release.status as string}
              </span>
              <span>
                {typeLabels[(release.type as string) ?? ''] ?? String(release.type)}
              </span>
              {release.creatorName ? (
                <span>by {String(release.creatorName)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Track Listing */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                🎵 Track Listing ({String(release.trackCount ?? tracks.length)})
              </h2>
              {tracks.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">
                  No tracks added yet. Add tracks from the{' '}
                  <Link href="../catalog" className="text-electric underline">
                    catalog
                  </Link>.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tracks.map(
                    (
                      track: Record<string, unknown>,
                      idx: number,
                    ) => (
                      <div
                        key={track.id as string}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-medium text-gray-400">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-navy">
                              {track.title as string}
                            </p>
                            <p className="text-xs text-gray-500">
                              {track.creatorName as string}
                              {track.collaborators &&
                                Array.isArray(track.collaborators) &&
                                (track.collaborators as string[]).length > 0
                                ? ` ft. ${(track.collaborators as string[]).join(', ')}`
                                : null}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {track.language ? (
                            <span className="rounded-full bg-electric/10 px-2 py-0.5 text-[10px] text-electric">
                              {(track.language as string).toUpperCase()}
                            </span>
                          ) : null}
                          {track.genre ? (
                            <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] text-navy">
                              {(track.genre as string).replace(/_/g, ' ')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Royalty Splits */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                💰 Royalty Splits
              </h2>
              {royaltySplits.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">
                  No royalty splits configured. All revenue goes to the primary
                  creator.
                </p>
              ) : (
                <div className="space-y-2">
                  {royaltySplits.map((split) => (
                    <div
                      key={split.creatorId}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {split.displayName}
                        </p>
                        <p className="text-xs text-gray-500">{split.role}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-electric"
                            style={{ width: `${split.sharePercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-navy">
                          {split.sharePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 text-right text-xs text-gray-500">
                    Total:{' '}
                    {royaltySplits.reduce(
                      (sum, s) => sum + s.sharePercent,
                      0,
                    )}
                    %
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Release Info */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                📋 Release Info
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">UPC</dt>
                  <dd className="font-mono text-xs text-navy">
                    {(release.upc as string) ?? 'Not assigned'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Release Date</dt>
                  <dd className="text-navy">
                    {release.releaseDate
                      ? new Date(release.releaseDate as string).toLocaleDateString(
                          'en-CA',
                        )
                      : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-navy">
                    {release.createdAt
                      ? new Date(release.createdAt as string).toLocaleDateString(
                          'en-CA',
                        )
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Release ID</dt>
                  <dd className="font-mono text-xs text-navy">
                    {id.slice(0, 12)}…
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Distribution */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                🌍 Distribution
              </h2>
              <p className="text-xs text-gray-500">
                {(release.status as string) === 'released'
                  ? 'This release is live on all configured distribution channels.'
                  : 'This release has not been distributed yet. Publish to make it available.'}
              </p>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div className="space-y-2 p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                ⚡ Actions
              </h2>
              {(release.status as string) === 'draft' && (
                <PublishReleaseButton releaseId={id} />
              )}
              <Link
                href={`../catalog?releaseId=${id}`}
                className="block w-full rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-navy hover:bg-gray-50"
              >
                Manage Tracks
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
