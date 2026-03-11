import { randomUUID } from 'node:crypto'
import type { PromptVersion } from './types'

const versions: PromptVersion[] = []

export function createPromptVersion(params: {
  promptName: string
  template: string
  author: string
  changeReason: string
}): PromptVersion {
  // Deactivate previous versions
  for (const v of versions) {
    if (v.promptName === params.promptName) {
      v.active = false
    }
  }

  const maxVersion = versions
    .filter((v) => v.promptName === params.promptName)
    .reduce((max, v) => Math.max(max, v.version), 0)

  const entry: PromptVersion = {
    id: randomUUID(),
    promptName: params.promptName,
    version: maxVersion + 1,
    template: params.template,
    author: params.author,
    createdAt: new Date().toISOString(),
    active: true,
    changeReason: params.changeReason,
  }
  versions.push(entry)
  return entry
}

export function getActivePrompt(
  promptName: string,
): PromptVersion | undefined {
  return versions.find((v) => v.promptName === promptName && v.active)
}

export function getPromptHistory(promptName: string): PromptVersion[] {
  return versions
    .filter((v) => v.promptName === promptName)
    .sort((a, b) => b.version - a.version)
}

export function clearPromptVersions(): void {
  versions.length = 0
}
