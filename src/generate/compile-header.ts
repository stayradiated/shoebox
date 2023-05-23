import type { Package } from '../types.js'

const compileHeader = (pkg: Package): string[] => {
  const { name, fromImage, from, user, workdir } = pkg
  const headers = [
    '\n',
    `# ${name.toUpperCase()}`,
    `FROM ${fromImage || from} AS ${name}`,
  ]

  if (user != null) {
    headers.push(`USER ${user}`)
  }

  if (workdir != null) {
    headers.push(`WORKDIR ${workdir}`)
  }

  return headers
}

export { compileHeader }
