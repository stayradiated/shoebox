import { DGraph } from '@thi.ng/dgraph'
import type {
  DependencyResolver,
  Package,
  PackageResolver,
  PackageTree,
} from '#src/types.ts'
import { buildDependencyGraph } from './build-dependency-graph.ts'

const resolveDependencyTree = (
  package_: Package,
  getDependencies: DependencyResolver,
  resolvePackage: PackageResolver,
): PackageTree => {
  const graph = new DGraph<Package>()
  buildDependencyGraph({
    package: package_,
    getDependencies,
    resolvePackage,
    graph,
  })
  return graph
}

export { resolveDependencyTree }
