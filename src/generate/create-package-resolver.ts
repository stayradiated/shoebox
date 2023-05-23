import mem from 'mem'
import type { Package, PackageMap, PackageResolver } from '../types.js'

const createPackageResolver = (packageMap: PackageMap): PackageResolver => {
  return mem((name: string): Package => {
    const pkg = packageMap.get(name)
    if (!pkg) {
      throw new Error(`Could not resolve package: "${name}"`)
    }

    return pkg
  })
}

export { createPackageResolver }
