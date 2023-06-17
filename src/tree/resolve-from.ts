import mem from 'mem'
import type { DependencyResolver, Package, PackageResolver } from '../types.js'

const resolveFrom: DependencyResolver = mem(
  (pkg: Package, resolvePackage: PackageResolver): Package[] => {
    if (pkg == null) {
      return []
    }

    if (pkg.from == null) {
      return []
    }

    return [resolvePackage(pkg.from)]
  },
  {
    cacheKey: ([pkg]) => pkg.name,
  },
)

export { resolveFrom }
