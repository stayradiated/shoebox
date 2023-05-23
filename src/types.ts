import type { z } from 'zod'
import type { $Package } from './schema.js'

export type Package = z.infer<typeof $Package>
export type PackageMap = Map<string, Package>
export type PackageResolver = (name: string) => Package

export type DependencyResolver = (
  pkg: Package,
  resolvePackage: PackageResolver,
) => Package[]

export type Export = {
  user: string
  exports: Array<{
    baseExportDir: string
    filePaths: string[]
  }>
}

export type ExportsResolver = (pkg: Package) => Export[]

export type UserResolver = (pkg: Package) => string

export type BaseExportDirResolver = (pkg: Package) => string

export type CopyOptions = {
  from?: string
  chown?: string
  src: string[]
  dest: string
}
