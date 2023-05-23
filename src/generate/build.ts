import type { Package, PackageResolver } from '../types.js'
import { createUserResolver } from './create-user-resolver.js'
import { createBaseExportDirResolver } from './create-base-export-dir-resolver.js'
import { createExportsResolver } from './create-exports-resolver.js'
import { compileHeader } from './compile-header.js'
import { compileDependencies } from './compile-dependencies.js'
import { compileEnv } from './compile-env.js'
import { compileRunCommands } from './compile-run-commands.js'
import { compileExportCommands } from './compile-export-commands.js'
import { compileFooter } from './compile-footer.js'

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
