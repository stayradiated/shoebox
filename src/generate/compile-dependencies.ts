import type { ExportsResolver, Package, PackageResolver } from '#src/types.ts'
import { compileTemplate } from './compile-template.ts'
import { formatCopy } from './format-copy.ts'
import { squashCopyExports } from './squash-copy-exports.ts'

const compileDependencies = (options: {
  pkg: Package
  resolvePackage: PackageResolver
  resolveExports: ExportsResolver
}): string[] => {
  const { pkg, resolvePackage, resolveExports } = options

  const exportEnvLines = [] as string[]
  const installLines = [] as string[]

  const dependencies = [
    ...new Set([...(pkg.devDependencies || []), ...(pkg.dependencies || [])]),
  ]

  const lines = dependencies.flatMap((dependencyName) => {
    const dependency = resolvePackage(dependencyName)
    const { name, install, exportEnv } = dependency

    const lines = [] as string[]

    if (name !== pkg.from) {
      lines.push(
        ...formatCopy(
          squashCopyExports({
            from: name,
            exports: resolveExports(dependency),
          }),
        ),
      )

      if (install) {
        installLines.push(...compileTemplate(install, {}))
      }
    }

    if (exportEnv && exportEnv.length > 0) {
      const env = exportEnv
        .map(([key, value]) => {
          return `${key}=${value.replaceAll(/\s/g, String.raw`\ `)}`
        })
        .join(' \\\n  ')
      exportEnvLines.push(`ENV \\\n  ${env}`)
    }

    return lines
  })

  if (pkg.mount != null) {
    lines.push(
      ...formatCopy(
        pkg.mount.map(([source, destination]) => ({
          src: [source],
          dest: destination,
        })),
      ),
    )
  }

  lines.push(...exportEnvLines, ...installLines)

  return lines
}

export { compileDependencies }
