import type { Argv, ArgumentsCamelCase } from 'yargs'
import { diff } from '../../diff.js'

export const command = 'diff [packageA] [packageB]'
export const describe = 'Show a diff of two packages'
export const builder = (yargs: Argv) =>
  yargs
    .option('packageA', {
      describe: 'name of package A',
      type: 'string',
      required: true,
    })
    .option('packageB', {
      describe: 'name of package B',
      type: 'string',
      required: true,
    })
    .option('exclude', {
      describe: 'exclude globs from diff',
      type: 'array',
    })
    .option('expand', {
      describe: 'show files changed within folder',
      type: 'array',
    })
    .option('build-dir', {
      alias: 'd',
      describe: 'path of the build directory',
      type: 'string',
    })
    .option('verbose', {
      alias: 'v',
      describe: 'display docker build info',
      type: 'boolean',
    })

type Options = ArgumentsCamelCase<{
  packageA: string
  packageB: string
  exclude?: string[]
  expand?: string[]
  buildDir?: string
  verbose?: boolean
}>

export const handler = async (argv: Options) => {
  const { packageA, packageB, exclude, expand, buildDir, verbose } = argv
  const list = await diff({
    packageA,
    packageB,
    exclude,
    expand,
    buildDirectory: buildDir,
    verbose,
  })
  console.log(JSON.stringify(list, null, 2))
}
