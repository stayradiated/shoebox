import { execa } from 'execa'

const byName = (a: string, b: string) => a.localeCompare(b)

type ContainerDiffReport = {
  Image1: string
  Image2: string
  DiffType: string
  Diff: {
    Adds: Array<{ Name: string; Size: number }>
    Dels: Array<{ Name: string; Size: number }>
    Mods: Array<{ Name: string; Size1: number; Size2: number }>
  }
}

type ContainerDiffStdout = ContainerDiffReport[]

type ContainerDiffOptions = {
  tagA: string
  tagB: string
  expand: string[]
}

const containerDiff = async (
  options: ContainerDiffOptions,
): Promise<string[]> => {
  const { tagA, tagB, expand } = options

  console.log(
    `container-diff diff daemon://${tagA} daemon://${tagB} --type=file --json`,
  )

  const containerDiffProcess = execa('container-diff', [
    'diff',
    `daemon://${tagA}`,
    `daemon://${tagB}`,
    '--type=file',
    '--json',
  ])

  containerDiffProcess.stderr?.pipe(process.stderr)

  const { stdout } = await containerDiffProcess
  let parsedStdout: ContainerDiffStdout
  try {
    parsedStdout = JSON.parse(stdout)
  } catch (error: unknown) {
    console.error('Could not parse JSON output from "container-diff".')
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(error.message)
    }

    return []
  }

  const report = parsedStdout[0]
  if (!report) {
    console.error('Could not find a report from "container-diff"')
    return []
  }

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

export { containerDiff }
