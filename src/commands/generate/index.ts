import { buildAll } from '../../generate'

export const command = 'generate [package]'
export const describe = 'Generate a docker image for a package'
export const builder = {
  package: {
    describe: 'name of the package',
    type: 'string',
    required: true,
  },
}

interface Options {
  package: string,
}

export const handler = async (argv: Options) => {
  const { package: packageName } = argv
  const dockerfile = await buildAll(packageName)
  console.info(dockerfile)
}
