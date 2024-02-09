import mem from 'mem'
import type { DependencyResolver, Package, PackageResolver } from '../types.js'

const resolveFrom: DependencyResolver = mem(
  (package_: Package, resolvePackage: PackageResolver): Package[] => {
    if (package_ == null) {
      return []
    }

    if (package_.from == null) {
      return []
    }

    return [resolvePackage(package_.from)]
  },
  {
    cacheKey: ([package_]) => package_.name,
  },
)

export { resolveFrom }
