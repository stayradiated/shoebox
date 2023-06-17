import mem from 'mem'
import type { DependencyResolver, Package, PackageResolver } from '../types.js'

const resolveDevDependencies: DependencyResolver = mem(
  (pkg: Package, resolvePackage: PackageResolver): Package[] => {
    if (pkg == null) {
      return []
    }

    return (pkg.devDependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
  {
    cacheKey: ([pkg]) => pkg.name,
  },
)

export { resolveDevDependencies }
