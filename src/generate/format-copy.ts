import type { CopyOptions } from '../types.js'

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

export { formatCopy }
