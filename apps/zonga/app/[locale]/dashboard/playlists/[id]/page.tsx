/**
 * Zonga — Playlist Detail Page (Server Component).
 *
 * View playlist tracks, add/remove tracks, manage settings.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'
import { getPlaylistDetail } from '@/lib/actions/playlist-actions'

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const { playlist, tracks } = await getPlaylistDetail(id)

  if (!playlist) notFound()

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="../playlists" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition">
        ← All Playlists
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-electric/10 text-3xl">
            🎶
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-gray-500 mt-1">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                playlist.isPublic
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {playlist.isPublic ? 'Public' : 'Private'}
              </span>
              <span className="text-xs text-gray-400">
                {tracks.length} track{tracks.length !== 1 ? 's' : ''}
              </span>
              {playlist.genre && (
                <span className="inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-[10px] text-navy">
                  {playlist.genre.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Tracks</p>
            <p className="text-2xl font-bold text-navy">{tracks.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Visibility</p>
            <p className="text-2xl font-bold text-navy">{playlist.isPublic ? 'Public' : 'Private'}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-lg font-bold text-navy">
              {playlist.createdAt
                ? new Date(playlist.createdAt).toLocaleDateString('en-CA')
                : '—'}
            </p>
          </div>
        </Card>
      </div>

      {/* Track Listing */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy">🎵 Tracks</h2>
            <Link
              href={`../../catalog?addToPlaylist=${id}`}
              className="text-xs text-electric hover:underline"
            >
              + Add Tracks
            </Link>
          </div>

          {tracks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No tracks in this playlist yet.</p>
              <Link
                href={`../../catalog?addToPlaylist=${id}`}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-electric px-4 py-2 text-sm font-medium text-white"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tracks.map((track, idx) => (
                <div key={track.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-medium text-gray-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-navy">{track.title}</p>
                      <p className="text-xs text-gray-500">{track.creatorName ?? 'Unknown artist'}</p>
                    </div>
                  </div>
                  {track.genre && (
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] text-navy">
                      {track.genre.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
