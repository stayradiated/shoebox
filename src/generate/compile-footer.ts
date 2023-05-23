import type { Package } from '../types.js'

const compileFooter = (pkg: Package): string[] => {
  const { command } = pkg
  const lines = [] as string[]
  if (command != null) {
    lines.push(`CMD ${command}`)
  }

  return lines
}

export { compileFooter }
