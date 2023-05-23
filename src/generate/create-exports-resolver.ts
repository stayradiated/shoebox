import mem from 'mem'
import type {
  Export,
  ExportsResolver,
  Package,
  PackageResolver,
  UserResolver,
  BaseExportDirResolver,
} from '../types.js'
import { appendExports } from './append-exports.js'

const createExportsResolver = (options: {
  resolvePackage: PackageResolver
  resolveUser: UserResolver
  resolveBaseExportDir: BaseExportDirResolver
}): ExportsResolver => {
  const { resolvePackage, resolveUser, resolveBaseExportDir } = options

  const resolveExports: ExportsResolver = mem(
    (pkg: Package): Export[] => {
      const exports = [] as Export[]

      if (pkg.exports != null) {
        exports.push({
          user: resolveUser(pkg),
          exports: [
            {
              baseExportDir: resolveBaseExportDir(pkg),
              filePaths: pkg.exports,
            },
          ],
        })
      }

      if (pkg.dependencies != null) {
        pkg.dependencies.map((dependencyName) => {
          const dependency = resolvePackage(dependencyName)
          appendExports(exports, resolveExports(dependency))
        })
      }

      return exports
    },
    {
      cacheKey: ([pkg]) => pkg.name,
    },
  )

  return resolveExports
}

export { createExportsResolver }
