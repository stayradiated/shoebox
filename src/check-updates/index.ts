import { readPackages } from '../generate/read-packages.js'
import { createPackageResolver } from '../generate/create-package-resolver.js'
import { resolveDependencyTree } from '../generate/resolve-dependency-tree.js'
import { composeResolvers } from '../generate/compose-resolvers.js'
import { resolveFrom } from '../generate/resolve-from.js'
import { resolveDependencies } from '../generate/resolve-dependencies.js'
import { resolveDevDependencies } from '../generate/resolve-dev-dependencies.js'
import { checkUpdates as checkPackageUpdates } from './check-updates.js'
import { writePackageVersion } from './write-package-version.js'

type CheckUpdatesOptions = {
  packageName: string
  recursive?: boolean
  upgrade?: boolean
}

const checkUpdates = async (options: CheckUpdatesOptions) => {
  const { packageName, recursive, upgrade } = options

  const packageMap = await readPackages('.')
  const resolvePackage = createPackageResolver(packageMap)
  const pkg = resolvePackage(packageName)

  let pkgList = [pkg]

  if (recursive) {
    const tree = resolveDependencyTree(
      pkg,
      composeResolvers(
        resolveFrom,
        resolveDevDependencies,
        resolveDependencies,
      ),
      resolvePackage,
    )
    pkgList = [...tree.nodes()]
  }

  await Promise.all(
    pkgList.map(async (pkg) => {
      const result = await checkPackageUpdates({ pkg })
      if (!result) {
        return
      }

      const { latestVersion } = result
      const shouldUpdate = pkg.version !== latestVersion

      if (shouldUpdate) {
        console.log(`\n⏫ ${pkg.name} can be upgraded:
   ${pkg.version}
-> ${latestVersion}`)

        if (upgrade) {
          const packageInfo = packageMap.get(pkg.name)
          if (!packageInfo) {
            throw new Error(`Package info not found for ${pkg.name}`)
          }

          await writePackageVersion(packageInfo, latestVersion)
        }
      } else {
        console.log(`\n✅ ${pkg.name} is up to date:
-> ${pkg.version}`)
      }
    }),
  )
}

export { checkUpdates }
