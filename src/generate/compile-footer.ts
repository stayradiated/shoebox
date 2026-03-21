import type { Package } from '#src/types.ts'

const compileFooter = (package_: Package): string[] => {
  const { command } = package_
  const lines = [] as string[]
  if (command != null) {
    lines.push(`CMD ${command}`)
  }

  return lines
}

export { compileFooter }
