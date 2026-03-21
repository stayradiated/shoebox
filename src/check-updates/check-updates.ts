import type { Package } from '#src/types.ts'
import { checkUpdatesApt } from './check-updates-apt.ts'
import { checkUpdatesGithubCommit } from './check-updates-github-commit.ts'
import { checkUpdatesGithubRelease } from './check-updates-github-release.ts'
import { checkUpdatesGithubTag } from './check-updates-github-tag.ts'
import { checkUpdatesJson } from './check-updates-json.ts'
import { checkUpdatesNpm } from './check-updates-npm.ts'
import { checkUpdatesText } from './check-updates-text.ts'

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

    case 'text': {
      latestVersion = await checkUpdatesText(pkg.checkUpdates)
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
