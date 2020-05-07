import { promises as fs } from 'fs'
import * as pathUtils from 'path'
import execa from 'execa'
import tempy from 'tempy'

import * as generate from './generate'

interface DockerBuildOptions {
  tag: string,
  buildDirectory: string,
  verbose?: boolean,
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
    dockerProcess.stdout.pipe(process.stdout)
  }

  dockerProcess.stderr.pipe(process.stderr)

  await dockerProcess
}

interface BuildOptions {
  name: string,
  buildDirectory?: string,
  tag?: string,
  verbose?: boolean,
}

const build = async (options: BuildOptions) => {
  const { name, verbose } = options

  const tag = options.tag == null ? `local/${name}:${Date.now()}` : options.tag

  const isTempDirectory = options.buildDirectory == null
  const buildDirectory = isTempDirectory
    ? tempy.directory()
    : options.buildDirectory

  const dockerfile = await generate.buildAll(name)
  const dockerfilePath = pathUtils.join(buildDirectory, 'Dockerfile')
  await fs.writeFile(dockerfilePath, dockerfile)

  try {
    await dockerBuild({ tag, buildDirectory, verbose })
  } catch (error) {
    if (error.hasOwnProperty('shortMessage')) {
      throw new Error(error.shortMessage)
    } else {
      throw error
    }
  } finally {
    if (isTempDirectory) {
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
