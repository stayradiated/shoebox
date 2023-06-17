import { DGraph } from '@thi.ng/dgraph'
import type {
  DependencyResolver,
  Package,
  PackageResolver,
  PackageTree,
} from '../types.js'
import { buildDependencyGraph } from './build-dependency-graph.js'

const resolveDependencyTree = (
  pkg: Package,
  getDependencies: DependencyResolver,
  resolvePackage: PackageResolver,
): PackageTree => {
  const graph = new DGraph<Package>()
  buildDependencyGraph({
    package: pkg,
    getDependencies,
    resolvePackage,
    graph,
  })
  return graph
}

export { resolveDependencyTree }
