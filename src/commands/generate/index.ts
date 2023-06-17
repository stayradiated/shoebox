import type { Argv, ArgumentsCamelCase } from 'yargs'
import { buildPackageFromDir } from '../../generate.js'

export const command = 'generate [package]'
export const describe = 'Generate a docker image for a package'
export const builder = (yargs: Argv) =>
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
    })

type Options = ArgumentsCamelCase<{
  package: string
  directory: string
}>

export const handler = async (argv: Options) => {
  const { package: packageName, directory: packageDirectory } = argv
  const dockerfile = await buildPackageFromDir({
    packageName,
    packageDirectory,
  })
  console.info(dockerfile)
}
