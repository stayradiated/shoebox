import type { Argv, ArgumentsCamelCase } from 'yargs'
import add from '../../add.js'

export const command = 'add [name]'
export const describe = 'Create a new component'
export const builder = (yargs: Argv) =>
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
    })

type Options = ArgumentsCamelCase<{
  name: string
  type: string
}>

export const handler = async (argv: Options) => {
  const { name, type } = argv
  await add({ name, type })
}
