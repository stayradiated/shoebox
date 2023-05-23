import type { Package } from '../types.js'
import { compileTemplate } from './compile-template.js'

const compileRunCommands = (pkg: Package): string[] => {
  if (pkg.build == null) {
    return []
  }

  const variables = {
    VERSION: pkg.version,
  }
  return compileTemplate(pkg.build, variables)
}

export { compileRunCommands }
