import type { ArgumentsCamelCase, Argv } from 'yargs'
import { buildFromDir, localTag } from '../../build/index.ts'

type Options = ArgumentsCamelCase<{
  name: string
  directory: string
  buildDir?: string
  tag?: string
  verbose?: boolean
}>

const buildCommand = {
  command: 'build [name]',
  describe: 'Build a package with docker',
  builder: (yargs: Argv) =>
    yargs
      .positional('name', {
        describe: 'name of the package',
        type: 'string',
        required: true,
      })
      .option('directory', {
        alias: 'd',
        describe: 'path of the package directory',
        type: 'string',
        default: '.',
      })
      .option('build-dir', {
        alias: 'b',
        describe: 'path of the build directory',
        type: 'string',
      })
      .option('tag', {
        alias: 't',
        describe: 'docker tag',
        type: 'string',
      })
      .option('verbose', {
        alias: 'v',
        describe: 'display docker build info',
        type: 'boolean',
      }),
  handler: async (argv: Options) => {
    const {
      name: packageName,
      directory: packageDirectory,
      buildDir,
      tag,
      verbose,
    } = argv

    await buildFromDir({
      packageName,
      packageDirectory,
      buildDirectory: buildDir,
      tag: typeof tag === 'string' ? tag : localTag(packageName),
      verbose,
    })
  },
}

export default buildCommand
