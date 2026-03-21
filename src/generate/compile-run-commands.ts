import type { Package } from '#src/types.ts'
import { compileTemplate } from './compile-template.ts'

const compileRunCommands = (package_: Package): string[] => {
  if (package_.build == null) {
    return []
  }

  const variables = {
    VERSION: package_.version ?? '',
  }
  return compileTemplate(package_.build, variables)
}

export { compileRunCommands }
