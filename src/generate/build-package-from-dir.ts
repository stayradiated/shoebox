import { composeResolvers } from '../tree/compose-resolvers.ts'
import { createPackageResolver } from '../tree/create-package-resolver.ts'
import { readPackages } from '../tree/read-packages.ts'
import { resolveDependencies } from '../tree/resolve-dependencies.ts'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.ts'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.ts'
import { resolveFrom } from '../tree/resolve-from.ts'
import { buildAll } from './build-all.ts'

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
