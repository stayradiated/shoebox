import pMap from 'p-map'
import { readPackages } from '../tree/read-packages.js'
import { createPackageResolver } from '../tree/create-package-resolver.js'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.js'
import { composeResolvers } from '../tree/compose-resolvers.js'
import { resolveFrom } from '../tree/resolve-from.js'
import { resolveDependencies } from '../tree/resolve-dependencies.js'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.js'
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
  const package_ = resolvePackage(packageName)

  let packageList = [package_]

  if (recursive) {
    const tree = resolveDependencyTree(
      package_,
      composeResolvers(
        resolveFrom,
        resolveDevDependencies,
        resolveDependencies,
      ),
      resolvePackage,
    )
    packageList = [...tree.nodes()]
  }

  await pMap(
    packageList,
    async (package_) => {
      const result = await checkPackageUpdates({ pkg: package_ })
      if (!result) {
        return
      }

      const { latestVersion } = result
      const shouldUpdate = package_.version !== latestVersion

      if (shouldUpdate) {
        console.log(`\n⏫ ${package_.name} can be upgraded:
   ${package_.version}
-> ${latestVersion}`)

        if (upgrade) {
          const packageInfo = packageMap.get(package_.name)
          if (!packageInfo) {
            throw new Error(`Package info not found for ${package_.name}`)
          }

          await writePackageVersion(packageInfo, latestVersion)
        }
      } else {
        console.log(`\n✅ ${package_.name} is up to date:
-> ${package_.version}`)
      }
    },
    {
      concurrency: 5,
    },
  )
}

export { checkUpdates }
