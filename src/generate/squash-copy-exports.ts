import type { CopyOptions, Export } from '#src/types.ts'

const squashCopyExports = (options: {
  from: string
  exports: Export[]
}): CopyOptions[] => {
  const { from, exports } = options

  return exports.flatMap(({ user, exports }) => {
    return exports.map(({ baseExportDir }) => {
      const source = baseExportDir.endsWith('/')
        ? baseExportDir
        : `${baseExportDir}/`

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
