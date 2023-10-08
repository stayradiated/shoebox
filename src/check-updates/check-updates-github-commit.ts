import { fetch } from 'undici'
import { z } from 'zod'
import {
  githubHeaders,
  githubRateLimit,
  parseGithubUrl,
} from './github-utils.js'

const $LatestCommitResponse = z.array(
  z.object({
    sha: z.string(),
  }),
)

type CheckUpdatesGithubCommitOptions = {
  url: string
}

const checkUpdatesGithubCommit = async (
  options: CheckUpdatesGithubCommitOptions,
) => {
  const { url } = options

  const { owner, repo } = parseGithubUrl(url)

  const latestCommitUrl = `https://api.github.com/repos/${owner}/${repo}/commits`
  const rawBody = await githubRateLimit(async () => {
    const response = await fetch(latestCommitUrl, {
      headers: githubHeaders,
    })
    return response.json()
  })
  const body = $LatestCommitResponse.parse(rawBody)

  const latestCommit = body[0]
  if (!latestCommit) {
    throw new Error(`No commits found for ${url}`)
  }

  const version = latestCommit.sha

  return version
}

export { checkUpdatesGithubCommit }
