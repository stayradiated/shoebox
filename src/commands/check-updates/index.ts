import type { ArgumentsCamelCase, Argv } from 'yargs'
import { checkUpdates } from '../../check-updates/index.ts'

type Options = ArgumentsCamelCase<{
  name: string
  recursive?: boolean
  upgrade?: boolean
}>

const checkUpdatesCommand = {
  command: 'check-updates [name]',
  describe: 'Check if a new version of the package is available',
  builder: (yargs: Argv) =>
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
      }),

  handler: async (argv: Options) => {
    const { name: packageName, recursive, upgrade } = argv

    await checkUpdates({ packageName, recursive, upgrade })
  },
}

export default checkUpdatesCommand
