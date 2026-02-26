/**
 * Track Player — Client component with play/pause.
 *
 * Placeholder audio player that will get wired to Azure Blob streaming.
 */
'use client'

import { useState } from 'react'

export function TrackPlayer({
  assetId: _assetId,
  title,
}: {
  assetId: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  return (
    <div className="space-y-3">
      {/* Waveform placeholder */}
      <div className="h-16 rounded-lg bg-navy/5 flex items-end gap-0.5 px-2 py-1 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.5) * 30 + Math.cos(i * 0.3) * 20
          const active = (i / 60) * 100 <= progress
          return (
            <div
              key={i}
              className={`flex-1 rounded-t transition-colors ${
                active ? 'bg-electric' : 'bg-navy/20'
              }`}
              style={{ height: `${Math.max(10, h)}%` }}
            />
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setPlaying(!playing)
            if (!playing) {
              // Simulate progress
              const interval = setInterval(() => {
                setProgress((p) => {
                  if (p >= 100) {
                    clearInterval(interval)
                    setPlaying(false)
                    return 0
                  }
                  return p + 0.5
                })
              }, 100)
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-medium text-white hover:bg-electric/90 transition-colors"
        >
          {playing ? '⏸ Pause' : '▶️ Play'}
        </button>
        <p className="text-xs text-gray-500">{title}</p>
      </div>
    </div>
  )
}
