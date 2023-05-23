import { dirname, join } from 'node:path'
import type { Export } from '../types.js'
import { compileTemplate } from './compile-template.js'

const squashCopyBuildCommand = (options: {
  initialUser: string
  exports?: Export[]
}): string[] => {
  const { initialUser, exports } = options

  if (exports == null) {
    return []
  }

  return exports.flatMap(({ user, exports }) => {
    const commands = exports.flatMap(({ baseExportDir, filePaths }) => {
      const actions = [] as Array<{ src: string[]; dest: string }>
      for (const srcFilePath of filePaths) {
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

      const template = [
        `mkdir -p ${mkdirs.join(' ')}`,
        ...mvs.map((filePaths) => `mv ${filePaths.join(' ')}`),
      ].join('\n')

      return compileTemplate(template, {})
    })

    if (user !== initialUser) {
      commands.unshift(`USER ${user || 'root'}`)
    }

    return commands
  })
}

export { squashCopyBuildCommand }
