import add from '../../add'

export const command = 'add [name]'
export const describe = 'Create a new component'
export const builder = {
  type: {
    alias: 't',
    describe: 'type of template to use',
    type: 'string',
    required: true,
  },
  name: {
    describe: 'name of the package',
    type: 'string',
    required: true,
  },
}

interface Options {
  name: string,
  type: string,
}

export const handler = async (argv: Options) => {
  const { name, type } = argv
  await add({ name, type })
}
