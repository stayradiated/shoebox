import mem from 'mem'
import type {
  Package,
  PackageResolver,
  BaseExportDirResolver,
} from '../types.js'

const createBaseExportDirResolver = (options: {
  resolvePackage: PackageResolver
}): BaseExportDirResolver => {
  const { resolvePackage } = options

  const resolveBaseExportDir: BaseExportDirResolver = mem(
    (pkg: Package): string => {
      if (pkg.baseExportDir != null) {
        return pkg.baseExportDir
      }

      if (pkg.from != null) {
        const parent = resolvePackage(pkg.from)
        const user = resolveBaseExportDir(parent)
        if (user != null) {
          return user
        }
      }

      throw new Error(`Could not resolve baseExportDir for ${pkg.name}`)
    },
    {
      cacheKey: ([pkg]) => pkg.name,
    },
  )
  return resolveBaseExportDir
}

export { createBaseExportDirResolver }
