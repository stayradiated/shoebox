import { promises as fs } from 'node:fs'
import * as pathUtils from 'node:path'
import { execa } from 'execa'
import { temporaryDirectory } from 'tempy'
import * as generate from './generate.js'

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

type BuildOptions = {
  name: string
  buildDirectory?: string
  tag?: string
  verbose?: boolean
}

const build = async (options: BuildOptions) => {
  const { name, verbose, buildDirectory: optionsBuildDirectory } = options

  const tag = options.tag == null ? `local/${name}:${Date.now()}` : options.tag

  const isTemporaryDirectory = typeof optionsBuildDirectory !== 'string'
  const buildDirectory = isTemporaryDirectory
    ? temporaryDirectory()
    : optionsBuildDirectory

  const dockerfile = await generate.buildAll(name)
  const dockerfilePath = pathUtils.join(buildDirectory, 'Dockerfile')
  await fs.writeFile(dockerfilePath, dockerfile)

  try {
    await dockerBuild({ tag, buildDirectory, verbose })
  } catch (error: unknown) {
    const error_ =
      error &&
      typeof error === 'object' &&
      'shortMessage' in error &&
      typeof error.shortMessage === 'string'
        ? new Error(error.shortMessage)
        : error
    throw error_
  } finally {
    if (isTemporaryDirectory) {
      await fs.unlink(dockerfilePath)
      await fs.rmdir(buildDirectory)
    }
  }

  return {
    name,
    buildDirectory,
    tag,
  }
}

export { build }
