import type { CopyOptions } from '../types.js'

const formatCopy = (actions: CopyOptions[]): string[] => {
  return actions.map((action) => {
    const { from, chown, src, dest } = action
    const SEP = src.length <= 1 ? ' ' : ' \\\n  '
    const expandedSource = src.join(SEP)
    const fromFlag = from == null ? '' : ` --from=${from}`
    const chownFlag =
      typeof chown !== 'string' || chown.trim().length === 0 || chown === 'root'
        ? ''
        : ` --chown=${chown}`
    return `COPY${fromFlag}${chownFlag}${SEP}${expandedSource}${SEP}${dest}`
  })
}

export { formatCopy }
