import type { Package } from '../types.js'

const compileEnv = (pkg: Package): string[] => {
  if (pkg.env == null || pkg.env.length === 0) {
    return []
  }

  const env = pkg.env
    .map(([key, value]) => {
      return `${key}=${value.replaceAll(/\s/g, '\\ ')}`
    })
    .join(' \\\n  ')

  return [`ENV \\\n  ${env}`]
}

export { compileEnv }
