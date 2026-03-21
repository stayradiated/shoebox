import { build, localTag } from '../build/index.ts'
import { composeResolvers } from '../tree/compose-resolvers.ts'
import { createPackageResolver } from '../tree/create-package-resolver.ts'
import { readPackages } from '../tree/read-packages.ts'
import { resolveDependencies } from '../tree/resolve-dependencies.ts'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.ts'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.ts'
import { resolveFrom } from '../tree/resolve-from.ts'
import { containerDiff } from './container-diff.ts'
import { removeGlobs } from './remove-globs.ts'

type DiffOptions = {
  packageName: string
  packageDirectory: string
  exclude?: string[]
  expand?: string[]
  buildDirectory?: string
  verbose?: boolean
}

const diff = async (options: DiffOptions) => {
  const {
    packageName,
    packageDirectory,
    exclude: excludeOverride,
    expand = [],
    buildDirectory,
    verbose,
  } = options

  const packageMap = await readPackages(packageDirectory)
  const resolvePackage = createPackageResolver(packageMap)
  const package_ = resolvePackage(packageName)

  const tree = resolveDependencyTree(
    package_,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )

  const tagWithBuildCmd = localTag(packageName)

  await build({
    tree,
    resolvePackage,
    tag: tagWithBuildCmd,
    buildDirectory,
    verbose,
  })

  // Wipe build command
  package_.build = ''
  const tagWithoutBuildCmd = localTag(`${packageName}-base`)

  await build({
    tree,
    resolvePackage,
    tag: tagWithoutBuildCmd,
    buildDirectory,
    verbose,
  })

  const result = await containerDiff({
    tagA: tagWithoutBuildCmd,
    tagB: tagWithBuildCmd,
    expand,
  })

  const exclude = excludeOverride ?? package_.diff?.exclude ?? []
  if (exclude == null || exclude.length === 0) {
    return result
  }

  return removeGlobs(result, exclude)
}

export { diff }
