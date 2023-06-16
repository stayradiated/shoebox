import { readPackages } from '../generate/read-packages.js'
import { createPackageResolver } from '../generate/create-package-resolver.js'
import { resolveDependencyTree } from '../generate/resolve-dependency-tree.js'
import { composeResolvers } from '../generate/compose-resolvers.js'
import { resolveFrom } from '../generate/resolve-from.js'
import { resolveDependencies } from '../generate/resolve-dependencies.js'
import { resolveDevDependencies } from '../generate/resolve-dev-dependencies.js'
import { checkUpdates as checkPackageUpdates } from './check-updates.js'

type CheckUpdatesOptions = {
  packageName: string
  recursive?: boolean
}

const checkUpdates = async (options: CheckUpdatesOptions) => {
  const { packageName, recursive } = options

  const packageMap = await readPackages('.')
  const resolvePackage = createPackageResolver(packageMap)
  const pkg = resolvePackage(packageName)

  if (!recursive) {
    return checkPackageUpdates({ pkg })
  }

  const tree = resolveDependencyTree(
    pkg,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )

  return [...tree.nodes()].map(async (pkg) => checkPackageUpdates({ pkg }))
}

export { checkUpdates }
