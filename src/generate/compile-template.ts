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
        (line) => line.trim().replace(/^\s*#.*$/gm, ''), // Remove comments
      )
      .filter((line) => line.length > 0)
      .map((line, index, lines) => {
        return (
          index < lines.length - 1 ? line.replace(/$/gm, ' && \\') : line
        ).replace(/^/gm, '  ') // Indent
      })
    lines.unshift('RUN \\')
    return lines
  })
}

export { compileTemplate }
