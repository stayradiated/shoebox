import * as fs from 'node:fs/promises'
import escapeStringRegexp from 'escape-string-regexp'
import type { PackageInfo } from '../types.js'

const writePackageVersion = async (
  packageInfo: PackageInfo,
  version: string,
) => {
  const { filepath, content, package: pkg } = packageInfo
  const currentVersion = pkg.version

  if (!currentVersion) {
    throw new Error(`Could not find pkg.version for ${pkg.name}`)
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
