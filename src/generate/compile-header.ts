import type { Package } from '../types.js'

const compileHeader = (package_: Package): string[] => {
  const { name, fromImage, from, user, workdir } = package_
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
