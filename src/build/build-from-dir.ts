import { composeResolvers } from '../tree/compose-resolvers.ts'
import { createPackageResolver } from '../tree/create-package-resolver.ts'
import { readPackages } from '../tree/read-packages.ts'
import { resolveDependencies } from '../tree/resolve-dependencies.ts'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.ts'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.ts'
import { resolveFrom } from '../tree/resolve-from.ts'
import { build } from './build.ts'

type BuildOptions = {
  packageName: string
  packageDirectory: string
  buildDirectory?: string
  tag: string
  verbose?: boolean
}

const buildFromDir = async (options: BuildOptions): Promise<void> => {
  const { packageName, packageDirectory, tag, buildDirectory, verbose } =
    options

  const packageMap = await readPackages(packageDirectory)
  const resolvePackage = createPackageResolver(packageMap)
  const package_ = resolvePackage(packageName)

  const tree = resolveDependencyTree(
    package_,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )

  return build({
    tree,
    resolvePackage,
    tag,
    buildDirectory,
    verbose,
  })
}

export { buildFromDir }
