/**
 * Zonga — Artist Profile page (Listener-facing).
 *
 * Public artist profile with discography, social stats,
 * upcoming events, and follow/tip actions.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'
import { getCreatorDetail } from '@/lib/actions/creator-actions'
import { listCatalogAssets } from '@/lib/actions/catalog-actions'
import { getSocialStats } from '@/lib/actions/social-actions'
import { FollowButton } from '@/components/dashboard/follow-button'
import { TipButton } from '@/components/dashboard/tip-button'

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id, locale } = await params
  const [creatorResult, socialStats] = await Promise.all([
    getCreatorDetail(id),
    getSocialStats(id),
  ])

  if (!creatorResult.creator) notFound()
  const creator = creatorResult.creator

  // Get creator's published tracks
  const allAssets = await listCatalogAssets({ status: 'published' })
  const creatorAssets = allAssets.assets.filter(
    (a) => a.creatorId === id,
  )

  return (
    <div className="space-y-8">
      <Link
        href={`/${locale}/dashboard/browse`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy"
      >
        ← Back to Browse
      </Link>

      {/* Artist Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-navy via-navy/90 to-electric/70 p-8 text-white">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="h-28 w-28 flex-shrink-0 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
            <span className="text-5xl">🎤</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase text-white/60 tracking-wider">Artist</p>
            <h1 className="mt-1 text-3xl font-bold">{creator.displayName}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/70">
              {creator.country && (
                <span>📍 {creator.country.replace(/_/g, ' ')}</span>
              )}
              {creator.genre && (
                <span>🎵 {creator.genre.replace(/_/g, ' ')}</span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div>
                <span className="font-bold text-white">{socialStats.followers}</span>
                <span className="ml-1 text-white/60">followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{creatorAssets.length}</span>
                <span className="ml-1 text-white/60">tracks</span>
              </div>
              <div>
                <span className="font-bold text-white">{socialStats.likes}</span>
                <span className="ml-1 text-white/60">likes given</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <FollowButton followingId={id} followingName={creator.displayName} />
            <TipButton creatorId={id} creatorName={creator.displayName} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Discography */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="p-5">
              <h2 className="mb-4 text-sm font-semibold text-navy">
                📀 Discography ({creatorAssets.length})
              </h2>
              {creatorAssets.length === 0 ? (
                <p className="text-xs text-gray-500">No published tracks yet.</p>
              ) : (
                <div className="space-y-2">
                  {creatorAssets.map((asset, i) => (
                    <Link
                      key={asset.id}
                      href={`/${locale}/dashboard/tracks/${asset.id}`}
                      className="flex items-center gap-4 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-6 text-center text-xs text-gray-400">
                        {i + 1}
                      </span>
                      <div className="h-10 w-10 flex-shrink-0 rounded bg-navy/10 flex items-center justify-center">
                        <span>🎵</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy truncate">
                          {asset.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {asset.type ?? 'Track'}
                          {asset.genre && ` · ${asset.genre.replace(/_/g, ' ')}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {((asset.metadata?.streams as number) ?? 0).toLocaleString()} plays
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bio / About */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">📝 About</h2>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-medium text-navy capitalize">
                    {creator.status ?? 'active'}
                  </dd>
                </div>
                {creator.bio && (
                  <div>
                    <dt className="text-gray-500">Bio</dt>
                    <dd className="font-medium text-navy">{creator.bio}</dd>
                  </div>
                )}
                {creator.createdAt && (
                  <div>
                    <dt className="text-gray-500">Joined</dt>
                    <dd className="font-medium text-navy">
                      {new Date(creator.createdAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>

          {/* Social Stats */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">📊 Social</h2>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-lg font-bold text-navy">{socialStats.followers}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-lg font-bold text-navy">{socialStats.following}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-lg font-bold text-navy">{socialStats.comments}</p>
                  <p className="text-xs text-gray-500">Comments</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-lg font-bold text-navy">{socialStats.likes}</p>
                  <p className="text-xs text-gray-500">Likes</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
