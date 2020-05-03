import { diff } from '../../diff'

export const command = 'diff [packageA] [packageB]'
export const describe = 'Show a diff of two packages'
export const builder = {
  packageA: {
    describe: 'name of package A',
    type: 'string',
    required: true,
  },
  packageB: {
    describe: 'name of package B',
    type: 'string',
    required: true,
  },
  exclude: {
    describe: 'exclude globs from diff',
    type: 'array',
  },
  expand: {
    describe: 'show files changed within folder',
    type: 'array',
  },
  'build-dir': {
    alias: 'd',
    describe: 'path of the build directory',
    type: 'string',
  },
}

interface Options {
  packageA: string,
  packageB: string,
  exclude?: string[],
  expand?: string[],
  buildDir?: string,
}

export const handler = async (argv: Options) => {
  const { packageA, packageB, exclude, expand, buildDir } = argv
  const list = await diff({
    packageA,
    packageB,
    exclude,
    expand,
    buildDirectory: buildDir,
  })
  console.log(JSON.stringify(list, null, 2))
}
