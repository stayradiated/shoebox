import { checkUpdatesGithubRelease } from '../check-updates/check-updates-github-release.js'
import { parseGithubUrl } from '../check-updates/github-utils.js'
import type { TemplateFn } from './types.js'

export type Root = {
  releases: Record<string, unknown>
}

const templateFn: TemplateFn = async (options) => {
  const { name: url } = options

  const version = await checkUpdatesGithubRelease({ url })
  const { repo } = parseGithubUrl(url)

  return {
    name: repo,
    from: 'base',
    version,
    devDependencies: ['wget'],
    build: `wget \\
  -O /tmp/${repo}.tgz \\
  '${url}/releases/download/v{{VERSION}}/${repo}_{{VERSION}}_linux_amd64.tar.gz'
tar xzvf /tmp/${repo}.tgz
rm /tmp/${repo}.tgz

mv '${repo}_{{VERSION}}_linux_amd64/bin/${repo}' /usr/local/bin/${repo}
rm -r '${repo}_{{VERSION}}_linux_amd64'
`,
    exports: [`/usr/local/bin/${repo}`],
    checkUpdates: {
      type: 'github-release',
      url,
      removePrefix: 'v',
    },
  }
}

export default templateFn
