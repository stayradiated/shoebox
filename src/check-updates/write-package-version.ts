import * as fs from 'node:fs/promises'
import escapeStringRegexp from 'escape-string-regexp'
import type { PackageInfo } from '../types.js'

const writePackageVersion = async (
  packageInfo: PackageInfo,
  version: string,
) => {
  const { filepath, content, package: package_ } = packageInfo
  const currentVersion = package_.version

  if (!currentVersion) {
    throw new Error(`Could not find pkg.version for ${package_.name}`)
  }

  const escapedVersion = escapeStringRegexp(currentVersion)

  const regex = new RegExp(`^version\\s*=\\s*['"]${escapedVersion}['"]`, 'm')
  if (!regex.test(content)) {
    throw new Error(
      `Could not find version = "${currentVersion}" in ${filepath}`,
    )
  }

  const updatedContent = content.replace(regex, `version = '${version}'`)

  await fs.writeFile(filepath, updatedContent)
}

export { writePackageVersion }
