import type { DependencyResolver, Package } from '../types.js'

const composeResolvers = (
  ...resolvers: DependencyResolver[]
): DependencyResolver => {
  return (pkg, resolvePackage): Package[] => {
    const set = resolvers.reduce<Set<Package>>((set, resolver) => {
      for (const item of resolver(pkg, resolvePackage)) set.add(item)
      return set
    }, new Set())
    return [...set]
  }
}

export { composeResolvers }
