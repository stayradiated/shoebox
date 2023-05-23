import mem from 'mem'
import type { DependencyResolver, Package, PackageResolver } from '../types.js'

const resolveDependencies: DependencyResolver = mem(
  (pkg: Package, resolvePackage: PackageResolver): Package[] => {
    if (pkg == null) {
      return []
    }

    return (pkg.dependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
  {
    cacheKey: ([pkg]) => pkg.name,
  },
)

export { resolveDependencies }
