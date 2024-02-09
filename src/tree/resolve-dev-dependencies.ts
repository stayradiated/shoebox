import mem from 'mem'
import type { DependencyResolver, Package, PackageResolver } from '../types.js'

const resolveDevelopmentDependencies: DependencyResolver = mem(
  (package_: Package, resolvePackage: PackageResolver): Package[] => {
    if (package_ == null) {
      return []
    }

    return (package_.devDependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
  {
    cacheKey: ([package_]) => package_.name,
  },
)

export { resolveDevelopmentDependencies as resolveDevDependencies }
