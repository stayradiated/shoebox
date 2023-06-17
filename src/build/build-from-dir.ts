import { readPackages } from '../tree/read-packages.js'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.js'
import { composeResolvers } from '../tree/compose-resolvers.js'
import { resolveFrom } from '../tree/resolve-from.js'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.js'
import { resolveDependencies } from '../tree/resolve-dependencies.js'
import { createPackageResolver } from '../tree/create-package-resolver.js'
import { build } from './build.js'

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
  const pkg = resolvePackage(packageName)

  const tree = resolveDependencyTree(
    pkg,
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
