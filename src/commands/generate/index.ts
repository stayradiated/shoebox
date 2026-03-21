import type { ArgumentsCamelCase, Argv } from 'yargs'
import { buildPackageFromDir } from '../../generate.ts'

type Options = ArgumentsCamelCase<{
  package: string
  directory: string
}>

const generateCommand = {
  command: 'generate [package]',
  describe: 'Generate a docker image for a package',
  builder: (yargs: Argv) =>
    yargs
      .positional('package', {
        describe: 'name of the package',
        type: 'string',
        required: true,
      })
      .option('directory', {
        alias: 'd',
        describe: 'path of the package directory',
        type: 'string',
        default: '.',
      }),
  handler: async (argv: Options) => {
    const { package: packageName, directory: packageDirectory } = argv
    const dockerfile = await buildPackageFromDir({
      packageName,
      packageDirectory,
    })
    console.info(dockerfile)
  },
}

export default generateCommand
