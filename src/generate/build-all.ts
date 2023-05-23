import { readPackages } from './read-packages.js'
import { resolveDependencyTree } from './resolve-dependency-tree.js'
import { composeResolvers } from './compose-resolvers.js'
import { resolveFrom } from './resolve-from.js'
import { resolveDevDependencies } from './resolve-dev-dependencies.js'
import { resolveDependencies } from './resolve-dependencies.js'
import { createPackageResolver } from './create-package-resolver.js'
import { build } from './build.js'

const buildAll = async (packageName: string) => {
  const packageMap = await readPackages('.')
  const resolvePackage = createPackageResolver(packageMap)
  const pkg = resolvePackage(packageName)

  const tree = resolveDependencyTree(
    pkg,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )

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

    dockerfile += await build({
      pkg: dependency,
      resolvePackage,
      withExports: isDependendOn,
    })
  }

  return dockerfile
}

export { buildAll }
