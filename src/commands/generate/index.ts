import type { Argv, ArgumentsCamelCase } from 'yargs'
import { buildAll } from '../../generate.js'

export const command = 'generate [package]'
export const describe = 'Generate a docker image for a package'
export const builder = (yargs: Argv) =>
  yargs.option('package', {
    describe: 'name of the package',
    type: 'string',
    required: true,
  })

type Options = ArgumentsCamelCase<{
  package: string
}>

export const handler = async (argv: Options) => {
  const { package: packageName } = argv
  const dockerfile = await buildAll(packageName)
  console.info(dockerfile)
}
