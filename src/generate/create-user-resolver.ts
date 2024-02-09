import mem from 'mem'
import type { Package, PackageResolver, UserResolver } from '../types.js'

const createUserResolver = (options: {
  resolvePackage: PackageResolver
}): UserResolver => {
  const { resolvePackage } = options

  const resolveUser: UserResolver = mem(
    (package_: Package): string => {
      if (package_.user != null) {
        return package_.user
      }

      if (package_.from != null) {
        const parent = resolvePackage(package_.from)
        const user = resolveUser(parent)
        if (user != null) {
          return user
        }
      }

      return ''
    },
    {
      cacheKey: ([package_]) => package_.name,
    },
  )
  return resolveUser
}

export { createUserResolver }
