import { Headers } from 'undici'
import PQueue from 'p-queue'

const githubToken = process.env['GH_TOKEN']

const githubHeaders = new Headers({
  Accept: 'application/vnd.github+json',
  'X-Github-Api-Version': '2022-11-28',
})

if (githubToken) {
  githubHeaders.set('Authorization', `Bearer ${githubToken}`)
}

const queue = new PQueue({
  concurrency: 2,
  intervalCap: 5,
  interval: 1000,
})

const githubRateLimit = async <T>(fn: () => Promise<T>): Promise<T> => {
  return queue.add(async () => fn(), {
    // Fixes typescript error with queue.add possibly returning void
    throwOnTimeout: true,
  })
}

type GithubUrl = {
  owner: string
  repo: string
}

const parseGithubUrl = (url: string): GithubUrl => {
  // Regex to match a github owner and repo name from a github url
  const githubUrlRegex =
    /^https:\/\/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+$)/
  const match = githubUrlRegex.exec(url)

  if (!match?.groups) {
    throw new Error(`Invalid github repo url: "${url}"`)
  }

  const { owner, repo } = match.groups
  if (!owner || !repo) {
    throw new Error(
      `Invalid github repo url: "${url}": ${JSON.stringify(match)}`,
    )
  }

  return { owner, repo }
}

export { githubHeaders, githubRateLimit, parseGithubUrl }
