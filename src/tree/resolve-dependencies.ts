import mem from 'mem'
import type { DependencyResolver, Package, PackageResolver } from '../types.js'

const resolveDependencies: DependencyResolver = mem(
  (package_: Package, resolvePackage: PackageResolver): Package[] => {
    if (package_ == null) {
      return []
    }

    return (package_.dependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
  {
    cacheKey: ([package_]) => package_.name,
  },
)

export { resolveDependencies }
