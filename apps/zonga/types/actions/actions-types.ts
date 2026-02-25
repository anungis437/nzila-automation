/**
 * Server-action return type — consistent across the app.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
