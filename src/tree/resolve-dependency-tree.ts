import { DGraph } from '@thi.ng/dgraph'
import type {
  DependencyResolver,
  Package,
  PackageResolver,
  PackageTree,
} from '../types.js'
import { buildDependencyGraph } from './build-dependency-graph.js'

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
