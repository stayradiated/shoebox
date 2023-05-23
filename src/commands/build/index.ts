import type { Argv, ArgumentsCamelCase } from 'yargs'
import { build } from '../../build.js'

export const command = 'build [name]'
export const describe = 'Build a package with docker'
export const builder = (yargs: Argv) =>
  yargs
    .option('name', {
      describe: 'name of the package',
      type: 'string',
      required: true,
    })
    .option('build-dir', {
      alias: 'd',
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
    })

type Options = ArgumentsCamelCase<{
  name: string
  buildDir?: string
  tag?: string
  verbose?: boolean
}>

export const handler = async (argv: Options) => {
  const { name, buildDir, tag, verbose } = argv

  await build({ name, buildDirectory: buildDir, tag, verbose })
}
