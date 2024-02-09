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
    (package_: Package): Export[] => {
      const exports = [] as Export[]

      if (package_.exports != null) {
        exports.push({
          user: resolveUser(package_),
          exports: [
            {
              baseExportDir: resolveBaseExportDir(package_),
              filePaths: package_.exports,
            },
          ],
        })
      }

      if (package_.dependencies != null) {
        package_.dependencies.map((dependencyName) => {
          const dependency = resolvePackage(dependencyName)
          appendExports(exports, resolveExports(dependency))
        })
      }

      return exports
    },
    {
      cacheKey: ([package_]) => package_.name,
    },
  )

  return resolveExports
}

export { createExportsResolver }
