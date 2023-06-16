import type { Package } from '../types.js'
import { checkUpdatesGithubRelease } from './check-updates-github-release.js'
import { checkUpdatesGithubCommit } from './check-updates-github-commit.js'
import { checkUpdatesGithubTag } from './check-updates-github-tag.js'

type CheckUpdatesOptions = {
  pkg: Package
}

const checkUpdates = async (options: CheckUpdatesOptions) => {
  const { pkg } = options

  if (!pkg.checkUpdates) {
    console.warn(
      `WARNING: package ${pkg.name} is missing a "checkUpdates" definition.`,
    )
    return
  }

  let latestVersion: string
  const { type } = pkg.checkUpdates
  switch (type) {
    case 'github-release': {
      latestVersion = await checkUpdatesGithubRelease(pkg.checkUpdates)
      break
    }

    case 'github-commit': {
      latestVersion = await checkUpdatesGithubCommit(pkg.checkUpdates)
      break
    }

    case 'github-tag': {
      latestVersion = await checkUpdatesGithubTag(pkg.checkUpdates)
      break
    }

    default: {
      throw new Error(`Unknown checkUpdates type: ${type}`)
    }
  }

  if (latestVersion === pkg.version) {
    console.log(`\n${pkg.name} is up to date`)
    console.log(`  ${pkg.version}`)
  } else {
    console.log(`\nNew version of ${pkg.name} available:`)
    console.log(`  ${pkg.version} -> ${latestVersion}`)
  }
}

export { checkUpdates }