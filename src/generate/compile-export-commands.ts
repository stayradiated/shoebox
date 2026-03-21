import type { ExportsResolver, Package, UserResolver } from '#src/types.ts'
import { squashCopyBuildCommand } from './squash-copy-build-command.ts'

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
