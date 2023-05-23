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
  console.log(versions)
  return '0.0.0'
}

const templateFn: TemplateFn = async (options) => {
  const { name } = options
  const version = await getVersion(name)

  return {
    name,
    from: 'base',
    version,
    devDependencies: ['apteryx'],
    build: `apteryx ${name}='{{VERSION}}'\n`,
    exports: [],
  }
}

export default templateFn
