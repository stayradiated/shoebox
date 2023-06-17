import { promises as fs } from 'node:fs'
import * as pathUtils from 'node:path'
import { temporaryDirectory } from 'tempy'
import * as generate from '../generate.js'
import type { PackageTree, PackageResolver } from '../types.js'
import { dockerBuild } from './docker-build.js'

type BuildOptions = {
  tree: PackageTree
  resolvePackage: PackageResolver
  tag: string

  buildDirectory?: string
  verbose?: boolean
}

const build = async (options: BuildOptions): Promise<void> => {
  const {
    verbose,
    tag,
    buildDirectory: optionsBuildDirectory,
    tree,
    resolvePackage,
  } = options

  const isTemporaryDirectory = typeof optionsBuildDirectory !== 'string'
  const buildDirectory = isTemporaryDirectory
    ? temporaryDirectory()
    : optionsBuildDirectory

  const dockerfile = await generate.buildAll({
    tree,
    resolvePackage,
  })
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
}

export { build }
