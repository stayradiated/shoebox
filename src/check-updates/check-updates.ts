import type { Package } from '../types.js'
import { checkUpdatesApt } from './check-updates-apt.js'
import { checkUpdatesJson } from './check-updates-json.js'
import { checkUpdatesGithubCommit } from './check-updates-github-commit.js'
import { checkUpdatesGithubRelease } from './check-updates-github-release.js'
import { checkUpdatesGithubTag } from './check-updates-github-tag.js'
import { checkUpdatesNpm } from './check-updates-npm.js'

type CheckUpdatesOptions = {
  pkg: Package
}

type CheckUpdateResult = {
  latestVersion: string
}

const checkUpdates = async (
  options: CheckUpdatesOptions,
): Promise<CheckUpdateResult | undefined> => {
  const { pkg } = options

  if (!pkg.version) {
    console.warn(`Skipping package ${pkg.name} as it does not have a version.`)
    return
  }

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

    case 'npm': {
      latestVersion = await checkUpdatesNpm(pkg.checkUpdates)
      break
    }

    case 'apt': {
      latestVersion = await checkUpdatesApt(pkg.checkUpdates)
      break
    }

    case 'json': {
      latestVersion = await checkUpdatesJson(pkg.checkUpdates)
      break
    }

    default: {
      throw new Error(`Unknown checkUpdates type: ${type}`)
    }
  }

  return {
    latestVersion,
  }
}

export { checkUpdates }
