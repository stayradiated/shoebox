import type { DependencyResolver, Package } from '../types.js'

const composeResolvers = (
  ...resolvers: DependencyResolver[]
): DependencyResolver => {
  return (package_, resolvePackage): Package[] => {
    const set = resolvers.reduce<Set<Package>>((set, resolver) => {
      for (const item of resolver(package_, resolvePackage)) set.add(item)
      return set
    }, new Set())
    return [...set]
  }
}

export { composeResolvers }
