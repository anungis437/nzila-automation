'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@nzila/ui'
import { uploadAudio, uploadCover } from '@/lib/actions/upload-actions'
import { createContentAsset } from '@/lib/actions/catalog-actions'

const GENRES = [
  { label: 'Afrobeats', value: 'AFROBEATS' },
  { label: 'Amapiano', value: 'AMAPIANO' },
  { label: 'Soukous', value: 'SOUKOUS' },
  { label: 'Highlife', value: 'HIGHLIFE' },
  { label: 'Bongo Flava', value: 'BONGO_FLAVA' },
  { label: 'Gospel', value: 'AFRO_GOSPEL' },
  { label: 'Hip Hop', value: 'AFRO_HIP_HOP' },
  { label: 'Gengetone', value: 'GENGETONE' },
  { label: 'Kizomba', value: 'KIZOMBA' },
  { label: 'Gqom', value: 'GQOM' },
  { label: 'Raï', value: 'RAI' },
  { label: 'Ndombolo', value: 'NDOMBOLO' },
  { label: 'Rumba', value: 'CONGOLESE_RUMBA' },
]

const ASSET_TYPES = [
  { label: 'Track', value: 'TRACK' },
  { label: 'Album', value: 'ALBUM' },
  { label: 'Video', value: 'VIDEO' },
  { label: 'Podcast', value: 'PODCAST' },
]

export default function UploadPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'meta' | 'upload' | 'done'>('meta')
  const [assetId, setAssetId] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    sha256?: string
    blobPath?: string
  } | null>(null)

  function handleMetaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createContentAsset({
        title: fd.get('title') as string,
        type: fd.get('type') as string,
        genre: fd.get('genre') as string || undefined,
        creatorName: fd.get('creatorName') as string || undefined,
        duration: fd.get('duration') ? Number(fd.get('duration')) : undefined,
      })

      if (!res.success) {
        setError('Failed to create asset. Check all fields.')
        return
      }
      setAssetId(res.assetId!)
      setStep('upload')
    })
  }

  function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!assetId) return
    const fd = new FormData(e.currentTarget)
    fd.set('assetId', assetId)

    startTransition(async () => {
      const res = await uploadAudio(fd)
      if (!res.ok) {
        setError(res.error ?? 'Upload failed.')
        return
      }
      setUploadResult({ sha256: res.sha256, blobPath: res.blobPath })

      // Upload cover art if provided
      const coverFile = fd.get('cover') as File | null
      if (coverFile && coverFile.size > 0) {
        const coverFd = new FormData()
        coverFd.set('file', coverFile)
        coverFd.set('assetId', assetId)
        await uploadCover(coverFd)
      }

      setStep('done')
    })
  }

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-navy">Upload Complete</h2>
        <p className="text-gray-500 mt-2">
          Your content is now in the catalog as a draft.
        </p>
        {uploadResult?.sha256 && (
          <p className="text-xs font-mono text-gray-400 mt-2 break-all">
            SHA-256: {uploadResult.sha256}
          </p>
        )}
        <button
          onClick={() => router.push('../catalog')}
          className="mt-6 bg-electric text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition"
        >
          View Catalog
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-6">
        {step === 'meta' ? 'Upload Content' : 'Upload Audio File'}
      </h1>

      {step === 'meta' && (
        <Card>
          <form onSubmit={handleMetaSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
                placeholder="Track or album title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select
                  name="genre"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
                >
                  <option value="">Select genre</option>
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creator / Artist</label>
                <input
                  name="creatorName"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
                  placeholder="Artist name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
                <input
                  name="duration"
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
                  placeholder="e.g. 210"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-electric text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition disabled:opacity-50"
              >
                {isPending ? 'Creating…' : 'Continue to Upload'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {step === 'upload' && (
        <Card>
          <form onSubmit={handleFileUpload} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
              <input
                name="file"
                type="file"
                required
                accept=".wav,.flac,.mp3,.aac,.ogg"
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-electric file:text-white hover:file:bg-electric/90"
              />
              <p className="mt-1 text-xs text-gray-400">WAV, FLAC, MP3, AAC, or OGG. Max 500 MB.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Art (optional)</label>
              <input
                name="cover"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              <p className="mt-1 text-xs text-gray-400">JPG, PNG, or WebP. Max 10 MB.</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-electric text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition disabled:opacity-50"
              >
                {isPending ? 'Uploading…' : 'Upload & Finish'}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
