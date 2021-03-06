import execa from 'execa'
import multimatch from 'multimatch'

import { build } from './build'

interface ContainerDiffReport {
  Image1: string,
  Image2: string,
  DiffType: string,
  Diff: {
    Adds: { Name: string, Size: number }[],
    Dels: { Name: string, Size: number }[],
    Mods: { Name: string, Size1: number, Size2: number }[],
  },
}

type ContainerDiffStdout = ContainerDiffReport[]

const byName = (a: string, b: string) => a.localeCompare(b)

interface ContainerDiffOptions {
  tagA: string,
  tagB: string,
  expand: string[],
}

const containerDiff = async (options: ContainerDiffOptions) => {
  const { tagA, tagB, expand } = options

  const containerDiffProcess = execa('container-diff', [
    'diff',
    `daemon://${tagA}`,
    `daemon://${tagB}`,
    '--type=file',
    '--json',
  ])

  containerDiffProcess.stderr.pipe(process.stderr)

  const { stdout } = await containerDiffProcess
  let parsedStdout: ContainerDiffStdout
  try {
    parsedStdout = JSON.parse(stdout)
  } catch (error) {
    console.error('Could not parse JSON output from "container-diff".')
    console.error(error.message)
    return
  }

  if (parsedStdout.length === 0) {
    console.error('Could not find a report from "container-diff"')
    return
  }

  const report = parsedStdout[0]

  const known = {
    directories: new Set<string>(),
    files: new Set<string>(),
  }

  const changedFiles = [
    ...(report.Diff.Adds || []),
    ...(report.Diff.Mods || []),
  ]

  changedFiles.forEach((file) => {
    const filepath = file.Name

    const matchesExpandPath = expand.some((expandPath) => {
      return expandPath.startsWith(filepath)
    })
    if (matchesExpandPath) {
      return
    }

    for (const path of known.directories) {
      if (filepath.startsWith(path)) {
        return
      }
    }
    for (const path of known.files) {
      if (filepath.startsWith(path + '/')) {
        known.files.delete(path)
        known.directories.add(path + '/')
        return
      }
    }

    known.files.add(filepath)
  })

  return [...known.directories, ...known.files].sort(byName)
}

const removeGlobs = (list: string[], globs: string[]) => {
  const negatedGlobs = globs.map((glob) =>
    glob.startsWith('!') ? glob : `!${glob}`,
  )
  return multimatch(list, ['**', ...negatedGlobs])
}

interface DiffOptions {
  packageA: string,
  packageB: string,
  exclude?: string[],
  expand?: string[],
  buildDirectory?: string,
  verbose?: boolean,
}

const diff = async (options: DiffOptions) => {
  const {
    packageA,
    packageB,
    exclude,
    expand = [],
    buildDirectory,
    verbose,
  } = options

  const { tag: tagA } = await build({ name: packageA, buildDirectory, verbose })
  const { tag: tagB } = await build({ name: packageB, buildDirectory, verbose })

  const result = await containerDiff({ tagA, tagB, expand })

  if (exclude == null || exclude.length === 0) {
    return result
  }

  return removeGlobs(result, exclude)
}

export { diff }
