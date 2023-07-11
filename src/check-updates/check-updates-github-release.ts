import { fetch } from 'undici'
import { z } from 'zod'
import { githubHeaders } from './github-utils.js'

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

  // Regex to match a github owner and repo name from a github url
  const githubUrlRegex =
    /^https:\/\/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+$)/
  const match = githubUrlRegex.exec(url)

  if (!match) {
    throw new Error(`Invalid github repo url: "${url}"`)
  }

  const { owner, repo } = match.groups!

  const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases`
  const response = await fetch(releasesUrl, {
    headers: githubHeaders,
  })
  const rawBody = await response.json()
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
