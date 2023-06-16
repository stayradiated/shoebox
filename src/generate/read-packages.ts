import { promises as fs } from 'node:fs'
import walk from 'walkdir'
import mem from 'mem'
import { parse as parseTOML } from '@iarna/toml'
import chalk from 'chalk'
import type { PackageMap } from '../types.js'
import { $Package } from '../schema.js'
import { InvalidPackageError } from './errors.js'

const readPackages = mem(async (directory: string): Promise<PackageMap> => {
  const files = await walk.async(directory, {
    return_object: true,
    follow_symlinks: true,
    max_depth: 2,
  })

  const packageMap: PackageMap = new Map()

  await Promise.all(
    Object.keys(files).map(async (filepath): Promise<void> => {
      try {
        if (!filepath.endsWith('.toml')) {
          return
        }

        const body = await fs.readFile(filepath, 'utf8')

        const rawPkg = parseTOML(body) as unknown
        const result = $Package.safeParse(rawPkg)
        if (!result.success) {
          throw new InvalidPackageError(result.error.message, filepath)
        }

        const pkg = result.data

        packageMap.set(pkg.name, {
          filepath,
          content: body,
          package: pkg,
        })
      } catch (error) {
        if (error instanceof InvalidPackageError) {
          console.error(chalk.red(error.toString()))
        } else {
          throw error
        }
      }
    }),
  )

  return packageMap
})

export { readPackages }
