import { fetch } from 'undici'
import { z } from 'zod'
import flexver from 'flexver'
import {
  githubHeaders,
  githubRateLimit,
  parseGithubUrl,
} from './github-utils.js'

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

  const { owner, repo } = parseGithubUrl(url)

  const tagsUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags`
  const rawBody = await githubRateLimit(async () => {
    const response = await fetch(tagsUrl, {
      headers: githubHeaders,
    })
    return response.json()
  })
  const bodyResult = $Response.safeParse(rawBody)
  if (!bodyResult.success) {
    console.log(
      `${tagsUrl}\n${JSON.stringify(
        Object.fromEntries(githubHeaders.entries()),
        null,
        2,
      )}\n------------\n${JSON.stringify(rawBody)}\n------------`,
    )
    throw new Error(`Invalid response from ${tagsUrl}: ${bodyResult.error}`)
  }

  const body = bodyResult.data
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
