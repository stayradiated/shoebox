import type { CopyOptions, Export } from '../types.js'

const squashCopyExports = (options: {
  from: string
  exports: Export[]
}): CopyOptions[] => {
  const { from, exports } = options

  return exports.flatMap(({ user, exports }) => {
    return exports.map(({ baseExportDir }) => {
      const source = baseExportDir.endsWith('/')
        ? baseExportDir
        : baseExportDir + '/'

      return {
        from,
        chown: user,
        src: [source],
        dest: '/',
      }
    })
  })
}

export { squashCopyExports }
