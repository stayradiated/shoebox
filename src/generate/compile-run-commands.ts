import type { Package } from '../types.js'
import { compileTemplate } from './compile-template.js'

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
