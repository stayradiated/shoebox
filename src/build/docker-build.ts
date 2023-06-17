import { execa } from 'execa'

type DockerBuildOptions = {
  tag: string
  buildDirectory: string
  verbose?: boolean
}

const dockerBuild = async (options: DockerBuildOptions) => {
  const { tag, buildDirectory, verbose } = options
  const dockerProcess = execa('docker', [
    'build',
    '--squash',
    '-t',
    tag,
    buildDirectory,
  ])

  if (verbose) {
    dockerProcess.stdout?.pipe(process.stdout)
  }

  dockerProcess.stderr?.pipe(process.stderr)

  await dockerProcess
}

export { dockerBuild }
