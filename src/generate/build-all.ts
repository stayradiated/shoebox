import type { PackageTree, PackageResolver } from '../types.js'
import { build } from './build.js'

type BuildAllOptions = {
  tree: PackageTree
  resolvePackage: PackageResolver
}

const buildAll = async (options: BuildAllOptions) => {
  const { tree, resolvePackage } = options

  const dependencies = tree.sort()

  let dockerfile = ''

  for (const dependency of dependencies) {
    const parents = tree.immediateDependents(dependency)

    let isInheritedFrom = false
    let isDependendOn = false
    for (const parent of parents) {
      if (parent.from === dependency.name) {
        isInheritedFrom = true
      }

      const parentDependencies = [
        ...(parent.dependencies || []),
        ...(parent.devDependencies || []),
      ]
      if (parentDependencies.includes(dependency.name)) {
        isDependendOn = true
      }
    }

    if (isInheritedFrom && isDependendOn) {
      throw new Error(
        `Package ${dependency.name} is both inherited and depended on`,
      )
    }

    dockerfile += build({
      pkg: dependency,
      resolvePackage,
      withExports: isDependendOn,
    })
  }

  return dockerfile
}

export { buildAll }
