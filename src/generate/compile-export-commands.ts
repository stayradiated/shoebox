import type { Package, UserResolver, ExportsResolver } from '../types.js'
import { squashCopyBuildCommand } from './squash-copy-build-command.js'

const compileExportCommands = (options: {
  pkg: Package
  resolveUser: UserResolver
  resolveExports: ExportsResolver
}): string[] => {
  const { pkg, resolveUser, resolveExports } = options

  const initialUser = resolveUser(pkg)
  const exports = resolveExports(pkg)
  return squashCopyBuildCommand({ initialUser, exports })
}

export { compileExportCommands }
