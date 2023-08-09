import Handlebars from 'handlebars'

const compileTemplate = (
  templateString: string,
  variables: Record<string, string>,
): string[] => {
  const template = Handlebars.compile(templateString, {
    noEscape: true,
    strict: true,
    preventIndent: true,
  })
  const bashScript = template(variables)

  return bashScript.split('\n#RUN\n').flatMap((section) => {
    const lines = section
      .split('\n')
      .map(
        (line) => line.trim().replaceAll(/^\s*#.*$/gm, ''), // Remove comments
      )
      .filter((line) => line.length > 0)
      .map((line, index, lines) => {
        // Add backslash at the end of each line except the last one
        return (
          index < lines.length - 1 ? line.replaceAll(/$/gm, ' \\') : line
        ).replaceAll(/^/gm, '  ; ') // Indent
      })
    lines.unshift('RUN set -e \\')
    return lines
  })
}

export { compileTemplate }
