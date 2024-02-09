import { readPackages } from '../tree/read-packages.js'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.js'
import { composeResolvers } from '../tree/compose-resolvers.js'
import { resolveFrom } from '../tree/resolve-from.js'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.js'
import { resolveDependencies } from '../tree/resolve-dependencies.js'
import { createPackageResolver } from '../tree/create-package-resolver.js'
import { buildAll } from './build-all.js'

type BuildPackageFromDirOptions = {
  packageName: string
  packageDirectory: string
}

const buildPackageFromDir = async (
  options: BuildPackageFromDirOptions,
): Promise<string> => {
  const { packageName, packageDirectory } = options

  const packageMap = await readPackages(packageDirectory)
  const resolvePackage = createPackageResolver(packageMap)
  const package_ = resolvePackage(packageName)

  const tree = resolveDependencyTree(
    package_,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )

  const dockerfile = await buildAll({ tree, resolvePackage })

  return dockerfile
}

export { buildPackageFromDir }
