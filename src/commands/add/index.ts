import type { ArgumentsCamelCase, Argv } from 'yargs'
import add from '#src/add.ts'

type Options = ArgumentsCamelCase<{
  name: string
  type: string
}>

const addCommand = {
  command: 'add [name]',
  describe: 'Create a new component',
  builder: (yargs: Argv) =>
    yargs
      .option('type', {
        alias: 't',
        describe: 'type of template to use',
        type: 'string',
        required: true,
      })
      .option('name', {
        describe: 'name of the package',
        type: 'string',
        required: true,
      }),
  handler: async (argv: Options) => {
    const { name, type } = argv
    await add({ name, type })
  },
}

export default addCommand
