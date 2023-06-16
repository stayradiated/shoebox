import { Headers } from 'undici'

const githubToken = process.env['GH_TOKEN']

const githubHeaders = new Headers({
  Accept: 'application/vnd.github+json',
  'X-Github-Api-Version': '2022-11-28',
})

if (githubToken) {
  githubHeaders.set('Authorization', `Bearer ${githubToken}`)
}

export { githubHeaders }
