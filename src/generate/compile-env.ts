import type { Package } from '../types.js'

const compileEnv = (package_: Package): string[] => {
  if (package_.env == null || package_.env.length === 0) {
    return []
  }

  const env = package_.env
    .map(([key, value]) => {
      return `${key}=${value.replaceAll(/\s/g, '\\ ')}`
    })
    .join(' \\\n  ')

  return [`ENV \\\n  ${env}`]
}

export { compileEnv }
