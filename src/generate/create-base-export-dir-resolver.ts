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
    (package_: Package): string => {
      if (package_.baseExportDir != null) {
        return package_.baseExportDir
      }

      if (package_.from != null) {
        const parent = resolvePackage(package_.from)
        const user = resolveBaseExportDir(parent)
        if (user != null) {
          return user
        }
      }

      throw new Error(`Could not resolve baseExportDir for ${package_.name}`)
    },
    {
      cacheKey: ([package_]) => package_.name,
    },
  )
  return resolveBaseExportDir
}

export { createBaseExportDirResolver }
