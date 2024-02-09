import undici from 'undici'
import flexver from 'flexver'
import type { TemplateFn } from './types.js'

export type Root = {
  releases: Record<string, unknown>
}

const getVersion = async (name: string): Promise<string> => {
  const response = await undici.fetch(`https://pypi.org/pypi/${name}/json`)
  const result = (await response.json()) as Root
  const versions = Object.keys(result.releases).sort(flexver).reverse()
  const latestVersion = versions[0]
  return latestVersion ?? '?.?.?'
}

const templateFunction: TemplateFn = async (options) => {
  const { name } = options
  const version = await getVersion(name)

  return {
    name,
    from: 'base',
    version,
    devDependencies: ['python3-pip', 'pipx'],
    build: `pipx install ${name}=='{{VERSION}}'\n`,
    exports: [`/usr/local/bin/${name}`, '/usr/local/pipx/'],
  }
}

export default templateFunction
