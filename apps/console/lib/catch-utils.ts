/**
 * Utility to safely handle `unknown` catch variables in TypeScript strict mode.
 *
 * Instead of relying on `instanceof AiControlPlaneError` narrowing (which fails
 * when the module can't be resolved in isolated tsc runs), we duck-type the
 * well-known error shape that AiControlPlaneError produces.
 */

export interface AiErrorShape {
  message: string
  code: string
  statusCode: number
}

/**
 * Returns a typed `AiErrorShape` if the value structurally matches what
 * `AiControlPlaneError` produces; otherwise returns `null`.
 */
export function asAiError(err: unknown): AiErrorShape | null {
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    'code' in err &&
    'statusCode' in err &&
    typeof (err as Record<string, unknown>).message === 'string' &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    typeof (err as Record<string, unknown>).statusCode === 'number'
  ) {
    const e = err as Record<string, unknown>
    return {
      message: e.message as string,
      code: e.code as string,
      statusCode: e.statusCode as number,
    }
  }
  return null
}

/** Extract a human-readable message from an unknown catch value. */
export function errorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}
