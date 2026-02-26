/**
 * Zonga — Asset Detail Page (Server Component).
 *
 * Full content asset view: metadata, quality tiers, collaborators,
 * streaming URL, integrity status, and revenue breakdown.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'
import { getAssetDetail } from '@/lib/actions/catalog-actions'
import { formatCurrencyAmount } from '@/lib/stripe'
import { SubmitForReviewButton } from '@/components/dashboard/submit-for-review-button'

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const asset = await getAssetDetail(id)
  if (!asset) notFound()

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    review: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-red-100 text-red-600',
    takedown: 'bg-red-200 text-red-800',
  }

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="../catalog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy"
      >
        ← Back to Catalog
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{asset.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[asset.status] ?? statusColors.draft
              }`}
            >
              {asset.status}
            </span>
            <span className="text-xs text-gray-500">{asset.type}</span>
            {asset.genre && (
              <span className="inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-xs text-navy">
                {asset.genre.replace(/_/g, ' ')}
              </span>
            )}
            {asset.language && (
              <span className="inline-flex rounded-full bg-electric/10 px-2 py-0.5 text-xs text-electric">
                {asset.language.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metadata */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">📋 Metadata</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-gray-500">Creator</dt>
                  <dd className="font-medium text-navy">{(asset.metadata?.creatorName as string) ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Duration</dt>
                  <dd className="font-medium text-navy">
                    {asset.durationSeconds
                      ? `${Math.floor(asset.durationSeconds / 60)}:${String(
                          asset.durationSeconds % 60,
                        ).padStart(2, '0')}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">ISRC</dt>
                  <dd className="font-mono text-xs text-navy">{asset.isrc ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Created</dt>
                  <dd className="font-medium text-navy">
                    {asset.createdAt
                      ? new Date(asset.createdAt).toLocaleDateString('en-CA')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Collaborators */}
          {asset.collaborators && asset.collaborators.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="mb-3 text-sm font-semibold text-navy">
                  👥 Collaborators
                </h2>
                <div className="flex flex-wrap gap-2">
                  {asset.collaborators.map((collab: string) => (
                    <span
                      key={collab}
                      className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {collab}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Audio Fingerprint */}
          {asset.audioFingerprint && (
            <Card>
              <div className="p-5">
                <h2 className="mb-3 text-sm font-semibold text-navy">
                  🔐 Audio Fingerprint
                </h2>
                <p className="break-all font-mono text-xs text-gray-500">
                  SHA-256: {asset.audioFingerprint}
                </p>
              </div>
            </Card>
          )}

          {/* Revenue Summary */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                💰 Revenue Summary
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-navy">
                    {((asset.metadata?.streams as number) ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Streams</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy">
                    {((asset.metadata?.downloads as number) ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Downloads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrencyAmount(
                      Math.round(((asset.metadata?.totalRevenue as number) ?? 0) * 100),
                      'USD',
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quality Tiers */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                🎵 Quality Tiers
              </h2>
              {asset.qualityTiers && asset.qualityTiers.length > 0 ? (
                <div className="space-y-2">
                  {asset.qualityTiers.map((tier: string) => {
                    const tierInfo: Record<string, { label: string; kbps: string }> = {
                      low: { label: 'Low (Data Saver)', kbps: '64 kbps' },
                      medium: { label: 'Medium', kbps: '128 kbps' },
                      high: { label: 'High', kbps: '256 kbps' },
                      lossless: { label: 'Lossless', kbps: 'FLAC' },
                    }
                    const info = tierInfo[tier] ?? { label: tier, kbps: '—' }
                    return (
                      <div
                        key={tier}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <span className="text-xs font-medium text-navy">
                          {info.label}
                        </span>
                        <span className="text-xs text-gray-500">{info.kbps}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  No quality tiers configured yet.
                </p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div className="space-y-2 p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">⚡ Actions</h2>
              <Link
                href={`../releases/new?assetId=${id}`}
                className="block w-full rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-navy hover:bg-gray-50"
              >
                Add to Release
              </Link>
              {asset.status === 'draft' && (
                <SubmitForReviewButton assetId={id} />
              )}
            </div>
          </Card>

          {/* Technical Info */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">🔧 Technical</h2>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Content Type</dt>
                  <dd className="font-mono text-navy">
                    {String(asset.type)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">File Size</dt>
                  <dd className="font-mono text-navy">
                    {(asset.metadata?.sizeBytes as number)
                      ? `${((asset.metadata.sizeBytes as number) / (1024 * 1024)).toFixed(1)} MB`
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Asset ID</dt>
                  <dd className="font-mono text-navy">{id.slice(0, 12)}…</dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
