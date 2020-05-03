import { build } from '../../build'

export const command = 'build [name]'
export const describe = 'Build a package with docker'
export const builder = {
  name: {
    describe: 'name of the package',
    type: 'string',
    required: true,
  },
  'build-dir': {
    alias: 'd',
    describe: 'path of the build directory',
    type: 'string',
  },
  tag: {
    alias: 't',
    describe: 'docker tag',
    type: 'string',
  },
  verbose: {
    alias: 'v',
    describe: 'display docker build info',
    type: 'boolean',
  },
}

interface Options {
  name: string,
  buildDir?: string,
  tag?: string,
  verbose?: boolean,
}

export const handler = async (argv: Options) => {
  const { name, buildDir, tag, verbose } = argv

  await build({ name, buildDirectory: buildDir, tag, verbose })
}
