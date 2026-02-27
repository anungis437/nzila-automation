/**
 * CFO — Dashboard Error Boundary.
 *
 * Catches both permission errors (from requirePermission()) and generic
 * runtime errors. Shows a "Access Denied" UI for RBAC violations and a
 * generic retry prompt for anything else.
 */
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ShieldX } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isForbidden = error.message?.includes('Forbidden')

  useEffect(() => {
    console.error('[CFO Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/20">
      {isForbidden ? (
        <ShieldX className="mb-4 h-12 w-12 text-red-400" />
      ) : (
        <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
      )}
      <h2 className="font-poppins text-xl font-bold text-foreground">
        {isForbidden ? 'Access Denied' : 'Something went wrong'}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isForbidden
          ? 'Your role does not have permission to view this page. Contact your firm administrator if you believe this is an error.'
          : 'An unexpected error occurred while loading this page. The error has been logged.'}
      </p>
      {error.digest && !isForbidden && (
        <p className="mt-1 text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
      {!isForbidden && (
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  )
}
