import type { z } from 'zod'
import type { DGraph } from '@thi.ng/dgraph'
import type { $Package } from './schema.js'

export type Package = z.infer<typeof $Package>

export type PackageTree = DGraph<Package>

export type PackageInfo = {
  filepath: string
  content: string
  package: Package
}
export type PackageMap = Map<string, PackageInfo>

export type PackageResolver = (name: string) => Package

export type DependencyResolver = (
  package_: Package,
  resolvePackage: PackageResolver,
) => Package[]

export type Export = {
  user: string
  exports: Array<{
    baseExportDir: string
    filePaths: string[]
  }>
}

export type ExportsResolver = (package_: Package) => Export[]

export type UserResolver = (package_: Package) => string

export type BaseExportDirResolver = (package_: Package) => string

export type CopyOptions = {
  from?: string
  chown?: string
  src: string[]
  dest: string
}
