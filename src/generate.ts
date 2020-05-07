/* eslint-disable max-lines */

import * as walk from 'walkdir'
import Handlebars from 'handlebars'
import { DGraph } from '@thi.ng/dgraph'
import mem from 'mem'
import { parse as parseTOML } from '@iarna/toml'
import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import chalk from 'chalk'

import { Package } from './types'

const IS_TOML = /\.toml$/

type PackageMap = Map<string, Package>
type PackageResolver = (name: string) => Package

class InvalidPackage extends Error {
  filepath: string
  constructor (message: string, filepath: string) {
    super(message)
    this.filepath = filepath
  }
  toString () {
    return `Invalid Package: "${this.filepath}"\n${super.toString()}`
  }
}

const NL = '\n'

const isNonEmptyString = (value: string) => {
  return typeof value === 'string' && value.trim().length > 0
}
const isOptionalArray = (value: string[]) => {
  return (
    value == null || (Array.isArray(value) && value.every(isNonEmptyString))
  )
}

const assertValidPackage = (pkg: Package, filepath: string) => {
  if (!isNonEmptyString(pkg.name)) {
    throw new InvalidPackage('Invalid "name".', filepath)
  }
  if (!(isNonEmptyString(pkg.from) || isNonEmptyString(pkg.fromImage))) {
    throw new InvalidPackage('Invalid "from".', filepath)
  }
  if (!isOptionalArray(pkg.dependencies)) {
    throw new InvalidPackage('Invalid "dependencies".', filepath)
  }
  if (!isOptionalArray(pkg.devDependencies)) {
    throw new InvalidPackage('Missing "devDependencies".', filepath)
  }
}

const readPackages = mem(
  async (): Promise<PackageMap> => {
    const files = await walk.async('.', {
      return_object: true,
      follow_symlinks: true,
      max_depth: 2,
    })

    const packageMap: PackageMap = new Map()

    await Promise.all(
      Object.keys(files).map(async (filepath) => {
        try {
          if (IS_TOML.test(filepath) === false) {
            return null
          }

          const body = await fs.readFile(filepath, 'utf8')

          let pkg: Package

          try {
            pkg = (parseTOML(body) as unknown) as Package
          } catch (error) {
            throw new InvalidPackage(error.message, filepath)
          }

          assertValidPackage(pkg, filepath)

          packageMap.set(pkg.name, pkg)
        } catch (error) {
          if (error instanceof InvalidPackage) {
            console.error(chalk.red(error.toString()))
          }
        }
      }),
    )

    return packageMap
  },
)

const createPackageResolver = (packageMap: PackageMap): PackageResolver => {
  return (name) => {
    if (packageMap.has(name) === false) {
      throw new Error(`Could not resolve package: "${name}"`)
    }
    return packageMap.get(name)
  }
}

type DependencyResolver = (
  pkg: Package,
  resolvePackage: PackageResolver,
) => Package[]

const composeResolvers = (
  ...resolvers: DependencyResolver[]
): DependencyResolver => {
  return (pkg, resolvePackage) => {
    const set = resolvers.reduce<Set<Package>>((set, resolver) => {
      resolver(pkg, resolvePackage).forEach((item) => set.add(item))
      return set
    }, new Set())
    return [...set]
  }
}

const resolveDependencies: DependencyResolver = mem((pkg, resolvePackage) => {
  if (pkg == null) {
    return []
  }

  return (pkg.dependencies || []).map((dependencyName) => {
    return resolvePackage(dependencyName)
  })
})

