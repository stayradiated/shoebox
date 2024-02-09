import type { DGraph } from '@thi.ng/dgraph'
import type { Package, DependencyResolver, PackageResolver } from '../types.js'

type BuildDependencyGraphOptions = {
  package: Package
  getDependencies: DependencyResolver
  resolvePackage: PackageResolver
  graph: DGraph<Package>
}

const buildDependencyGraph = (
  options: BuildDependencyGraphOptions,
): DGraph<Package> => {
  const { package: package_, getDependencies, resolvePackage, graph } = options

  graph.addNode(package_)

  const dependencies = getDependencies(package_, resolvePackage)
  for (const dependency of dependencies) {
    graph.addDependency(package_, dependency)
    buildDependencyGraph({
      package: dependency,
      getDependencies,
      resolvePackage,
      graph,
    })
  }

  return graph
}

export { buildDependencyGraph }
