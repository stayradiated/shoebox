import { fetch } from 'undici'
import { z } from 'zod'
import {
  githubHeaders,
  githubRateLimit,
  parseGithubUrl,
} from './github-utils.js'

const $Response = z.array(
  z.object({
    name: z.string().nullable(),
    tag_name: z.string().optional(),
    prerelease: z.boolean().optional(),
  }),
)

type CheckUpdatesGithubReleaseOptions = {
  url: string
  matchTag?: string
  matchName?: string
  removePrefix?: string
  matchPrerelease?: boolean
}

const checkUpdatesGithubRelease = async (
  options: CheckUpdatesGithubReleaseOptions,
): Promise<string> => {
  const { url, matchTag, matchName, removePrefix, matchPrerelease } = options

  const { owner, repo } = parseGithubUrl(url)

  const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases`
  const rawBody = await githubRateLimit(async () => {
    const response = await fetch(releasesUrl, {
      headers: githubHeaders,
    })
    return response.json()
  })
  const body = $Response.safeParse(rawBody)
  if (!body.success) {
    throw new Error(
      `Invalid response from github:\n\n${JSON.stringify(
        rawBody,
      )}\n\n${JSON.stringify(body.error.issues, null, 2)}`,
    )
  }

  const matchTagRegex = matchTag ? new RegExp(matchTag) : undefined
  const matchNameRegex = matchName ? new RegExp(matchName) : undefined

  const latestReleaseWithTag = body.data.find((release) => {
    return (
      release.tag_name &&
      (!matchTagRegex || matchTagRegex.test(release.tag_name)) &&
      (!matchNameRegex ||
        (release.name && matchNameRegex.test(release.name))) &&
      (typeof matchPrerelease !== 'boolean' ||
        matchPrerelease === release.prerelease)
    )
  })
  if (!latestReleaseWithTag?.tag_name) {
    throw new Error(`No releases found with a tag for ${url}`)
  }

  const version = latestReleaseWithTag.tag_name

  if (removePrefix) {
    const prefixRegex = new RegExp(`^${removePrefix}`)
    return version.replace(prefixRegex, '')
  }

  return version
}

export { checkUpdatesGithubRelease }
