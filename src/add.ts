import execa from 'execa'
import { stringify, JsonMap } from '@iarna/toml'

import { Package } from './types'

const getVersion = async (name: string): Promise<string> => {
  const { stdout } = await execa('apt-cache', ['show', name])
  const match = stdout.match(/^Version:\s+(.+)\s*$/m)
  if (match == null) {
    return null
  }
  return match[1]
}

type TemplateFn = (options: { name: string }) => Promise<Package>

const templates: Record<string, TemplateFn> = {
  apteryx: async ({ name }) => {
    const version = await getVersion(name)

    return {
      name,
      from: 'base',
      version,
      devDependencies: ['apteryx'],
      build: `apteryx ${name}='{{VERSION}}'\n`,
      exports: [],
    }
  },
}

interface AddOptions {
  name: string,
  type: string,
}

const add = async (options: AddOptions) => {
  const { name, type } = options
  if (templates[type] == null) {
    throw new Error(`Could not find template with name: ${type}`)
  }
  const body = await templates[type]({ name })
  console.log(stringify((body as unknown) as JsonMap))
}

export default add
