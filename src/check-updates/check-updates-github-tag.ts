import { fetch } from 'undici'
import { z } from 'zod'
import flexver from 'flexver'
import { githubHeaders } from './github-utils.js'

const $Response = z.array(
  z.object({
    ref: z.string(),
  }),
)

type CheckUpdatesGithubTagOptions = {
  url: string
  matchTag?: string
  removePrefix?: string
}

const checkUpdatesGithubTag = async (
  options: CheckUpdatesGithubTagOptions,
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

  const tagsUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags`
  const response = await fetch(tagsUrl, {
    headers: githubHeaders,
  })
  const rawBody = await response.json()
  const body = $Response.parse(rawBody)

  const matchTagRegex = matchTag ? new RegExp(matchTag) : undefined

  const tagList = body
    .map((tag) => tag.ref.replace('refs/tags/', ''))
    .filter((tag) => {
      return !matchTagRegex || matchTagRegex.test(tag)
    })
    .sort(flexver)
    .reverse()

  const version = tagList[0]
  if (!version) {
    throw new Error(`No tags found for ${url}`)
  }

  if (removePrefix) {
    const prefixRegex = new RegExp(`^${removePrefix}`)
    return version.replace(prefixRegex, '')
  }

  return version
}

export { checkUpdatesGithubTag }
