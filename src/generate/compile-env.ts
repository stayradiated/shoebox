import type { Package } from '#src/types.ts'

const compileEnv = (package_: Package): string[] => {
  if (package_.env == null || package_.env.length === 0) {
    return []
  }

  const env = package_.env
    .map(([key, value]) => {
      return `${key}=${value.replaceAll(/\s/g, String.raw`\ `)}`
    })
    .join(' \\\n  ')

  return [`ENV \\\n  ${env}`]
}

export { compileEnv }
