import pMap from 'p-map'
import { composeResolvers } from '../tree/compose-resolvers.ts'
import { createPackageResolver } from '../tree/create-package-resolver.ts'
import { readPackages } from '../tree/read-packages.ts'
import { resolveDependencies } from '../tree/resolve-dependencies.ts'
import { resolveDependencyTree } from '../tree/resolve-dependency-tree.ts'
import { resolveDevDependencies } from '../tree/resolve-dev-dependencies.ts'
import { resolveFrom } from '../tree/resolve-from.ts'
import { checkUpdates as checkPackageUpdates } from './check-updates.ts'
import { writePackageVersion } from './write-package-version.ts'

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
        console.info(`\n⏫ ${package_.name} can be upgraded:
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
        console.info(`\n✅ ${package_.name} is up to date:
-> ${package_.version}`)
      }
    },
    {
      concurrency: 5,
    },
  )
}

export { checkUpdates }
