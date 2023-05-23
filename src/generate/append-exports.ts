import type { Export } from '../types.js'

const appendExports = (a: Export[], b: Export[]): Export[] => {
  for (const b1 of b) {
    const a1 = a.find((x) => x.user === b1.user)
    if (a1 == null) {
      a.push(b1)
    } else {
      for (const b2 of b1.exports) {
        const a2 = a1.exports.find((x) => x.baseExportDir === b2.baseExportDir)
        if (a2 == null) {
          a1.exports.push(b2)
        } else {
          a2.filePaths = [...new Set([...a2.filePaths, ...b2.filePaths])].sort(
            (a, b) => a.localeCompare(b),
          )
        }
      }
    }
  }

  return a
}

export { appendExports }
