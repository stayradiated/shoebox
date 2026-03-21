import type { TemplateFn } from '#src/add/types.ts'

import { default as apteryx } from './apteryx.ts'
import { default as githubRelease } from './github-release.ts'
import { default as pipx } from './pipx.ts'

const templates: Record<string, TemplateFn> = {
  apteryx,
  githubRelease,
  pipx,
}

export { templates }