const resolveDevDependencies: DependencyResolver = mem(
  (pkg, resolvePackage) => {
    if (pkg == null) {
      return []
    }

    return (pkg.devDependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
)

const resolveFrom: DependencyResolver = mem((pkg, resolvePackage) => {
  if (pkg == null) {
    return []
  }

  if (pkg.from == null) {
    return []
  }

  return [resolvePackage(pkg.from)]
})

type BaseExportDirResolver = (pkg: Package) => string

const createBaseExportDirResolver = (
  resolvePackage: PackageResolver,
): BaseExportDirResolver => {
  const resolveBaseExportDir: BaseExportDirResolver = (pkg) => {
    if (pkg.baseExportDir != null) {
      return pkg.baseExportDir
    }

    if (pkg.from != null) {
      const parent = resolvePackage(pkg.from)
      const user = resolveBaseExportDir(parent)
      if (user != null) {
        return user
      }
    }

    throw new Error(`Could not resolve baseExportDir for ${pkg.name}`)
  }
  return resolveBaseExportDir
}

interface BuildDependencyGraphOptions {
  package: Package,
  getDependencies: DependencyResolver,
  resolvePackage: PackageResolver,
  graph: DGraph<Package>,
}

const buildDependencyGraph = (
  options: BuildDependencyGraphOptions,
): DGraph<Package> => {
  const { package: pkg, getDependencies, resolvePackage, graph } = options

  graph.addNode(pkg)

  const dependencies = getDependencies(pkg, resolvePackage)
  for (const dependency of dependencies) {
    graph.addDependency(pkg, dependency)
    buildDependencyGraph({
      package: dependency,
      getDependencies,
      resolvePackage,
      graph,
    })
  }
  return graph
}

const resolveDependencyTree = (
  pkg: Package,
  getDependencies: DependencyResolver,
  resolvePackage: PackageResolver,
): DGraph<Package> => {
  const graph = new DGraph<Package>()
  buildDependencyGraph({
    package: pkg,
    getDependencies,
    resolvePackage,
    graph,
  })
  return graph
}

interface CopyOptions {
  from?: string,
  chown?: string,
  src: string[],
  dest: string,
}

const formatCopy = (actions: CopyOptions[]): string[] => {
  return actions.map((action) => {
    const { from, chown, src, dest } = action
    const SEP = src.length <= 1 ? ' ' : ' \\\n  '
    const expandedSrc = src.join(SEP)
    const fromFlag = from == null ? '' : ` --from=${from}`
    const chownFlag = chown == null ? '' : ` --chown=${chown}`
    return `COPY${fromFlag}${chownFlag}${SEP}${expandedSrc}${SEP}${dest}`
  })
}

const compileTemplate = (
  templateString: string,
  variables: Record<string, string>,
): string[] => {
  const template = Handlebars.compile(templateString, {
    noEscape: true,
    strict: true,
    preventIndent: true,
  })
  const bashScript = template(variables)

  return bashScript
    .split('\n#RUN\n')
    .map((section) => {
      const lines = section
        .split('\n')
        .map(
          (line) => line.trim().replace(/^\s*#.*$/gm, ''), // remove comments
        )
        .filter((line) => line.length > 0)
        .map((line, index, lines) => {
          return (index < lines.length - 1
            ? line.replace(/$/gm, ' && \\')
            : line
          ).replace(/^/gm, '  ') // indent
        })
      lines.unshift('RUN \\')
      return lines
    })
    .flat()
}

const squashCopyBuildCommand = (
  baseExportDir: string,
  pkg: Package,
): string[] => {
  if (pkg.exports == null || pkg.exports.length === 0) {
    return []
  }

  const actions = [] as { src: string[], dest: string }[]
  for (const srcFilePath of pkg.exports) {
    const dest = dirname(srcFilePath) + '/'
    const src = srcFilePath.replace(/\/\s*$/, '')
    const existingAction = actions.find((action) => action.dest === dest)
    if (existingAction) {
      existingAction.src.push(src)
    } else {
      actions.push({ src: [src], dest })
    }
  }

  const mkdirs = [] as string[]
  const mvs = [] as string[][]
  for (const action of actions) {
    const exportDir = join(baseExportDir, action.dest)
    mkdirs.push(exportDir)
    mvs.push([...action.src, exportDir])
  }

  return compileTemplate(
    `
      mkdir -p ${mkdirs.join(' ')}
      ${mvs.map((filePaths) => `mv ${filePaths.join(' ')}`).join('\n')}
    `,
    {},
  )
}

const squashCopyExports = (options: {
  from: string,
  chown?: string,
  baseExportDir: string,
  files: Array<string | [string, string]>,
}): CopyOptions[] => {
  const { from, chown, baseExportDir, files } = options

  if (files.length === 0) {
    return []
  }

  const src = baseExportDir.endsWith('/') ? baseExportDir : baseExportDir + '/'

  return [
    {
      from,
      chown,
      src: [src],
      dest: '/',
    },
  ]
}

const compileHeader = (pkg: Package): string[] => {
  const { name, fromImage, from, user, workdir } = pkg
  const headers = [
    '\n',
    `# ${name.toUpperCase()}`,
    `FROM ${fromImage || from} AS ${name}`,
  ]

  if (user != null) {
    headers.push(`USER ${user}`)
  }
  if (workdir != null) {
    headers.push(`WORKDIR ${workdir}`)
  }
  return headers
}

const compileFooter = (pkg: Package): string[] => {
  const { command } = pkg
  const lines = [] as string[]
  if (command != null) {
    lines.push(`CMD ${command}`)
  }
  return lines
}

const compileRunCommands = (pkg: Package): string[] => {
  if (pkg.build == null) {
    return []
  }
  const variables = {
    VERSION: pkg.version,
  }
  return compileTemplate(pkg.build, variables)
}

const compileExportCommands = (
  pkg: Package,
  resolveBaseExportDir: BaseExportDirResolver,
): string[] => {
  const baseExportDir = resolveBaseExportDir(pkg)
  return squashCopyBuildCommand(baseExportDir, pkg)
}

const compileDependencies = (
  pkg: Package,
  dependencies: Package[],
  resolveUser: UserResolver,
  resolveBaseExportDir: BaseExportDirResolver,
): string[] => {
  const exportEnvLines = [] as string[]
  const installLines = [] as string[]

  const lines = dependencies
    .sort((a, b) => b.name.localeCompare(a.name))
    .map((dependency) => {
      const {
        name,
        install,
        includeDocs,
        exports = [],
        docs = [],
        exportEnv,
      } = dependency

      const lines = [] as string[]

      if (dependency.name !== pkg.from) {
        const user = resolveUser(dependency)
        const baseExportDir = resolveBaseExportDir(dependency)

        const files = includeDocs ? [...docs, ...exports] : exports

        lines.push(
          ...formatCopy(
            squashCopyExports({
              from: name,
              chown: user,
              baseExportDir,
              files,
            }),
          ),
        )

        if (install) {
          installLines.push(...compileTemplate(install, {}))
        }
      }

      if (exportEnv && exportEnv.length > 0) {
        const env = exportEnv
          .map(([key, value]) => {
            return `${key}=${value.replace(/\s/g, '\\ ')}`
          })
          .join(' \\\n  ')
        exportEnvLines.push(`ENV \\\n  ${env}`)
      }

      return lines
    })
    .flat()

  if (pkg.mount != null) {
    lines.push(
      ...formatCopy(
        pkg.mount.map(([src, dest]) => ({
          src: [src],
          dest,
        })),
      ),
    )
  }

  lines.push(...exportEnvLines)
  lines.push(...installLines)

  return lines
}

type UserResolver = (pkg: Package) => string

const createUserResolver = (resolvePackage: PackageResolver): UserResolver => {
  const resolveUser: UserResolver = (pkg) => {
    if (pkg.user != null) {
      return pkg.user
    }

    if (pkg.from != null) {
      const parent = resolvePackage(pkg.from)
      const user = resolveUser(parent)
      if (user != null) {
        return user
      }
    }

    return null
  }
  return resolveUser
}

const difference = <T>(setA: Set<T>, setB: Set<T>): Set<T> => {
  const d = new Set<T>(setA)
  for (const elem of setB) {
    d.delete(elem)
  }
  return d
}

const build = (options: {
  pkg: Package,
  resolvePackage: PackageResolver,
  intermediary: boolean,
}): string => {
  const { pkg, resolvePackage, intermediary } = options

  const dockerfile: string[] = []
  dockerfile.push(...compileHeader(pkg))

  const tree = resolveDependencyTree(pkg, resolveDependencies, resolvePackage)
  const dependencies = tree.transitiveDependencies(pkg)

  resolveDevDependencies(pkg, resolvePackage).forEach((dependency) => {
    dependencies.add(dependency)
    const tree = resolveDependencyTree(
      dependency,
      resolveDependencies,
      resolvePackage,
    )
    const devDepDeps = tree.transitiveDependencies(dependency)
    devDepDeps.forEach((dependency) => {
      dependencies.add(dependency)
    })
  })

  let includedDependencies: Set<Package>
  if (pkg.from != null) {
    const from = resolvePackage(pkg.from)
    dependencies.add(from)

    const fromTree = resolveDependencyTree(
      from,
      composeResolvers(resolveFrom, resolveDependencies),
      resolvePackage,
    )
    includedDependencies = fromTree.transitiveDependencies(from)
  }

  const requiredDependencies =
    includedDependencies == null
      ? dependencies
      : difference(dependencies, includedDependencies)

  const resolveUser = createUserResolver(resolvePackage)
  const resolveBaseExportDir = createBaseExportDirResolver(resolvePackage)

  dockerfile.push(
    ...compileDependencies(
      pkg,
      [...requiredDependencies],
      resolveUser,
      resolveBaseExportDir,
    ),
  )
  dockerfile.push(...compileRunCommands(pkg))
  if (intermediary) {
    dockerfile.push(...compileExportCommands(pkg, resolveBaseExportDir))
  }
  dockerfile.push(...compileFooter(pkg))

  return dockerfile.join(NL)
}

const buildAll = async (packageName: string) => {
  const packageMap = await readPackages()
  const resolvePackage = createPackageResolver(packageMap)
  const pkg = resolvePackage(packageName)

  let dockerfile = ''

  const bigTree = resolveDependencyTree(
    pkg,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )
  const dependencies = bigTree.sort()

  for (const dependency of dependencies) {
    const intermediary = dependency !== pkg
    dockerfile += await build({ pkg: dependency, resolvePackage, intermediary })
  }

  return dockerfile
}

export { buildAll }
