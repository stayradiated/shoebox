import type { Package, PackageResolver } from '#src/types.ts'
import { compileDependencies } from './compile-dependencies.ts'
import { compileEnv } from './compile-env.ts'
import { compileExportCommands } from './compile-export-commands.ts'
import { compileFooter } from './compile-footer.ts'
import { compileHeader } from './compile-header.ts'
import { compileRunCommands } from './compile-run-commands.ts'
import { createBaseExportDirResolver } from './create-base-export-dir-resolver.ts'
import { createExportsResolver } from './create-exports-resolver.ts'
import { createUserResolver } from './create-user-resolver.ts'

const NL = '\n'

const build = (options: {
  pkg: Package
  resolvePackage: PackageResolver
  withExports: boolean
}): string => {
  const { pkg, resolvePackage, withExports } = options

  const resolveUser = createUserResolver({ resolvePackage })
  const resolveBaseExportDir = createBaseExportDirResolver({ resolvePackage })
  const resolveExports = createExportsResolver({
    resolvePackage,
    resolveUser,
    resolveBaseExportDir,
  })

  const dockerfile: string[] = []

  dockerfile.push(...compileHeader(pkg))

  dockerfile.push(
    ...compileDependencies({
      pkg,
      resolvePackage,
      resolveExports,
    }),
  )

  dockerfile.push(...compileEnv(pkg))

  dockerfile.push(...compileRunCommands(pkg))

  if (withExports) {
    dockerfile.push(
      ...compileExportCommands({ pkg, resolveUser, resolveExports }),
    )
  }

  dockerfile.push(...compileFooter(pkg))

  return dockerfile.join(NL)
}

export { build }
