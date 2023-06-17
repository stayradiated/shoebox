import multimatch from 'multimatch'

const removeGlobs = (list: string[], globs: string[]) => {
  const negatedGlobs = globs.map((glob) =>
    glob.startsWith('!') ? glob : `!${glob}`,
  )
  return multimatch(list, ['**', ...negatedGlobs])
}

export { removeGlobs }
