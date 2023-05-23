import mem from 'mem'
import type { Package, PackageResolver, UserResolver } from '../types.js'

const createUserResolver = (options: {
  resolvePackage: PackageResolver
}): UserResolver => {
  const { resolvePackage } = options

  const resolveUser: UserResolver = mem(
    (pkg: Package): string => {
      if (pkg.user != null) {
        return pkg.user
      }

      if (pkg.from != null) {
        const parent = resolvePackage(pkg.from)
        const user = resolveUser(parent)
        if (user != null) {
          return user
        }
      }

      return ''
    },
    {
      cacheKey: ([pkg]) => pkg.name,
    },
  )
  return resolveUser
}

export { createUserResolver }
