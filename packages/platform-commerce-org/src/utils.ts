/**
 * @nzila/platform-commerce-org — Utility functions
 */

/**
 * Render a template string by replacing `{{key}}` placeholders with values.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return variables[key] ?? ''
  })
}

/**
 * Diff two config objects and return the list of changed field names.
 */
export function diffConfig(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  const changed: string[] = []
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(next)])
  for (const key of allKeys) {
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      changed.push(key)
    }
  }
  return changed
}
