import type { ArgumentsCamelCase, Argv } from 'yargs'
import { diff } from '../../diff/index.ts'

type Options = ArgumentsCamelCase<{
  name: string
  directory: string
  exclude?: string[]
  expand?: string[]
  buildDir?: string
  quiet?: boolean
}>

const diffCommand = {
  command: 'diff [name]',
  describe: 'Show a diff of two packages',
  builder: (yargs: Argv) =>
    yargs
      .positional('name', {
        describe: 'name of package',
        type: 'string',
        required: true,
      })
      .option('directory', {
        alias: 'd',
        describe: 'path of the package directory',
        type: 'string',
        default: '.',
      })
      .option('exclude', {
        describe: 'exclude globs from diff',
        type: 'array',
      })
      .option('expand', {
        describe: 'show files changed within folder',
        type: 'array',
      })
      .option('build-dir', {
        alias: 'd',
        describe: 'path of the build directory',
        type: 'string',
      })
      .option('quiet', {
        alias: 'q',
        describe: 'hide docker build info',
        type: 'boolean',
      }),

  handler: async (argv: Options) => {
    const {
      name: packageName,
      directory: packageDirectory,
      exclude,
      expand,
      buildDir,
      quiet,
    } = argv

    const list = await diff({
      packageName,
      packageDirectory,
      exclude,
      expand,
      buildDirectory: buildDir,
      verbose: !quiet,
    })

    console.info(JSON.stringify(list, null, 2))
  },
}

export default diffCommand
