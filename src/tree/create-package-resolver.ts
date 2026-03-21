import mem from 'mem'
import type { Package, PackageMap, PackageResolver } from '#src/types.ts'

const createPackageResolver = (packageMap: PackageMap): PackageResolver => {
  return mem((name: string): Package => {
    const record = packageMap.get(name)
    if (!record) {
      throw new Error(`Could not resolve package: "${name}"`)
    }

    return record.package
  })
}

export { createPackageResolver }
