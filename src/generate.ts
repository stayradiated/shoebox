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

const readPackages = mem<[string], Promise<PackageMap>, string>(
  async (directory: string): Promise<PackageMap> => {
    const files = await walk.async(directory, {
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
  return mem<[string], Package, string>((name) => {
    if (packageMap.has(name) === false) {
      throw new Error(`Could not resolve package: "${name}"`)
    }
    return packageMap.get(name)
  })
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

const resolveDependencies: DependencyResolver = mem<
[Package, PackageResolver],
Package[],
string
>(
  (pkg, resolvePackage) => {
    if (pkg == null) {
      return []
    }

    return (pkg.dependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
  {
    cacheKey: ([pkg]) => pkg.name,
  },
)

const resolveDevDependencies: DependencyResolver = mem<
[Package, PackageResolver],
Package[],
string
>(
  (pkg, resolvePackage) => {
    if (pkg == null) {
      return []
    }

    return (pkg.devDependencies || []).map((dependencyName) => {
      return resolvePackage(dependencyName)
    })
  },
  {
    cacheKey: ([pkg]) => pkg.name,
  },
)

const resolveFrom: DependencyResolver = mem<
[Package, PackageResolver],
Package[],
string
>(
  (pkg, resolvePackage) => {
    if (pkg == null) {
      return []
    }

    if (pkg.from == null) {
      return []
    }

    return [resolvePackage(pkg.from)]
  },
  {
    cacheKey: ([pkg]) => pkg.name,
  },
)

type BaseExportDirResolver = (pkg: Package) => string

const createBaseExportDirResolver = (options: {
  resolvePackage: PackageResolver,
}): BaseExportDirResolver => {
  const { resolvePackage } = options

  const resolveBaseExportDir: BaseExportDirResolver = mem<
  [Package],
  string,
  string
  >(
    (pkg) => {
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
    },
    {
      cacheKey: ([pkg]) => pkg.name,
    },
  )
  return resolveBaseExportDir
}

type Export = {
  user: string,
  exports: {
    baseExportDir: string,
    filePaths: string[],
  }[],
}

type ExportsResolver = (pkg: Package) => Export[]

const appendExports = (a: Export[], b: Export[]): Export[] => {
  for (const b1 of b) {
    const a1 = a.find((x) => x.user === b1.user)
    if (a1 != null) {
      for (const b2 of b1.exports) {
        const a2 = a1.exports.find((x) => x.baseExportDir === b2.baseExportDir)
        if (a2 != null) {
          a2.filePaths = [
            ...new Set([...a2.filePaths, ...b2.filePaths]),
          ].sort((a, b) => a.localeCompare(b))
        } else {
          a1.exports.push(b2)
        }
      }
    } else {
      a.push(b1)
    }
  }

  return a
}

const createExportsResolver = (options: {
  resolvePackage: PackageResolver,
  resolveUser: UserResolver,
  resolveBaseExportDir: BaseExportDirResolver,
}): ExportsResolver => {
  const { resolvePackage, resolveUser, resolveBaseExportDir } = options

  const resolveExports: ExportsResolver = mem<[Package], Export[], string>(
    (pkg) => {
      const exports = [] as Export[]

      if (pkg.exports != null) {
        exports.push({
          user: resolveUser(pkg),
          exports: [
            {
              baseExportDir: resolveBaseExportDir(pkg),
              filePaths: pkg.exports,
            },
          ],
        })
      }

      if (pkg.dependencies != null) {
        pkg.dependencies.map((dependencyName) => {
          const dependency = resolvePackage(dependencyName)
          appendExports(exports, resolveExports(dependency))
        })
      }

      return exports
    },
    {
      cacheKey: ([pkg]) => pkg.name,
    },
  )

  return resolveExports
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
    const chownFlag =
      chown == null || chown === 'root' ? '' : ` --chown=${chown}`
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

const squashCopyBuildCommand = (options: {
  initialUser: string,
  exports?: Export[],
}): string[] => {
  const { initialUser, exports } = options

  if (exports == null) {
    return []
  }

  return exports
    .map(({ user, exports }) => {
      const commands = exports
        .map(({ baseExportDir, filePaths }) => {
          const actions = [] as { src: string[], dest: string }[]
          for (const srcFilePath of filePaths) {
            const dest = dirname(srcFilePath) + '/'
            const src = srcFilePath.replace(/\/\s*$/, '')
            const existingAction = actions.find(
              (action) => action.dest === dest,
            )
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

          const template = [
            `mkdir -p ${mkdirs.join(' ')}`,
            ...mvs.map((filePaths) => `mv ${filePaths.join(' ')}`),
          ].join('\n')

          return compileTemplate(template, {})
        })
        .flat()

      if (user !== initialUser) {
        commands.unshift(`USER ${user || 'root'}`)
      }

      return commands
    })
    .flat()
}

const squashCopyExports = (options: {
  from: string,
  exports: Export[],
}): CopyOptions[] => {
  const { from, exports } = options

  return exports
    .map(({ user, exports }) => {
      return exports.map(({ baseExportDir }) => {
        const src = baseExportDir.endsWith('/')
          ? baseExportDir
          : baseExportDir + '/'

        return {
          from,
          chown: user,
          src: [src],
          dest: '/',
        }
      })
    })
    .flat()
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

const compileEnv = (pkg: Package): string[] => {
  if (pkg.env == null || pkg.env.length === 0) {
    return []
  }

  const env = pkg.env
    .map(([key, value]) => {
      return `${key}=${value.replace(/\s/g, '\\ ')}`
    })
    .join(' \\\n  ')

  return [`ENV \\\n  ${env}`]
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

const compileExportCommands = (options: {
  pkg: Package,
  resolveUser: UserResolver,
  resolveExports: ExportsResolver,
}): string[] => {
  const { pkg, resolveUser, resolveExports } = options

  const initialUser = resolveUser(pkg)
  const exports = resolveExports(pkg)
  return squashCopyBuildCommand({ initialUser, exports })
}

const compileDependencies = (options: {
  pkg: Package,
  resolvePackage: PackageResolver,
  resolveExports: ExportsResolver,
}): string[] => {
  const { pkg, resolvePackage, resolveExports } = options

  const exportEnvLines = [] as string[]
  const installLines = [] as string[]

  const dependencies = [
    ...new Set([...(pkg.devDependencies || []), ...(pkg.dependencies || [])]),
  ]

  const lines = dependencies
    .map((dependencyName) => {
      const dependency = resolvePackage(dependencyName)
      const { name, install, exportEnv } = dependency

      const lines = [] as string[]

      if (name !== pkg.from) {
        lines.push(
          ...formatCopy(
            squashCopyExports({
              from: name,
              exports: resolveExports(dependency),
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

const createUserResolver = (options: {
  resolvePackage: PackageResolver,
}): UserResolver => {
  const { resolvePackage } = options

  const resolveUser: UserResolver = mem<[Package], string, string>(
    (pkg) => {
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
    },
    {
      cacheKey: ([pkg]) => pkg.name,
    },
  )
  return resolveUser
}

const build = (options: {
  pkg: Package,
  resolvePackage: PackageResolver,
  withExports: boolean,
}): string => {
  const { pkg, resolvePackage, withExports } = options

  const resolveUser = createUserResolver({ resolvePackage })
  const resolveBaseExportDir = createBaseExportDirResolver({ resolvePackage })
  const resolveExports = createExportsResolver({
    resolvePackage,
    resolveUser,
    resolveBaseExportDir,
  })

  const dockerfile: string[] = []

  dockerfile.push(...compileHeader(pkg))

  dockerfile.push(
    ...compileDependencies({
      pkg,
      resolvePackage,
      resolveExports,
    }),
  )

  dockerfile.push(...compileEnv(pkg))

  dockerfile.push(...compileRunCommands(pkg))

  if (withExports) {
    dockerfile.push(
      ...compileExportCommands({ pkg, resolveUser, resolveExports }),
    )
  }

  dockerfile.push(...compileFooter(pkg))

  return dockerfile.join(NL)
}

const buildAll = async (packageName: string) => {
  const packageMap = await readPackages('.')
  const resolvePackage = createPackageResolver(packageMap)
  const pkg = resolvePackage(packageName)

  const tree = resolveDependencyTree(
    pkg,
    composeResolvers(resolveFrom, resolveDevDependencies, resolveDependencies),
    resolvePackage,
  )

  const dependencies = tree.sort()

  let dockerfile = ''

  for (const dependency of dependencies) {
    const parents = tree.immediateDependents(dependency)

    let isInheritedFrom = false
    let isDependendOn = false
    for (const parent of parents) {
      if (parent.from === dependency.name) {
        isInheritedFrom = true
      }
      const parentDependencies = [
        ...(parent.dependencies || []),
        ...(parent.devDependencies || []),
      ]
      if (parentDependencies.includes(dependency.name)) {
        isDependendOn = true
      }
    }

    if (isInheritedFrom && isDependendOn) {
      throw new Error(
        `Package ${dependency.name} is both inherited and depended on`,
      )
    }

    dockerfile += await build({
      pkg: dependency,
      resolvePackage,
      withExports: isDependendOn,
    })
  }

  return dockerfile
}

export { buildAll }
