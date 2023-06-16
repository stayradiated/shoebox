import { fetch } from 'undici'
import { z } from 'zod'
import { githubHeaders } from './github-utils.js'

const $Response = z.array(
  z.object({
    tag_name: z.string().optional(),
  }),
)

type CheckUpdatesGithubReleaseOptions = {
  url: string
  matchTag?: string
  removePrefix?: string
}

const checkUpdatesGithubRelease = async (
  options: CheckUpdatesGithubReleaseOptions,
): Promise<string> => {
  const { url, matchTag, removePrefix } = options

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
      `Invalid response from github:\n\n${JSON.stringify(rawBody)}`,
    )
  }

  const matchTagRegex = matchTag ? new RegExp(matchTag) : undefined

  const latestReleaseWithTag = body.data.find((release) => {
    // Console.log(release.tag_name, matchTagRegex)
    return (
      release.tag_name &&
      (!matchTagRegex || matchTagRegex.test(release.tag_name))
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
