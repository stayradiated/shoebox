import { execa } from 'execa'
import type { TemplateFn } from './types.js'

const getVersion = async (name: string): Promise<string> => {
  const { stdout } = await execa('apt-cache', ['show', name])
  const match = /^Version:\s+(.+)\s*$/m.exec(stdout)
  const version = match?.[1]
  if (typeof version !== 'string') {
    return '?.?.?'
  }

  return version
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
