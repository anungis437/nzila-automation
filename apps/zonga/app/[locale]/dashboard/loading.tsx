/**
 * Zonga — Dashboard Loading Skeleton.
 */
import { Card } from '@nzila/ui'

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-secondary" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-secondary" />
          <div className="h-4 w-72 rounded bg-secondary" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="space-y-3">
              <div className="h-4 w-20 rounded bg-secondary" />
              <div className="h-8 w-14 rounded bg-secondary" />
              <div className="h-3 w-32 rounded bg-secondary" />
            </div>
          </Card>
        ))}
      </div>

      {/* Content skeleton */}
      <Card className="p-0">
        <div className="border-b border-border p-4">
          <div className="h-5 w-36 rounded bg-secondary" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <div className="h-8 w-8 rounded bg-secondary" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 rounded bg-secondary" />
              <div className="h-3 w-24 rounded bg-secondary" />
            </div>
            <div className="h-5 w-16 rounded-full bg-secondary" />
          </div>
        ))}
      </Card>
    </div>
  )
}
