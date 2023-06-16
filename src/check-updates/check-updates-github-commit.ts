import { fetch } from 'undici'
import { z } from 'zod'
import { githubHeaders } from './github-utils.js'

const $LatestCommitResponse = z.array(
  z.object({
    sha: z.string(),
  }),
)

type CheckGithubCommitOptions = {
  url: string
}

const checkUpdatesGithubCommit = async (options: CheckGithubCommitOptions) => {
  const { url } = options

  console.log(`Checking github release for ${url}`)

  // Regex to match a github owner and repo name from a github url
  const githubUrlRegex =
    /^https:\/\/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+$)/
  const match = githubUrlRegex.exec(url)

  if (!match) {
    throw new Error(`Invalid github repo url: "${url}"`)
  }

  const { owner, repo } = match.groups!

  const latestCommitUrl = `https://api.github.com/repos/${owner}/${repo}/commits`
  const response = await fetch(latestCommitUrl, {
    headers: githubHeaders,
  })
  const rawBody = await response.json()
  const body = $LatestCommitResponse.parse(rawBody)

  const latestCommit = body[0]
  if (!latestCommit) {
    throw new Error(`No commits found for ${url}`)
  }

  const version = latestCommit.sha

  return version
}

export { checkUpdatesGithubCommit }
