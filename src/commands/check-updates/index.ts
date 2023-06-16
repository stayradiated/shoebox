import type { Argv, ArgumentsCamelCase } from 'yargs'
import { checkUpdates } from '../../check-updates/index.js'

export const command = 'check-updates [name]'
export const describe = 'Check if a new version of the package is available'
export const builder = (yargs: Argv) =>
  yargs
    .positional('name', {
      describe: 'name of the package',
      type: 'string',
      required: true,
    })
    .option('recursive', {
      alias: 'r',
      describe: 'check updates for all dependencies',
      type: 'boolean',
    })
    .option('upgrade', {
      alias: 'u',
      describe: 'write updated version to component file',
      type: 'boolean',
    })

type Options = ArgumentsCamelCase<{
  name: string
  recursive?: boolean
  upgrade?: boolean
}>

export const handler = async (argv: Options) => {
  const { name: packageName, recursive, upgrade } = argv

  await checkUpdates({ packageName, recursive, upgrade })
}
